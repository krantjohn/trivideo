import { app, BrowserWindow } from 'electron';
import { createMainWindow } from './window';
import { SessionManager } from './session-manager';
import { StorageManager } from './storage';
import { PlatformManager } from './platform-manager';
import { registerIpcHandlers } from './ipc-handlers';
import { setupSecurityPolicies } from './security';

let mainWindow: BrowserWindow | null = null;
let platformManager: PlatformManager | null = null;
let sessionManager: SessionManager | null = null;
let storageManager: StorageManager | null = null;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Apply security policies early
  setupSecurityPolicies();

  app.whenReady().then(() => {
    storageManager = new StorageManager();
    sessionManager = new SessionManager();
    mainWindow = createMainWindow();
    platformManager = new PlatformManager(mainWindow, sessionManager, storageManager);

    registerIpcHandlers(mainWindow, platformManager, sessionManager, storageManager);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
        platformManager = new PlatformManager(mainWindow, sessionManager!, storageManager!);
        registerIpcHandlers(mainWindow, platformManager, sessionManager!, storageManager!);
      }
    });
  });

  app.on('window-all-closed', () => {
    if (platformManager) {
      platformManager.destroy();
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
