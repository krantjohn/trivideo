import {
  ElectronAPI,
  PlatformId,
  PlatformConfig,
  ViewMode,
  ContentBounds,
  AppSettings,
  BookmarkItem,
  HistoryItem,
  NavigationState,
  PlatformSessionStatus,
  BatchSearchResult,
  LayoutMode,
  PaneId,
  SplitConfig,
  SplitBounds,
  UpdateInfo,
  ThemeId,
} from '../../types';

const isElectron = typeof window !== 'undefined' && Boolean(window.triVideoAPI);

const mockPlatforms: PlatformConfig[] = [
  {
    id: 'bilibili',
    name: '哔哩哔哩',
    englishName: 'Bilibili',
    badge: '弹幕·中长视频',
    brandColor: '#00AEEC',
    accentColor: '#FB7299',
    homeUrl: 'https://www.bilibili.com/',
    searchUrlTemplate: 'https://search.bilibili.com/all?keyword={query}',
    loginUrl: 'https://passport.bilibili.com/login',
    partition: 'persist:bilibili',
    categories: [
      { id: 'home', name: '首页推荐', url: 'https://www.bilibili.com/' },
      { id: 'popular', name: '热门精选', url: 'https://www.bilibili.com/v/popular/all' },
      { id: 'douga', name: '动画', url: 'https://www.bilibili.com/v/douga' },
      { id: 'game', name: '游戏', url: 'https://www.bilibili.com/v/game' },
      { id: 'technology', name: '数码科技', url: 'https://www.bilibili.com/v/technology' },
      { id: 'knowledge', name: '知识视野', url: 'https://www.bilibili.com/v/knowledge' },
      { id: 'music', name: '音乐', url: 'https://www.bilibili.com/v/music' },
      { id: 'cinema', name: '影视放映', url: 'https://www.bilibili.com/cinema/' },
      { id: 'life', name: '生活日常', url: 'https://www.bilibili.com/v/life' },
    ],
  },
  {
    id: 'douyin',
    name: '抖音',
    englishName: 'Douyin',
    badge: '短视频·直播',
    brandColor: '#161823',
    accentColor: '#FE2C55',
    homeUrl: 'https://www.douyin.com/',
    searchUrlTemplate: 'https://www.douyin.com/search/{query}',
    loginUrl: 'https://www.douyin.com/',
    partition: 'persist:douyin',
    categories: [
      { id: 'recommend', name: '精选推荐', url: 'https://www.douyin.com/' },
      { id: 'hot', name: '热点榜单', url: 'https://www.douyin.com/hot' },
      { id: 'live', name: '直播大厅', url: 'https://www.douyin.com/live' },
      { id: 'entertainment', name: '娱乐', url: 'https://www.douyin.com/channel/300201' },
      { id: 'anime', name: '二次元', url: 'https://www.douyin.com/channel/300209' },
      { id: 'knowledge', name: '知识', url: 'https://www.douyin.com/channel/300205' },
      { id: 'game', name: '游戏', url: 'https://www.douyin.com/channel/300203' },
      { id: 'food', name: '美食', url: 'https://www.douyin.com/channel/300206' },
    ],
  },
  {
    id: 'xiaohongshu',
    name: '小红书',
    englishName: 'Xiaohongshu',
    badge: '生活·图文视频',
    brandColor: '#FF2442',
    accentColor: '#FF5363',
    homeUrl: 'https://www.xiaohongshu.com/explore',
    searchUrlTemplate: 'https://www.xiaohongshu.com/search_result?keyword={query}',
    loginUrl: 'https://www.xiaohongshu.com/explore',
    partition: 'persist:xiaohongshu',
    categories: [
      { id: 'explore', name: '探索发现', url: 'https://www.xiaohongshu.com/explore' },
      { id: 'fashion', name: '穿搭时尚', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.fashion_v3' },
      { id: 'food', name: '美食探店', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.food_v3' },
      { id: 'cosmetics', name: '彩妆护肤', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.cosmetics_v3' },
      { id: 'movie', name: '影视追剧', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.movie_and_tv_v3' },
      { id: 'career', name: '职场干货', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.career_v3' },
      { id: 'home', name: '家居装潢', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.home_v3' },
      { id: 'game', name: '游戏日常', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.game_v3' },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    englishName: 'YouTube',
    badge: '长视频·全球流行',
    brandColor: '#FF0000',
    accentColor: '#CC0000',
    homeUrl: 'https://www.youtube.com/',
    searchUrlTemplate: 'https://www.youtube.com/results?search_query={query}',
    loginUrl: 'https://accounts.google.com/ServiceLogin?service=youtube',
    partition: 'persist:youtube',
    categories: [
      { id: 'home', name: '首页推荐', url: 'https://www.youtube.com/' },
      { id: 'trending', name: '热门精选', url: 'https://www.youtube.com/feed/trending' },
      { id: 'music', name: '音乐', url: 'https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ' },
      { id: 'gaming', name: '游戏', url: 'https://www.youtube.com/gaming' },
      { id: 'news', name: '新闻', url: 'https://www.youtube.com/news' },
      { id: 'sports', name: '体育', url: 'https://www.youtube.com/channel/UCEg25rdRZXg32iwai6N6l0w' },
      { id: 'subscriptions', name: '订阅内容', url: 'https://www.youtube.com/feed/subscriptions' },
    ],
  },
  {
    id: 'kuaishou',
    name: '快手',
    englishName: 'Kuaishou',
    badge: '短视频·生活社区',
    brandColor: '#FF7700',
    accentColor: '#FF5000',
    homeUrl: 'https://www.kuaishou.com/',
    searchUrlTemplate: 'https://www.kuaishou.com/search/video?searchKey={query}',
    loginUrl: 'https://www.kuaishou.com/',
    partition: 'persist:kuaishou',
    categories: [
      { id: 'reco', name: '精选发现', url: 'https://www.kuaishou.com/' },
      { id: 'hot', name: '快手热榜', url: 'https://www.kuaishou.com/search/video?searchKey=%E7%83%AD%E6%A6%9C' },
      { id: 'live', name: '直播大厅', url: 'https://live.kuaishou.com/' },
      { id: 'shortplay', name: '精品短剧', url: 'https://www.kuaishou.com/search/video?searchKey=%E7%9F%AD%E5%89%A7' },
      { id: 'game', name: '游戏专区', url: 'https://www.kuaishou.com/search/video?searchKey=%E6%B8%B8%E6%88%8F' },
      { id: 'entertainment', name: '娱乐综艺', url: 'https://www.kuaishou.com/search/video?searchKey=%E5%A8%B1%E4%B9%90' },
      { id: 'acfun', name: 'AcFun弹幕', url: 'https://www.acfun.cn/' },
    ],
  },
];

let mockSettings: AppSettings = {
  theme: 'dark',
  lastPlatform: 'bilibili',
  sidebarCollapsed: false,
  hardwareAcceleration: true,
  clearCacheOnExit: false,
  userAgentType: 'chrome',
  muteOnBackground: false,
};

let mockBookmarks: BookmarkItem[] = [
  {
    id: 'bm-mock-1',
    platform: 'bilibili',
    title: '哔哩哔哩 · 热门全站综合榜',
    url: 'https://www.bilibili.com/v/popular/all',
    author: '哔哩哔哩官方',
    duration: '榜单实时更新',
    createdAt: Date.now() - 3600000 * 5,
    notes: 'B站全网最新最高人气优质视频综合排行',
    category: '热门精选',
  },
  {
    id: 'bm-mock-2',
    platform: 'douyin',
    title: '抖音 · 今日热点排行榜',
    url: 'https://www.douyin.com/hot',
    author: '抖音热点',
    duration: '实时更新',
    createdAt: Date.now() - 3600000 * 12,
    notes: '抖音当下最热门视频话题与即时热搜',
    category: '热点榜单',
  },
  {
    id: 'bm-mock-3',
    platform: 'xiaohongshu',
    title: '小红书 · 探索发现精彩笔记',
    url: 'https://www.xiaohongshu.com/explore',
    author: '小红书精选',
    duration: '图文与视频',
    createdAt: Date.now() - 3600000 * 24,
    notes: '优质生活方式分享与前沿灵感发现',
    category: '探索发现',
  },
];

let mockHistory: HistoryItem[] = [
  {
    id: 'hist-1',
    platform: 'bilibili',
    title: '哔哩哔哩弹幕网 - 热门综合榜',
    url: 'https://www.bilibili.com/v/popular/all',
    visitedAt: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'hist-2',
    platform: 'douyin',
    title: '抖音 - 记录美好生活',
    url: 'https://www.douyin.com/',
    visitedAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: 'hist-3',
    platform: 'xiaohongshu',
    title: '小红书 - 发现美好生活',
    url: 'https://www.xiaohongshu.com/explore',
    visitedAt: Date.now() - 1000 * 60 * 90,
  },
];

export const triVideoService: ElectronAPI = {
  switchPlatform: async (platform: PlatformId): Promise<boolean> => {
    if (isElectron) return window.triVideoAPI.switchPlatform(platform);
    return true;
  },
  getPlatforms: async (): Promise<PlatformConfig[]> => {
    if (isElectron) return window.triVideoAPI.getPlatforms();
    return mockPlatforms;
  },
  getActivePlatform: async (): Promise<PlatformId> => {
    if (isElectron) return window.triVideoAPI.getActivePlatform();
    return 'bilibili';
  },
  setContentBounds: async (bounds: ContentBounds): Promise<void> => {
    if (isElectron) return window.triVideoAPI.setContentBounds(bounds);
  },
  setViewMode: async (mode: ViewMode): Promise<void> => {
    if (isElectron) return window.triVideoAPI.setViewMode(mode);
  },
  setPlatformViewVisible: async (visible: boolean): Promise<void> => {
    if (isElectron) return window.triVideoAPI.setPlatformViewVisible(visible);
  },
  searchAll: async (query: string): Promise<BatchSearchResult> => {
    if (isElectron) return window.triVideoAPI.searchAll(query);
    const cleanQuery = (query || '').trim().slice(0, 200);
    return {
      query: cleanQuery,
      totalPlatforms: mockPlatforms.length,
      submittedPlatforms: mockPlatforms.map((p) => p.id),
      failedPlatforms: [],
    };
  },

  // Split-Screen Layout Management
  setLayoutMode: async (mode: LayoutMode): Promise<boolean> => {
    if (isElectron) return window.triVideoAPI.setLayoutMode(mode);
    return true;
  },
  getLayoutMode: async (): Promise<LayoutMode> => {
    if (isElectron) return window.triVideoAPI.getLayoutMode();
    return 'single';
  },
  getSplitConfig: async (): Promise<SplitConfig> => {
    if (isElectron) return window.triVideoAPI.getSplitConfig();
    return {
      mode: 'single',
      leftPlatform: 'bilibili',
      rightPlatform: 'youtube',
      focusedPane: 'left',
      splitRatio: 0.5,
    };
  },
  setSplitPlatform: async (pane: PaneId, platform: PlatformId): Promise<boolean> => {
    if (isElectron) return window.triVideoAPI.setSplitPlatform(pane, platform);
    return true;
  },
  setPanePlatform: async (paneId: string, platform: PlatformId): Promise<boolean> => {
    if (isElectron) return window.triVideoAPI.setPanePlatform(paneId, platform);
    return true;
  },
  setFocusedPane: async (pane: PaneId): Promise<void> => {
    if (isElectron) return window.triVideoAPI.setFocusedPane(pane);
  },
  setSplitBounds: async (bounds: SplitBounds): Promise<void> => {
    if (isElectron) return window.triVideoAPI.setSplitBounds(bounds);
  },
  setMultiPaneBounds: async (bounds: Record<string, ContentBounds>): Promise<void> => {
    if (isElectron) return window.triVideoAPI.setMultiPaneBounds(bounds);
  },
  onSplitConfigChange: (callback: (config: SplitConfig) => void) => {
    if (isElectron && window.triVideoAPI.onSplitConfigChange) {
      return window.triVideoAPI.onSplitConfigChange(callback);
    }
    return () => {};
  },

  navigate: async (url: string): Promise<void> => {
    if (isElectron) return window.triVideoAPI.navigate(url);
  },
  goBack: async (): Promise<void> => {
    if (isElectron) return window.triVideoAPI.goBack();
  },
  goForward: async (): Promise<void> => {
    if (isElectron) return window.triVideoAPI.goForward();
  },
  reload: async (): Promise<void> => {
    if (isElectron) return window.triVideoAPI.reload();
  },
  stopLoading: async (): Promise<void> => {
    if (isElectron) return window.triVideoAPI.stopLoading();
  },
  openExternal: async (url: string): Promise<void> => {
    if (isElectron) return window.triVideoAPI.openExternal(url);
    window.open(url, '_blank');
  },
  getNavigationState: async (): Promise<NavigationState> => {
    if (isElectron) return window.triVideoAPI.getNavigationState();
    return {
      canGoBack: false,
      canGoForward: false,
      isLoading: false,
      currentUrl: 'https://www.bilibili.com/',
      title: '哔哩哔哩 (゜-゜)つロ 干杯~-bilibili',
    };
  },
  getPageMetadata: async () => {
    if (isElectron && window.triVideoAPI.getPageMetadata) {
      return window.triVideoAPI.getPageMetadata();
    }
    return {
      title: '哔哩哔哩 (゜-゜)つロ 干杯~-bilibili',
      url: 'https://www.bilibili.com/',
    };
  },
  onNavigationStateChange: (callback: (state: NavigationState) => void) => {
    if (isElectron) return window.triVideoAPI.onNavigationStateChange(callback);
    return () => {};
  },

  getSessionStatus: async (platform?: PlatformId): Promise<Record<PlatformId, PlatformSessionStatus>> => {
    if (isElectron) return window.triVideoAPI.getSessionStatus(platform);
    return {
      bilibili: { platform: 'bilibili', isLoggedIn: false, cookieCount: 12, lastChecked: Date.now() },
      douyin: { platform: 'douyin', isLoggedIn: false, cookieCount: 8, lastChecked: Date.now() },
      xiaohongshu: { platform: 'xiaohongshu', isLoggedIn: false, cookieCount: 6, lastChecked: Date.now() },
      youtube: { platform: 'youtube', isLoggedIn: false, cookieCount: 10, lastChecked: Date.now() },
      kuaishou: { platform: 'kuaishou', isLoggedIn: false, cookieCount: 8, lastChecked: Date.now() },
    };
  },
  clearPlatformSession: async (platform: PlatformId): Promise<void> => {
    if (isElectron) return window.triVideoAPI.clearPlatformSession(platform);
  },
  clearAllCache: async (): Promise<void> => {
    if (isElectron) return window.triVideoAPI.clearAllCache();
  },
  openLoginModal: async (platform: PlatformId): Promise<void> => {
    if (isElectron) return window.triVideoAPI.openLoginModal(platform);
  },
  onSessionStatusChange: (callback: (statuses: Record<PlatformId, PlatformSessionStatus>) => void) => {
    if (isElectron) return window.triVideoAPI.onSessionStatusChange(callback);
    return () => {};
  },

  getBookmarks: async (): Promise<BookmarkItem[]> => {
    if (isElectron) return window.triVideoAPI.getBookmarks();
    return mockBookmarks;
  },
  addBookmark: async (item: Omit<BookmarkItem, 'id' | 'createdAt'>): Promise<BookmarkItem> => {
    if (isElectron) return window.triVideoAPI.addBookmark(item);
    const newBm: BookmarkItem = {
      ...item,
      id: `bm-${Date.now()}`,
      createdAt: Date.now(),
    };
    mockBookmarks.unshift(newBm);
    return newBm;
  },
  removeBookmark: async (id: string): Promise<boolean> => {
    if (isElectron) return window.triVideoAPI.removeBookmark(id);
    mockBookmarks = mockBookmarks.filter((b) => b.id !== id);
    return true;
  },
  getHistory: async (): Promise<HistoryItem[]> => {
    if (isElectron) return window.triVideoAPI.getHistory();
    return mockHistory;
  },
  clearHistory: async (): Promise<void> => {
    if (isElectron) return window.triVideoAPI.clearHistory();
    mockHistory = [];
  },
  removeHistoryItem: async (id: string): Promise<boolean> => {
    if (isElectron) return window.triVideoAPI.removeHistoryItem(id);
    mockHistory = mockHistory.filter((h) => h.id !== id);
    return true;
  },

  getSettings: async (): Promise<AppSettings> => {
    if (isElectron) return window.triVideoAPI.getSettings();
    return mockSettings;
  },
  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    if (isElectron) return window.triVideoAPI.updateSettings(settings);
    mockSettings = { ...mockSettings, ...settings };
    return mockSettings;
  },
  onThemeChange: (callback: (theme: ThemeId) => void) => {
    if (isElectron) return window.triVideoAPI.onThemeChange(callback);
    return () => {};
  },

  // Software Overwrite Updates
  checkForUpdates: async (): Promise<UpdateInfo> => {
    if (isElectron && window.triVideoAPI.checkForUpdates) {
      return window.triVideoAPI.checkForUpdates();
    }
    return {
      hasUpdate: false,
      currentVersion: '1.0.2',
      latestVersion: '1.0.2',
      releaseName: 'TriVideo v1.0.2',
      releaseNotes: '当前已是最新版本',
      releaseUrl: 'https://github.com/krantjohn/trivideo/releases',
      downloadUrl: null,
      publishedAt: new Date().toISOString(),
    };
  },
  downloadAndInstallUpdate: async (url?: string): Promise<{ success: boolean; message: string }> => {
    if (isElectron && window.triVideoAPI.downloadAndInstallUpdate) {
      return window.triVideoAPI.downloadAndInstallUpdate(url);
    }
    return { success: false, message: '请在桌面客户端环境中进行覆盖更新' };
  },
  openReleasePage: async (url?: string): Promise<void> => {
    if (isElectron && window.triVideoAPI.openReleasePage) {
      return window.triVideoAPI.openReleasePage(url);
    }
    if (typeof window !== 'undefined') {
      window.open(url || 'https://github.com/krantjohn/trivideo/releases', '_blank');
    }
  },
  getAppVersion: async (): Promise<string> => {
    if (isElectron && window.triVideoAPI.getAppVersion) {
      return window.triVideoAPI.getAppVersion();
    }
    return '1.0.2';
  },
  onUpdateProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => {
    if (isElectron && window.triVideoAPI.onUpdateProgress) {
      return window.triVideoAPI.onUpdateProgress(callback);
    }
    return () => {};
  },

  minimizeWindow: async (): Promise<void> => {
    if (isElectron) return window.triVideoAPI.minimizeWindow();
  },
  maximizeWindow: async (): Promise<void> => {
    if (isElectron) return window.triVideoAPI.maximizeWindow();
  },
  closeWindow: async (): Promise<void> => {
    if (isElectron) return window.triVideoAPI.closeWindow();
  },
  isMaximized: async (): Promise<boolean> => {
    if (isElectron) return window.triVideoAPI.isMaximized();
    return false;
  },
  onMaximizeChange: (callback: (isMax: boolean) => void) => {
    if (isElectron) return window.triVideoAPI.onMaximizeChange(callback);
    return () => {};
  },
  exitFullscreen: async (): Promise<void> => {
    if (isElectron) return window.triVideoAPI.exitFullscreen();
  },
  isFullscreen: async (): Promise<boolean> => {
    if (isElectron) return window.triVideoAPI.isFullscreen();
    return false;
  },
  onFullscreenChange: (callback: (isFs: boolean) => void) => {
    if (isElectron) return window.triVideoAPI.onFullscreenChange(callback);
    return () => {};
  },
};
