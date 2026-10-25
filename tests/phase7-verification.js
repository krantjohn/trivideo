const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

async function runPhase7Verification() {
  console.log('=== PHASE 7: DATA PROTECTION, MIGRATION & INSTALLATION ACCEPTANCE START ===');

  const testRoot = path.join(os.tmpdir(), `trivideo-phase7-${Date.now()}`);
  fs.mkdirSync(testRoot, { recursive: true });

  const { StorageManager, ALL_PLATFORM_IDS } = require('../dist/main/storage');
  const { SessionManager } = require('../dist/main/session-manager');
  const { PlatformManager } = require('../dist/main/platform-manager');
  const { registerIpcHandlers } = require('../dist/main/ipc-handlers');

  try {
    // ==========================================
    // 1. User Data Protection & Legacy Migration
    // ==========================================
    console.log('\n--- 1. User Data Protection & Legacy Migration Verification ---');
    const legacyStoragePath = path.join(testRoot, 'legacy-data.json');
    // Prepare a simulated legacy v0.9 / Phase 1 user profile
    const legacyData = {
      bookmarks: [
        { id: 'bm-legacy-1', platform: 'bilibili', title: '【经典】高数辅导', url: 'https://www.bilibili.com/video/BV1xx', createdAt: 1700000000000 },
        { id: 'bm-legacy-2', platform: 'youtube', title: 'Vue & React Tutorial', url: 'https://www.youtube.com/watch?v=123', createdAt: 1700000005000 },
      ],
      history: [
        { id: 'h-1', platform: 'douyin', title: '美食街拍', url: 'https://www.douyin.com/video/1', visitedAt: 1700000010000 },
      ],
      settings: {
        theme: 'dark',
        lastPlatform: 'bilibili',
        sidebarCollapsed: true,
        // Legacy user didn't have splitConfig, horizontalRatio, or newly added platforms
      },
    };
    fs.writeFileSync(legacyStoragePath, JSON.stringify(legacyData, null, 2), 'utf-8');

    // Load with current StorageManager (simulating upgrade / overwrite launch)
    const migratedStorage = new StorageManager(legacyStoragePath);
    const migratedSettings = migratedStorage.getSettings();

    // Verification 1: Bookmarks & History must NOT be lost
    const bms = migratedStorage.getBookmarks();
    assert.equal(bms.length, 2, 'Legacy bookmarks must be preserved 100%');
    assert.equal(bms[0].title, '【经典】高数辅导');
    const hist = migratedStorage.getHistory();
    assert.equal(hist.length, 1, 'Legacy history must be preserved 100%');

    // Verification 2: Legacy user migration must set platformSetupCompleted to true (do not force wizard on existing users)
    assert.equal(migratedSettings.platformSetupCompleted, true, 'Legacy user must not be forced into onboarding wizard');

    // Verification 3: Missing layout fields must safely adopt defaults
    assert.deepEqual(migratedSettings.enabledPlatformIds, ALL_PLATFORM_IDS, 'Must default to all 5 platforms');
    console.log('[PASS] Legacy user data migration and protection verified without any data loss');

    // ==========================================
    // 2. Multi-Process Resource & Metric Profiling
    // ==========================================
    console.log('\n--- 2. Multi-Process Resource & Metric Profiling ---');
    const win = new BrowserWindow({
      width: 1440,
      height: 900,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../dist/preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    const sessionManager = new SessionManager();
    const pm = new PlatformManager(win, sessionManager, migratedStorage);
    registerIpcHandlers(win, pm, sessionManager, migratedStorage);

    // Profile State A: Single Screen
    pm.setLayoutMode('single');
    const metricsSingle = app.getAppMetrics();
    console.log(`[Single Mode] Process Count: ${metricsSingle.length}`);
    for (const m of metricsSingle) {
      console.log(`  - ${m.type} (PID ${m.pid}): WorkingSet = ${(m.memory.workingSetSize / 1024).toFixed(1)} MB, CPU = ${m.cpu.percentCPUUsage}%`);
    }

    // Profile State B: Quad 2x2 Screen
    pm.setMultiPaneBounds({
      'pane-1': { x: 240, y: 138, width: 590, height: 376 },
      'pane-2': { x: 838, y: 138, width: 590, height: 376 },
      'pane-3': { x: 240, y: 522, width: 590, height: 376 },
      'pane-4': { x: 838, y: 522, width: 590, height: 376 },
    });
    pm.setLayoutMode('quad');
    const metricsQuad = app.getAppMetrics();
    console.log(`[Quad Mode] Process Count: ${metricsQuad.length}`);
    for (const m of metricsQuad) {
      console.log(`  - ${m.type} (PID ${m.pid}): WorkingSet = ${(m.memory.workingSetSize / 1024).toFixed(1)} MB, CPU = ${m.cpu.percentCPUUsage}%`);
    }

    const memUsage = process.memoryUsage();
    console.log(`[Memory Profile] RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB, Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    assert.ok(memUsage.rss < 350 * 1024 * 1024, 'Main process RSS must remain under 350MB');
    console.log('[PASS] Multi-process resource metrics recorded within healthy bounds');

    // ==========================================
    // 3. NSIS & Electron-Builder Config Check
    // ==========================================
    console.log('\n--- 3. NSIS Package Configuration Validation ---');
    const builderYmlPath = path.join(__dirname, '../electron-builder.yml');
    const builderContent = fs.readFileSync(builderYmlPath, 'utf-8');

    assert.ok(builderContent.includes('deleteAppDataOnUninstall: false'), 'Must protect user data from deletion on uninstall');
    assert.ok(builderContent.includes('oneClick: false'), 'Must provide standard installation wizard');
    assert.ok(builderContent.includes('allowToChangeInstallationDirectory: true'), 'Must allow user custom directory');
    assert.ok(builderContent.includes('createDesktopShortcut: true'), 'Must support desktop shortcut');
    assert.ok(builderContent.includes('createStartMenuShortcut: true'), 'Must support start menu shortcut');
    assert.ok(builderContent.includes('artifactName: ${productName}-Setup-${version}.${ext}'), 'Must have clear installer artifact name');
    console.log('[PASS] electron-builder.yml verified: NSIS installer, data protection, shortcut configs intact');

    // ==========================================
    // 4. Installer & Portable Artifacts Integrity
    // ==========================================
    console.log('\n--- 4. Release Artifacts Integrity Check ---');
    const releaseDir = path.join(__dirname, '../release');
    const releaseFiles = fs.readdirSync(releaseDir);

    const installerFile = releaseFiles.find(f => f.includes('Setup') && f.endsWith('.exe'));
    assert.ok(installerFile, 'NSIS Installer executable must exist in release directory');
    const installerSize = fs.statSync(path.join(releaseDir, installerFile)).size;
    console.log(`Found NSIS Installer: ${installerFile} (${(installerSize / 1024 / 1024).toFixed(2)} MB)`);
    assert.ok(installerSize > 50 * 1024 * 1024, 'Installer must be > 50MB (contains complete electron runtime)');

    const unpackedDir = path.join(releaseDir, 'win-unpacked');
    assert.ok(fs.existsSync(unpackedDir), 'Unpacked directory must exist');
    const unpackedExe = path.join(unpackedDir, '三栖视频中心.exe');
    assert.ok(fs.existsSync(unpackedExe), 'Unpacked executable must exist');
    console.log(`Found Unpacked Executable: ${unpackedExe}`);

    console.log('\n=== ALL PHASE 7 VERIFICATIONS PASSED SUCCESSFULLY ===');

    win.close();
    pm.destroy();
  } catch (err) {
    console.error('Phase 7 Verification Error:', err);
    process.exit(1);
  } finally {
    try {
      fs.rmSync(testRoot, { recursive: true, force: true });
    } catch (e) {}
    app.quit();
  }
}

app.whenReady().then(runPhase7Verification);
