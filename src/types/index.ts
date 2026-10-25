export type PlatformId = 'douyin' | 'bilibili' | 'xiaohongshu';

export interface PlatformCategory {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
}

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  englishName: string;
  badge: string;
  brandColor: string;
  accentColor: string;
  homeUrl: string;
  searchUrlTemplate: string;
  loginUrl: string;
  partition: string;
  categories: PlatformCategory[];
}

export type ViewMode = 'platform' | 'favorites' | 'history' | 'settings';

export interface BookmarkItem {
  id: string;
  platform: PlatformId;
  title: string;
  url: string;
  coverUrl?: string;
  author?: string;
  authorAvatar?: string;
  duration?: string;
  playCount?: string;
  likeCount?: string;
  createdAt: number;
  notes?: string;
  category?: string;
}

export interface HistoryItem {
  id: string;
  platform: PlatformId;
  title: string;
  url: string;
  visitedAt: number;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  lastPlatform: PlatformId;
  sidebarCollapsed: boolean;
  hardwareAcceleration: boolean;
  clearCacheOnExit: boolean;
  userAgentType: 'default' | 'chrome' | 'edge';
  customUserAgent?: string;
  muteOnBackground?: boolean;
}

export interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  currentUrl: string;
  title: string;
  hasError?: boolean;
  errorCode?: number;
  errorDescription?: string;
}

export interface PlatformSessionStatus {
  platform: PlatformId;
  isLoggedIn: boolean;
  cookieCount: number;
  lastChecked: number;
  accountName?: string;
  avatarUrl?: string;
}

export interface TriVideoStorageData {
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  settings: AppSettings;
}

export interface ContentBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElectronAPI {
  // Platform & View Management
  switchPlatform: (platform: PlatformId) => Promise<boolean>;
  getPlatforms: () => Promise<PlatformConfig[]>;
  getActivePlatform: () => Promise<PlatformId>;
  setContentBounds: (bounds: ContentBounds) => Promise<void>;
  setViewMode: (mode: ViewMode) => Promise<void>;

  // Navigation
  navigate: (url: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  reload: () => Promise<void>;
  stopLoading: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  getNavigationState: () => Promise<NavigationState>;
  getPageMetadata?: () => Promise<{
    title: string;
    url: string;
    coverUrl?: string;
    author?: string;
    duration?: string;
  }>;
  onNavigationStateChange: (callback: (state: NavigationState) => void) => () => void;

  // Session & Auth
  getSessionStatus: (platform?: PlatformId) => Promise<Record<PlatformId, PlatformSessionStatus>>;
  clearPlatformSession: (platform: PlatformId) => Promise<void>;
  clearAllCache: () => Promise<void>;
  openLoginModal: (platform: PlatformId) => Promise<void>;
  onSessionStatusChange: (callback: (statuses: Record<PlatformId, PlatformSessionStatus>) => void) => () => void;

  // Bookmarks & History
  getBookmarks: () => Promise<BookmarkItem[]>;
  addBookmark: (item: Omit<BookmarkItem, 'id' | 'createdAt'>) => Promise<BookmarkItem>;
  removeBookmark: (id: string) => Promise<boolean>;
  getHistory: () => Promise<HistoryItem[]>;
  clearHistory: () => Promise<void>;
  removeHistoryItem: (id: string) => Promise<boolean>;

  // Settings & Theme
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  onThemeChange: (callback: (theme: 'dark' | 'light') => void) => () => void;

  // Window Controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange: (callback: (isMax: boolean) => void) => () => void;
}

declare global {
  interface Window {
    triVideoAPI: ElectronAPI;
  }
}
