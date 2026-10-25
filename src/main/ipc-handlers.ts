import { ipcMain, BrowserWindow } from 'electron';
import { PlatformManager } from './platform-manager';
import { SessionManager } from './session-manager';
import { StorageManager } from './storage';
import { PLATFORM_CONFIGS } from './platform-config';
import { PlatformId, ViewMode, ContentBounds, AppSettings, BookmarkItem } from '../types';

export function registerIpcHandlers(
  mainWindow: BrowserWindow,
  platformManager: PlatformManager,
  sessionManager: SessionManager,
  storageManager: StorageManager
): void {
  // Platform & View Management
  ipcMain.handle('platform:switch', async (_, platform: PlatformId) => {
    return platformManager.switchPlatform(platform);
  });

  ipcMain.handle('platform:getActive', async () => {
    return platformManager.getActivePlatform();
  });

  ipcMain.handle('platform:getConfigs', async () => {
    return platformManager.getPlatformConfigs();
  });

  ipcMain.handle('platform:setBounds', async (_, bounds: ContentBounds) => {
    platformManager.setContentBounds(bounds);
  });

  ipcMain.handle('platform:setViewMode', async (_, mode: ViewMode) => {
    platformManager.setViewMode(mode);
  });

  // Navigation
  ipcMain.handle('nav:navigate', async (_, url: string) => {
    platformManager.navigate(url);
  });

  ipcMain.handle('nav:goBack', async () => {
    platformManager.goBack();
  });

  ipcMain.handle('nav:goForward', async () => {
    platformManager.goForward();
  });

  ipcMain.handle('nav:reload', async () => {
    platformManager.reload();
  });

  ipcMain.handle('nav:stop', async () => {
    platformManager.stopLoading();
  });

  ipcMain.handle('nav:openExternal', async (_, url?: string) => {
    platformManager.openExternal(url);
  });

  ipcMain.handle('nav:getState', async () => {
    return platformManager.getNavigationState();
  });

  ipcMain.handle('nav:getPageMeta', async () => {
    return platformManager.extractActivePageMeta();
  });

  // Session & Authentication
  ipcMain.handle('session:getStatus', async (_, platform?: PlatformId) => {
    if (platform) {
      return { [platform]: await sessionManager.getSessionStatus(platform) };
    }
    return sessionManager.getAllSessionStatuses();
  });

  ipcMain.handle('session:clear', async (_, platform: PlatformId) => {
    await sessionManager.clearSession(platform);
    platformManager.reload();
  });

  ipcMain.handle('session:clearCache', async () => {
    await sessionManager.clearAllCache();
  });

  ipcMain.handle('session:loginModal', async (_, platform: PlatformId) => {
    const config = PLATFORM_CONFIGS[platform];
    if (config) {
      platformManager.switchPlatform(platform);
      platformManager.navigate(config.loginUrl);
    }
  });

  // Bookmarks & History
  ipcMain.handle('storage:getBookmarks', async () => {
    return storageManager.getBookmarks();
  });

  ipcMain.handle('storage:addBookmark', async (_, item: Omit<BookmarkItem, 'id' | 'createdAt'>) => {
    return storageManager.addBookmark(item);
  });

  ipcMain.handle('storage:removeBookmark', async (_, id: string) => {
    return storageManager.removeBookmark(id);
  });

  ipcMain.handle('storage:getHistory', async () => {
    return storageManager.getHistory();
  });

  ipcMain.handle('storage:clearHistory', async () => {
    storageManager.clearHistory();
  });

  ipcMain.handle('storage:removeHistoryItem', async (_, id: string) => {
    return storageManager.removeHistoryItem(id);
  });

  // Settings
  ipcMain.handle('storage:getSettings', async () => {
    return storageManager.getSettings();
  });

  ipcMain.handle('storage:updateSettings', async (_, partial: Partial<AppSettings>) => {
    const updated = storageManager.updateSettings(partial);
    return updated;
  });

  // Window Controls
  ipcMain.handle('window:minimize', async () => {
    mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', async () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window:close', async () => {
    mainWindow.close();
  });

  ipcMain.handle('window:isMaximized', async () => {
    return mainWindow.isMaximized();
  });

  // Setup Push Listeners
  platformManager.setNavChangeCallback((state) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('nav:stateChanged', state);
    }
  });

  mainWindow.on('maximize', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:maximizeChanged', true);
      platformManager.updateViewPlacement();
    }
  });

  mainWindow.on('unmaximize', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:maximizeChanged', false);
      platformManager.updateViewPlacement();
    }
  });

  mainWindow.on('resize', () => {
    platformManager.updateViewPlacement();
  });

  mainWindow.on('move', () => {
    platformManager.updateViewPlacement();
  });
}
