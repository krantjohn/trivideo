const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { createMainWindow } = require('../dist/main/window.js');
const { SessionManager } = require('../dist/main/session-manager.js');
const { StorageManager } = require('../dist/main/storage.js');
const { PlatformManager } = require('../dist/main/platform-manager.js');
const { registerIpcHandlers } = require('../dist/main/ipc-handlers.js');
const { setupSecurityPolicies } = require('../dist/main/security.js');

app.whenReady().then(async () => {
  console.log('[E2E] Starting multi-view visual verification with native view composition...');
  setupSecurityPolicies();

  const storageManager = new StorageManager();
  const sessionManager = new SessionManager();
  const mainWindow = createMainWindow();
  const platformManager = new PlatformManager(mainWindow, sessionManager, storageManager);
  registerIpcHandlers(mainWindow, platformManager, sessionManager, storageManager);

  await new Promise((resolve) => {
    mainWindow.webContents.once('did-finish-load', resolve);
  });
  console.log('[E2E] Window loaded.');

  const osDir = path.join(__dirname, '../screenshots');
  if (!fs.existsSync(osDir)) fs.mkdirSync(osDir, { recursive: true });

  // Wait a short duration for the active webContentsView to load Bilibili
  console.log('[E2E] Waiting for initial platform page load...');
  await new Promise((r) => setTimeout(r, 4000));

  // 1. Capture Main Platform View (Dark Mode)
  const baseImgDark = await mainWindow.capturePage();
  const baseDarkPath = path.join(osDir, 'temp-base-dark.png');
  fs.writeFileSync(baseDarkPath, baseImgDark.toPNG());

  const viewImgDark = await platformManager.captureActivePlatformView();
  if (viewImgDark) {
    const viewDarkPath = path.join(osDir, 'temp-view-dark.png');
    fs.writeFileSync(viewDarkPath, viewImgDark);

    try {
      execFileSync('python', [
        path.join(__dirname, 'composite.py'),
        baseDarkPath,
        viewDarkPath,
        path.join(osDir, 'trivideo-main-dark.png'),
        '240',
        '102',
      ]);
      console.log('[E2E] Composited trivideo-main-dark.png');
    } catch (e) {
      console.warn('[E2E] Fallback writing base dark:', e.message);
      fs.writeFileSync(path.join(osDir, 'trivideo-main-dark.png'), baseImgDark.toPNG());
    }
    if (fs.existsSync(baseDarkPath)) fs.unlinkSync(baseDarkPath);
    if (fs.existsSync(viewDarkPath)) fs.unlinkSync(viewDarkPath);
  } else {
    fs.writeFileSync(path.join(osDir, 'trivideo-main-dark.png'), baseImgDark.toPNG());
  }

  // 2. Switch to Favorites View (Card Grid)
  platformManager.setViewMode('favorites');
  await mainWindow.webContents.executeJavaScript(`
    const favBtn = document.querySelector('[data-id="btn-favorites"]');
    if (favBtn) favBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1000));
  let img = await mainWindow.capturePage();
  fs.writeFileSync(path.join(osDir, 'trivideo-favorites-dark.png'), img.toPNG());
  console.log('[E2E] Saved trivideo-favorites-dark.png');

  // 3. Switch to History View
  platformManager.setViewMode('history');
  await mainWindow.webContents.executeJavaScript(`
    const histBtn = document.querySelector('[data-id="btn-history"]');
    if (histBtn) histBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1000));
  img = await mainWindow.capturePage();
  fs.writeFileSync(path.join(osDir, 'trivideo-history-dark.png'), img.toPNG());
  console.log('[E2E] Saved trivideo-history-dark.png');

  // 4. Open Settings Modal
  await mainWindow.webContents.executeJavaScript(`
    const settingsBtn = document.querySelector('[data-id="btn-settings"]');
    if (settingsBtn) settingsBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1000));
  img = await mainWindow.capturePage();
  fs.writeFileSync(path.join(osDir, 'trivideo-settings-dark.png'), img.toPNG());
  console.log('[E2E] Saved trivideo-settings-dark.png');

  // 5. Toggle Light Theme & return to platform view
  await mainWindow.webContents.executeJavaScript(`
    const closeBtn = document.querySelector('[data-id="btn-close-modal"]');
    if (closeBtn) closeBtn.click();
    document.documentElement.setAttribute('data-theme', 'light');
  `);
  platformManager.setViewMode('platform');
  await new Promise((r) => setTimeout(r, 1000));

  const baseImgLight = await mainWindow.capturePage();
  const baseLightPath = path.join(osDir, 'temp-base-light.png');
  fs.writeFileSync(baseLightPath, baseImgLight.toPNG());

  const viewImgLight = await platformManager.captureActivePlatformView();
  if (viewImgLight) {
    const viewLightPath = path.join(osDir, 'temp-view-light.png');
    fs.writeFileSync(viewLightPath, viewImgLight);

    try {
      execFileSync('python', [
        path.join(__dirname, 'composite.py'),
        baseLightPath,
        viewLightPath,
        path.join(osDir, 'trivideo-main-light.png'),
        '240',
        '102',
      ]);
      console.log('[E2E] Composited trivideo-main-light.png');
    } catch (e) {
      console.warn('[E2E] Fallback writing base light:', e.message);
      fs.writeFileSync(path.join(osDir, 'trivideo-main-light.png'), baseImgLight.toPNG());
    }
    if (fs.existsSync(baseLightPath)) fs.unlinkSync(baseLightPath);
    if (fs.existsSync(viewLightPath)) fs.unlinkSync(viewLightPath);
  } else {
    fs.writeFileSync(path.join(osDir, 'trivideo-main-light.png'), baseImgLight.toPNG());
  }

  console.log('[E2E] ALL SCREENSHOTS CAPTURED SUCCESSFULLY.');
  platformManager.destroy();
  mainWindow.destroy();
  app.quit();
  process.exit(0);
});
