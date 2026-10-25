const { app, BrowserWindow, WebContentsView } = require('electron');
const path = require('path');
const { SessionManager } = require('../dist/main/session-manager.js');
const { PLATFORM_CONFIGS } = require('../dist/main/platform-config.js');

app.whenReady().then(async () => {
  console.log('Testing platform page loads...');
  const sessionManager = new SessionManager();

  const win = new BrowserWindow({ width: 1200, height: 800, show: false });

  for (const p of ['bilibili', 'douyin', 'xiaohongshu']) {
    const config = PLATFORM_CONFIGS[p];
    const ses = sessionManager.getSession(p);
    const view = new WebContentsView({
      webPreferences: {
        session: ses,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      }
    });

    win.contentView.addChildView(view);
    view.setBounds({ x: 0, y: 0, width: 1200, height: 800 });

    console.log(`[${p}] Loading ${config.homeUrl}...`);
    try {
      await view.webContents.loadURL(config.homeUrl, { timeout: 15000 });
      console.log(`[${p}] Loaded: title="${view.webContents.getTitle()}", url="${view.webContents.getURL()}"`);
    } catch (err) {
      console.error(`[${p}] Error loading:`, err.message);
    }

    const cookies = await ses.cookies.get({});
    console.log(`[${p}] Cookies count: ${cookies.length}`);
    win.contentView.removeChildView(view);
  }

  app.quit();
  process.exit(0);
});
