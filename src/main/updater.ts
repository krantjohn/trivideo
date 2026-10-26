import { app, shell, BrowserWindow } from 'electron';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { UpdateInfo } from '../types';

const GITHUB_REPO = 'krantjohn/trivideo';
// Query release list with per_page=5 and cache-buster to prevent GitHub CDN caching delay
const RELEASES_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/releases`;
const RELEASES_PAGE_URL = `https://github.com/${GITHUB_REPO}/releases`;

// High-speed persistent agent with connection pooling
const speedAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 32,
  keepAliveMsecs: 60000,
  timeout: 30000,
});

/**
 * Compare semantic versions. Returns:
 *  1 if v1 > v2
 * -1 if v1 < v2
 *  0 if v1 == v2
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/, '').trim();
  const clean2 = v2.replace(/^v/, '').trim();

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);

  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export class AppUpdater {
  private mainWindow?: BrowserWindow;
  private isDownloading: boolean = false;
  private currentVersion: string;

  constructor(mainWindow?: BrowserWindow) {
    this.mainWindow = mainWindow;
    try {
      this.currentVersion = app.getVersion();
    } catch {
      this.currentVersion = '1.5.0';
    }
  }

  public setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win;
  }

  public getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Check latest release from GitHub API with cache-busting and mirror fallback
   */
  public async checkForUpdates(): Promise<UpdateInfo> {
    const current = this.getCurrentVersion();
    const fallback: UpdateInfo = {
      hasUpdate: false,
      currentVersion: current,
      latestVersion: current,
      releaseName: `同画 v${current}`,
      releaseNotes: '当前已是最新版本',
      releaseUrl: RELEASES_PAGE_URL,
      downloadUrl: null,
      publishedAt: new Date().toISOString(),
    };

    // Use fresh query with timestamp to completely bypass CDN caching
    const timestamp = Date.now();
    const apiUrl = `${RELEASES_API_BASE}?per_page=5&_nocache=${timestamp}`;

    return new Promise<UpdateInfo>((resolve) => {
      const options = {
        agent: speedAgent,
        headers: {
          'User-Agent': 'TongHua-App-Updater/1.5',
          Accept: 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        timeout: 10000,
      };

      const req = https.get(apiUrl, options, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            https.get(redirectUrl, options, (redirectRes) => {
              this.parseReleaseResponse(redirectRes, current, resolve, fallback);
            }).on('error', () => resolve(fallback));
            return;
          }
        }
        this.parseReleaseResponse(res, current, resolve, fallback);
      });

      req.on('error', (err) => {
        console.warn('[AppUpdater] Direct fetch error, trying fallback:', err.message);
        // Fallback to latest endpoint if query fails
        this.fetchFallbackLatest(current, resolve, fallback);
      });

      req.on('timeout', () => {
        req.destroy();
        this.fetchFallbackLatest(current, resolve, fallback);
      });
    });
  }

  private fetchFallbackLatest(
    current: string,
    resolve: (info: UpdateInfo) => void,
    fallback: UpdateInfo
  ): void {
    const fallbackUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest?_t=${Date.now()}`;
    const req = https.get(
      fallbackUrl,
      {
        agent: speedAgent,
        headers: {
          'User-Agent': 'TongHua-App-Updater/1.5',
          Accept: 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache',
        },
        timeout: 8000,
      },
      (res) => {
        this.parseReleaseResponse(res, current, resolve, fallback);
      }
    );
    req.on('error', () => resolve(fallback));
    req.on('timeout', () => {
      req.destroy();
      resolve(fallback);
    });
  }

  private parseReleaseResponse(
    res: http.IncomingMessage,
    current: string,
    resolve: (info: UpdateInfo) => void,
    fallback: UpdateInfo
  ): void {
    if (res.statusCode !== 200) {
      resolve(fallback);
      return;
    }

    let rawData = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      rawData += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(rawData);
        // Can be array (from /releases) or object (from /releases/latest)
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const validList = list.filter((r) => r && !r.draft);
        const release = validList[0];

        if (!release) {
          resolve(fallback);
          return;
        }

        const tag = (release.tag_name || '').replace(/^v/, '');
        const hasUpdate = tag ? compareVersions(tag, current) > 0 : false;

        let downloadUrl: string | null = null;
        if (Array.isArray(release.assets)) {
          // Find Windows Setup installer asset
          const setupAsset = release.assets.find(
            (a: any) =>
              typeof a.name === 'string' &&
              a.name.endsWith('.exe') &&
              (a.name.includes('Setup') || a.name.includes('setup') || a.name.includes('安装') || a.name.includes('同画'))
          );
          if (setupAsset && setupAsset.browser_download_url) {
            downloadUrl = setupAsset.browser_download_url;
          } else {
            const anyExe = release.assets.find(
              (a: any) => typeof a.name === 'string' && a.name.endsWith('.exe')
            );
            if (anyExe && anyExe.browser_download_url) {
              downloadUrl = anyExe.browser_download_url;
            }
          }
        }

        resolve({
          hasUpdate,
          currentVersion: current,
          latestVersion: tag || current,
          releaseName: release.name || `同画 v${tag || current}`,
          releaseNotes: release.body || '新版本功能增强与优化',
          releaseUrl: release.html_url || RELEASES_PAGE_URL,
          downloadUrl: downloadUrl || release.html_url || RELEASES_PAGE_URL,
          publishedAt: release.published_at || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[AppUpdater] Failed to parse release JSON:', err);
        resolve(fallback);
      }
    });
  }

  /**
   * Download the latest Setup installer with maximum speed and launch overwrite install
   */
  public async downloadAndInstall(targetDownloadUrl?: string): Promise<{ success: boolean; message: string }> {
    if (this.isDownloading) {
      return { success: false, message: '已有更新任务正在下载中' };
    }

    let downloadUrl = targetDownloadUrl;
    if (!downloadUrl) {
      const info = await this.checkForUpdates();
      downloadUrl = info.downloadUrl || undefined;
    }

    if (!downloadUrl || !downloadUrl.startsWith('http')) {
      shell.openExternal(RELEASES_PAGE_URL);
      return { success: true, message: '已在浏览器打开更新发布页面' };
    }

    this.isDownloading = true;
    const tempInstallerPath = path.join(os.tmpdir(), `TongHua-Setup-Update-${Date.now()}.exe`);

    return new Promise((resolve) => {
      this.downloadFileWithSpeed(
        downloadUrl!,
        tempInstallerPath,
        (progress) => {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('updater:download-progress', progress);
          }
        },
        (err) => {
          this.isDownloading = false;
          if (err) {
            console.warn('[AppUpdater] Primary download failed, attempting mirror:', err.message);
            // Try mirror acceleration download
            const mirrorUrl = `https://ghproxy.net/${downloadUrl}`;
            this.downloadFileWithSpeed(
              mirrorUrl,
              tempInstallerPath,
              (progress) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                  this.mainWindow.webContents.send('updater:download-progress', progress);
                }
              },
              (mirrorErr) => {
                if (mirrorErr) {
                  console.warn('[AppUpdater] Mirror download failed:', mirrorErr.message);
                  shell.openExternal(RELEASES_PAGE_URL);
                  resolve({
                    success: false,
                    message: `下载更新安装包失败: ${mirrorErr.message}，已为您在浏览器打开下载页`,
                  });
                } else {
                  this.launchInstallerAndQuit(tempInstallerPath, resolve);
                }
              }
            );
          } else {
            this.launchInstallerAndQuit(tempInstallerPath, resolve);
          }
        }
      );
    });
  }

  private launchInstallerAndQuit(
    tempInstallerPath: string,
    resolve: (res: { success: boolean; message: string }) => void
  ): void {
    try {
      console.log('[AppUpdater] Download complete, launching installer:', tempInstallerPath);
      const child = spawn(tempInstallerPath, [], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      setTimeout(() => {
        app.quit();
      }, 1000);

      resolve({
        success: true,
        message: '更新包已下载完成，正在退出当前程序并启动覆盖安装向导...',
      });
    } catch (spawnErr: any) {
      shell.openExternal(tempInstallerPath);
      resolve({
        success: true,
        message: `已下载完成，请手动运行安装包: ${tempInstallerPath}`,
      });
    }
  }

  /**
   * Fast unthrottled streaming download with large buffer
   */
  private downloadFileWithSpeed(
    url: string,
    dest: string,
    onProgress: (p: { percent: number; transferred: number; total: number }) => void,
    onComplete: (err: Error | null) => void,
    redirectCount = 0
  ): void {
    if (redirectCount > 8) {
      onComplete(new Error('Too many redirects while downloading update'));
      return;
    }

    const client = url.startsWith('https') ? https : http;
    const options: any = {
      agent: speedAgent,
      headers: {
        'User-Agent': 'TongHua-App-Updater/1.5',
        Accept: '*/*',
      },
      timeout: 45000,
    };

    const req = client.get(url, options, (res) => {
      if (
        res.statusCode === 301 ||
        res.statusCode === 302 ||
        res.statusCode === 307 ||
        res.statusCode === 308
      ) {
        const nextUrl = res.headers.location;
        if (nextUrl) {
          this.downloadFileWithSpeed(nextUrl, dest, onProgress, onComplete, redirectCount + 1);
          return;
        }
      }

      if (res.statusCode !== 200) {
        onComplete(new Error(`Server returned HTTP ${res.statusCode}`));
        return;
      }

      const total = parseInt(res.headers['content-length'] || '0', 10);
      let transferred = 0;
      // 1MB disk buffer for high-throughput unthrottled writing
      const fileStream = fs.createWriteStream(dest, { highWaterMark: 1024 * 1024 });

      res.on('data', (chunk) => {
        transferred += chunk.length;
        const percent = total > 0 ? Math.min(100, Math.round((transferred / total) * 100)) : 0;
        onProgress({ percent, transferred, total });
      });

      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => onComplete(null));
      });

      fileStream.on('error', (err) => {
        fs.unlink(dest, () => {});
        onComplete(err);
      });
    });

    req.setNoDelay(true);

    req.on('error', (err) => {
      fs.unlink(dest, () => {});
      onComplete(err);
    });

    req.on('timeout', () => {
      req.destroy();
      fs.unlink(dest, () => {});
      onComplete(new Error('Download connection timed out'));
    });
  }
}
