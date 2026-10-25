import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export function createMainWindow(): BrowserWindow {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 650,
    frame: false, // Custom frameless window for sleek native desktop look
    backgroundColor: '#131418',
    show: false, // Don't show until ready-to-show to prevent white flash
    icon: path.join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Lock down main window navigation to prevent remote website hijacking of the privileged renderer
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (url.startsWith('file:') || (isDev && url.startsWith('http://localhost:5173'))) {
      return;
    }
    event.preventDefault();
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null);
  const localHtml = path.join(__dirname, '../renderer/index.html');

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      if (fs.existsSync(localHtml)) {
        mainWindow.loadFile(localHtml);
      }
    });
  } else if (fs.existsSync(localHtml)) {
    mainWindow.loadFile(localHtml);
  }

  return mainWindow;
}
