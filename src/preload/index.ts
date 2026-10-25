import { contextBridge, ipcRenderer } from 'electron';
import {
  ElectronAPI,
  PlatformId,
  ViewMode,
  ContentBounds,
  AppSettings,
  BookmarkItem,
  NavigationState,
  PlatformSessionStatus,
} from '../types';

const api: ElectronAPI = {
  // Platform & View Management
  switchPlatform: (platform: PlatformId) => ipcRenderer.invoke('platform:switch', platform),
  getPlatforms: () => ipcRenderer.invoke('platform:getConfigs'),
  getActivePlatform: () => ipcRenderer.invoke('platform:getActive'),
  setContentBounds: (bounds: ContentBounds) => ipcRenderer.invoke('platform:setBounds', bounds),
  setViewMode: (mode: ViewMode) => ipcRenderer.invoke('platform:setViewMode', mode),

  // Navigation
  navigate: (url: string) => ipcRenderer.invoke('nav:navigate', url),
  goBack: () => ipcRenderer.invoke('nav:goBack'),
  goForward: () => ipcRenderer.invoke('nav:goForward'),
  reload: () => ipcRenderer.invoke('nav:reload'),
  stopLoading: () => ipcRenderer.invoke('nav:stop'),
  openExternal: (url: string) => ipcRenderer.invoke('nav:openExternal', url),
  getNavigationState: () => ipcRenderer.invoke('nav:getState'),
  getPageMetadata: () => ipcRenderer.invoke('nav:getPageMeta'),
  onNavigationStateChange: (callback: (state: NavigationState) => void) => {
    const handler = (_: any, state: NavigationState) => callback(state);
    ipcRenderer.on('nav:stateChanged', handler);
    return () => {
      ipcRenderer.removeListener('nav:stateChanged', handler);
    };
  },

  // Session & Auth
  getSessionStatus: (platform?: PlatformId) => ipcRenderer.invoke('session:getStatus', platform),
  clearPlatformSession: (platform: PlatformId) => ipcRenderer.invoke('session:clear', platform),
  clearAllCache: () => ipcRenderer.invoke('session:clearCache'),
  openLoginModal: (platform: PlatformId) => ipcRenderer.invoke('session:loginModal', platform),
  onSessionStatusChange: (callback: (statuses: Record<PlatformId, PlatformSessionStatus>) => void) => {
    const handler = (_: any, statuses: Record<PlatformId, PlatformSessionStatus>) => callback(statuses);
    ipcRenderer.on('session:statusChanged', handler);
    return () => {
      ipcRenderer.removeListener('session:statusChanged', handler);
    };
  },

  // Bookmarks & History
  getBookmarks: () => ipcRenderer.invoke('storage:getBookmarks'),
  addBookmark: (item: Omit<BookmarkItem, 'id' | 'createdAt'>) => ipcRenderer.invoke('storage:addBookmark', item),
  removeBookmark: (id: string) => ipcRenderer.invoke('storage:removeBookmark', id),
  getHistory: () => ipcRenderer.invoke('storage:getHistory'),
  clearHistory: () => ipcRenderer.invoke('storage:clearHistory'),
  removeHistoryItem: (id: string) => ipcRenderer.invoke('storage:removeHistoryItem', id),

  // Settings & Theme
  getSettings: () => ipcRenderer.invoke('storage:getSettings'),
  updateSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('storage:updateSettings', settings),
  onThemeChange: (callback: (theme: 'dark' | 'light') => void) => {
    const handler = (_: any, theme: 'dark' | 'light') => callback(theme);
    ipcRenderer.on('theme:changed', handler);
    return () => {
      ipcRenderer.removeListener('theme:changed', handler);
    };
  },

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizeChange: (callback: (isMax: boolean) => void) => {
    const handler = (_: any, isMax: boolean) => callback(isMax);
    ipcRenderer.on('window:maximizeChanged', handler);
    return () => {
      ipcRenderer.removeListener('window:maximizeChanged', handler);
    };
  },
};

contextBridge.exposeInMainWorld('triVideoAPI', api);
