import { app, shell, BrowserWindow } from 'electron';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { UpdateInfo } from '../types';

const GITHUB_REPO = 'krantjohn/trivideo';
const RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const RELEASES_PAGE_URL = `https://github.com/${GITHUB_REPO}/releases`;

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
      this.currentVersion = '1.0.2';
    }
  }

  public setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win;
  }

  public getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Check latest release from GitHub API
   */
  public async checkForUpdates(): Promise<UpdateInfo> {
    const current = this.getCurrentVersion();
    const fallback: UpdateInfo = {
      hasUpdate: false,
      currentVersion: current,
      latestVersion: current,
      releaseName: `TriVideo v${current}`,
      releaseNotes: '当前已是最新版本',
      releaseUrl: RELEASES_PAGE_URL,
      downloadUrl: null,
      publishedAt: new Date().toISOString(),
    };

    return new Promise<UpdateInfo>((resolve) => {
      const options = {
        headers: {
          'User-Agent': 'TriVideo-App-Updater',
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 8000,
      };

      const req = https.get(RELEASES_API_URL, options, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
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
        console.warn('[AppUpdater] Failed to fetch latest release:', err.message);
        resolve(fallback);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(fallback);
      });
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
        const release = JSON.parse(rawData);
        const tag = (release.tag_name || '').replace(/^v/, '');
        const hasUpdate = tag ? compareVersions(tag, current) > 0 : false;

        let downloadUrl: string | null = null;
        if (Array.isArray(release.assets)) {
          // Find Windows Setup installer asset
          const setupAsset = release.assets.find(
            (a: any) =>
              typeof a.name === 'string' &&
              a.name.endsWith('.exe') &&
              (a.name.includes('Setup') || a.name.includes('setup') || a.name.includes('安装'))
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
          releaseName: release.name || `TriVideo v${tag || current}`,
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
   * Download the latest Setup installer and run it to overwrite install
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
      // Fallback: Open GitHub releases page
      shell.openExternal(RELEASES_PAGE_URL);
      return { success: true, message: '已在浏览器打开更新发布页面' };
    }

    this.isDownloading = true;
    const tempInstallerPath = path.join(os.tmpdir(), `TriVideo-Setup-Update-${Date.now()}.exe`);

    return new Promise((resolve) => {
      this.downloadFileWithRedirects(
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
            console.warn('[AppUpdater] Download failed:', err.message);
            shell.openExternal(RELEASES_PAGE_URL);
            resolve({
              success: false,
              message: `下载更新安装包失败: ${err.message}，已为您在浏览器打开下载页`,
            });
          } else {
            // Overwrite Installation Execution:
            // Launch the NSIS installer so it replaces the existing files cleanly.
            try {
              console.log('[AppUpdater] Download complete, launching installer:', tempInstallerPath);
              const child = spawn(tempInstallerPath, [], {
                detached: true,
                stdio: 'ignore',
              });
              child.unref();

              // Terminate current running instance to allow overwrite
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
        }
      );
    });
  }

  private downloadFileWithRedirects(
    url: string,
    dest: string,
    onProgress: (p: { percent: number; transferred: number; total: number }) => void,
    onComplete: (err: Error | null) => void,
    redirectCount = 0
  ): void {
    if (redirectCount > 5) {
      onComplete(new Error('Too many redirects while downloading update'));
      return;
    }

    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'TriVideo-App-Updater',
      },
      timeout: 30000,
    };

    const req = client.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        const nextUrl = res.headers.location;
        if (nextUrl) {
          this.downloadFileWithRedirects(nextUrl, dest, onProgress, onComplete, redirectCount + 1);
          return;
        }
      }

      if (res.statusCode !== 200) {
        onComplete(new Error(`Server returned HTTP ${res.statusCode}`));
        return;
      }

      const total = parseInt(res.headers['content-length'] || '0', 10);
      let transferred = 0;
      const fileStream = fs.createWriteStream(dest);

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
