import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import {
  TriVideoStorageData,
  BookmarkItem,
  HistoryItem,
  AppSettings,
  PlatformId,
} from '../types';

export const ALL_PLATFORM_IDS: PlatformId[] = ['bilibili', 'douyin', 'xiaohongshu', 'youtube', 'kuaishou'];

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  lastPlatform: 'bilibili',
  sidebarCollapsed: false,
  hardwareAcceleration: true,
  clearCacheOnExit: false,
  userAgentType: 'chrome',
  muteOnBackground: false,
  enabledPlatformIds: [...ALL_PLATFORM_IDS],
  platformSetupCompleted: false,
};

export class StorageManager {
  private filePath: string;
  private data: TriVideoStorageData;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const userDataDir = app ? app.getPath('userData') : process.cwd();
      this.filePath = path.join(userDataDir, 'trivideo-data.json');
    }
    this.data = this.loadData();
  }

  public sanitizeEnabledPlatforms(platforms?: any): PlatformId[] {
    if (!Array.isArray(platforms)) {
      return [...ALL_PLATFORM_IDS];
    }
    const valid = platforms.filter((p): p is PlatformId => ALL_PLATFORM_IDS.includes(p));
    return valid.length > 0 ? valid : [...ALL_PLATFORM_IDS];
  }

  private loadData(): TriVideoStorageData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        const parsedSettings = parsed.settings || {};

        // Existing user migration check:
        // If file exists and platformSetupCompleted is undefined, existing user -> mark completed = true
        const platformSetupCompleted =
          typeof parsedSettings.platformSetupCompleted === 'boolean'
            ? parsedSettings.platformSetupCompleted
            : true;

        const enabledPlatformIds = this.sanitizeEnabledPlatforms(parsedSettings.enabledPlatformIds);

        let lastPlatform: PlatformId = parsedSettings.lastPlatform || DEFAULT_SETTINGS.lastPlatform;
        if (!enabledPlatformIds.includes(lastPlatform)) {
          lastPlatform = enabledPlatformIds[0];
        }

        return {
          bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
          history: Array.isArray(parsed.history) ? parsed.history : [],
          settings: {
            ...DEFAULT_SETTINGS,
            ...parsedSettings,
            platformSetupCompleted,
            enabledPlatformIds,
            lastPlatform,
          },
        };
      }
    } catch (err) {
      console.error('[StorageManager] Failed to load data, using defaults:', err);
    }
    return {
      bookmarks: this.getDefaultBookmarks(),
      history: [],
      settings: {
        ...DEFAULT_SETTINGS,
        enabledPlatformIds: [...ALL_PLATFORM_IDS],
        platformSetupCompleted: false,
      },
    };
  }

  private getDefaultBookmarks(): BookmarkItem[] {
    return [
      {
        id: 'bm-bili-portal-1',
        platform: 'bilibili',
        title: '哔哩哔哩 · 热门全站综合榜',
        url: 'https://www.bilibili.com/v/popular/all',
        author: '哔哩哔哩官方',
        duration: '榜单实时更新',
        createdAt: Date.now() - 86400000 * 2,
        notes: 'B站全网最新最高人气优质视频综合排行',
        category: '热门精选',
      },
      {
        id: 'bm-douyin-portal-1',
        platform: 'douyin',
        title: '抖音 · 今日热点排行榜',
        url: 'https://www.douyin.com/hot',
        author: '抖音热点',
        duration: '实时更新',
        createdAt: Date.now() - 86400000 * 1,
        notes: '抖音当下最热门视频话题与即时热搜',
        category: '热点榜单',
      },
      {
        id: 'bm-xhs-portal-1',
        platform: 'xiaohongshu',
        title: '小红书 · 探索发现精彩笔记',
        url: 'https://www.xiaohongshu.com/explore',
        author: '小红书精选',
        duration: '图文与视频',
        createdAt: Date.now() - 86400000 * 0.5,
        notes: '优质生活方式分享与前沿灵感发现',
        category: '探索发现',
      },
      {
        id: 'bm-yt-portal-1',
        platform: 'youtube',
        title: 'YouTube · 热门内容',
        url: 'https://www.youtube.com/feed/trending',
        author: 'YouTube',
        duration: '实时更新',
        createdAt: Date.now() - 86400000 * 0.2,
        notes: '全球热门流行视频与趋势内容',
        category: '热门精选',
      },
      {
        id: 'bm-ks-portal-1',
        platform: 'kuaishou',
        title: '快手 · 精选热榜推荐',
        url: 'https://www.kuaishou.com/',
        author: '快手精选',
        duration: '短视频·直播',
        createdAt: Date.now() - 86400000 * 0.1,
        notes: '快手实时热门精选与高人气短视频',
        category: '精选发现',
      },
    ];
  }

  private saveData(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.filePath);
    } catch (err) {
      console.error('[StorageManager] Failed to save data:', err);
    }
  }

  // Bookmarks
  public getBookmarks(): BookmarkItem[] {
    return [...this.data.bookmarks];
  }

  public addBookmark(item: Omit<BookmarkItem, 'id' | 'createdAt'>): BookmarkItem {
    const newItem: BookmarkItem = {
      ...item,
      id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    this.data.bookmarks.unshift(newItem);
    this.saveData();
    return newItem;
  }

  public removeBookmark(id: string): boolean {
    const idx = this.data.bookmarks.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.data.bookmarks.splice(idx, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // History
  public getHistory(): HistoryItem[] {
    return [...this.data.history];
  }

  public addHistory(platform: PlatformId, title: string, url: string): void {
    // Avoid spamming consecutive identical entries
    if (this.data.history.length > 0) {
      const latest = this.data.history[0];
      if (latest.url === url && Date.now() - latest.visitedAt < 10000) {
        return;
      }
    }
    const item: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      platform,
      title: title || url,
      url,
      visitedAt: Date.now(),
    };
    this.data.history.unshift(item);
    // Limit history length to 200 items
    if (this.data.history.length > 200) {
      this.data.history = this.data.history.slice(0, 200);
    }
    this.saveData();
  }

  public removeHistoryItem(id: string): boolean {
    const idx = this.data.history.findIndex((h) => h.id === id);
    if (idx !== -1) {
      this.data.history.splice(idx, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  public clearHistory(): void {
    this.data.history = [];
    this.saveData();
  }

  // Settings
  public getSettings(): AppSettings {
    return { ...this.data.settings };
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    const nextSettings = { ...this.data.settings, ...partial };
    if (partial.enabledPlatformIds !== undefined) {
      nextSettings.enabledPlatformIds = this.sanitizeEnabledPlatforms(partial.enabledPlatformIds);
    }
    if (nextSettings.enabledPlatformIds && !nextSettings.enabledPlatformIds.includes(nextSettings.lastPlatform)) {
      nextSettings.lastPlatform = nextSettings.enabledPlatformIds[0];
    }
    this.data.settings = nextSettings;
    this.saveData();
    return { ...this.data.settings };
  }
}
