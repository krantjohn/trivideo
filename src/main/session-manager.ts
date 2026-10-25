import { session, Session } from 'electron';
import { PlatformId, PlatformSessionStatus } from '../types';

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export class SessionManager {
  private sessions: Map<PlatformId, Session> = new Map();

  constructor() {
    this.initSessions();
  }

  private initSessions(): void {
    const platforms: PlatformId[] = ['douyin', 'bilibili', 'xiaohongshu'];

    for (const p of platforms) {
      const partitionName = `persist:${p}`;
      const ses = session.fromPartition(partitionName, { cache: true });

      // Apply standard modern Chrome user agent
      ses.setUserAgent(CHROME_USER_AGENT);

      // Handle permissions safely
      ses.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'mediaKeySystem', 'fullscreen'];
        if (allowedPermissions.includes(permission)) {
          callback(true);
        } else {
          callback(false);
        }
      });

      // Filter unwanted popups and downloads
      ses.on('will-download', (event, item) => {
        // Allow user downloads
        console.log(`[${p}] Download requested: ${item.getFilename()}`);
      });

      this.sessions.set(p, ses);
    }
  }

  public getSession(platform: PlatformId): Session {
    let ses = this.sessions.get(platform);
    if (!ses) {
      ses = session.fromPartition(`persist:${platform}`, { cache: true });
      ses.setUserAgent(CHROME_USER_AGENT);
      this.sessions.set(platform, ses);
    }
    return ses;
  }

  public async getSessionStatus(platform: PlatformId): Promise<PlatformSessionStatus> {
    const ses = this.getSession(platform);
    try {
      const cookies = await ses.cookies.get({});
      let isLoggedIn = false;
      let accountName: string | undefined;

      if (platform === 'bilibili') {
        const sessdata = cookies.find((c) => c.name === 'SESSDATA');
        const dedeId = cookies.find((c) => c.name === 'DedeUserID');
        isLoggedIn = Boolean(sessdata && sessdata.value);
        if (dedeId && dedeId.value) {
          accountName = `UID: ${dedeId.value}`;
        }
      } else if (platform === 'douyin') {
        const sessionid = cookies.find((c) => c.name === 'sessionid' || c.name === 'sessionid_ss');
        const uid = cookies.find((c) => c.name === 'passport_auth_status' || c.name === 'passport_auth_status_ss');
        const sidTt = cookies.find((c) => c.name === 'sid_tt' || c.name === 'uid_tt');
        isLoggedIn = Boolean((sessionid && sessionid.value) || (sidTt && sidTt.value));
        if (uid && uid.value) {
          accountName = '已登录用户';
        }
      } else if (platform === 'xiaohongshu') {
        const webSession = cookies.find((c) => c.name === 'web_session' || c.name === 'web_session_ss');
        const userId = cookies.find((c) => c.name === 'customer_client_id');
        isLoggedIn = Boolean(webSession && webSession.value);
        if (userId) {
          accountName = '小红书会员';
        }
      }

      return {
        platform,
        isLoggedIn,
        cookieCount: cookies.length,
        lastChecked: Date.now(),
        accountName,
      };
    } catch (err) {
      console.error(`[SessionManager] Failed to get cookies for ${platform}:`, err);
      return {
        platform,
        isLoggedIn: false,
        cookieCount: 0,
        lastChecked: Date.now(),
      };
    }
  }

  public async getAllSessionStatuses(): Promise<Record<PlatformId, PlatformSessionStatus>> {
    const platforms: PlatformId[] = ['douyin', 'bilibili', 'xiaohongshu'];
    const results = await Promise.all(platforms.map((p) => this.getSessionStatus(p)));
    return {
      douyin: results[0],
      bilibili: results[1],
      xiaohongshu: results[2],
    };
  }

  public async clearSession(platform: PlatformId): Promise<void> {
    const ses = this.getSession(platform);
    try {
      await ses.clearStorageData({
        storages: ['cookies', 'localstorage', 'indexdb', 'websql', 'serviceworkers', 'cachestorage'],
      });
      console.log(`[SessionManager] Cleared session storage for ${platform}`);
    } catch (err) {
      console.error(`[SessionManager] Failed to clear session for ${platform}:`, err);
    }
  }

  public async clearAllCache(): Promise<void> {
    for (const [platform, ses] of this.sessions.entries()) {
      try {
        await ses.clearCache();
        console.log(`[SessionManager] Cleared cache for ${platform}`);
      } catch (err) {
        console.error(`[SessionManager] Failed to clear cache for ${platform}:`, err);
      }
    }
  }
}
