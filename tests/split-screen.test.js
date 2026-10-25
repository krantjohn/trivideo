const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const EventEmitter = require('node:events');

function getTempStoragePath() {
  const tmpDir = path.join(os.tmpdir(), `trivideo-split-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  return path.join(tmpDir, 'test-storage.json');
}

// 1. Setup Mock Electron in require.cache before requiring PlatformManager
class MockWebContents extends EventEmitter {
  constructor() {
    super();
    this.audioMuted = false;
    this.loadedUrls = [];
    this.destroyed = false;
  }
  setAudioMuted(val) { this.audioMuted = val; }
  isAudioMuted() { return this.audioMuted; }
  send(channel, ...args) { this.emit(channel, ...args); }
  executeJavaScript() { return Promise.resolve(); }
  loadURL(url) {
    if (this.destroyed) return Promise.reject(new Error('destroyed'));
    this.loadedUrls.push(url);
    return Promise.resolve();
  }
  setWindowOpenHandler() {}
  canGoBack() { return true; }
  canGoForward() { return false; }
  isLoading() { return false; }
  getURL() { return this.loadedUrls[this.loadedUrls.length - 1] || 'https://www.bilibili.com/'; }
  getTitle() { return 'Mock Title'; }
  isDestroyed() { return this.destroyed; }
  goBack() { this.loadedUrls.push('mock://history/back'); }
  goForward() { this.loadedUrls.push('mock://history/forward'); }
  reload() { this.loadedUrls.push('mock://reload'); }
  stop() {}
}

class MockWebContentsView {
  constructor() {
    this.webContents = new MockWebContents();
    this.bounds = { x: 0, y: 0, width: 0, height: 0 };
    this.visible = true;
  }
  setBounds(b) { this.bounds = b; }
  getBounds() { return this.bounds; }
  setVisible(v) { this.visible = v; }
}

class MockContentView {
  constructor() {
    this.children = [];
  }
  addChildView(v) {
    if (!this.children.includes(v)) this.children.push(v);
  }
  removeChildView(v) {
    const idx = this.children.indexOf(v);
    if (idx !== -1) this.children.splice(idx, 1);
  }
}

class MockBrowserWindow extends EventEmitter {
  constructor() {
    super();
    this.contentView = new MockContentView();
    this._isMaximized = false;
    this._isFullScreen = false;
    this._contentBounds = { x: 0, y: 0, width: 1440, height: 900 };
    this.webContents = new MockWebContents();
  }
  isMaximized() { return this._isMaximized; }
  maximize() { this._isMaximized = true; }
  unmaximize() { this._isMaximized = false; }
  isFullScreen() { return this._isFullScreen; }
  setFullScreen(val) { this._isFullScreen = val; }
  getContentBounds() { return this._contentBounds; }
  isDestroyed() { return false; }
}

const mockElectron = {
  BrowserWindow: MockBrowserWindow,
  WebContentsView: MockWebContentsView,
  shell: { openExternal() {} },
  session: { fromPartition() { return { setPermissionRequestHandler() {} }; } },
};

require.cache[require.resolve('electron')] = {
  id: require.resolve('electron'),
  filename: require.resolve('electron'),
  loaded: true,
  exports: mockElectron,
};

const { StorageManager } = require('../dist/main/storage');
const { PlatformManager } = require('../dist/main/platform-manager');

class MockSessionManager {
  getSession() {
    return {
      cookies: { get: async () => [] },
      clearStorageData: async () => {},
    };
  }
}

test('Split Screen: Enters split mode with non-overlapping bounds for left and right views', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({ platformSetupCompleted: true });
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), storage);

  assert.equal(pm.getLayoutMode(), 'single');

  // Set split bounds from renderer
  pm.setSplitBounds({
    left: { x: 240, y: 138, width: 590, height: 760 },
    right: { x: 838, y: 138, width: 590, height: 760 },
  });

  const enterOk = pm.setLayoutMode('split');
  assert.equal(enterOk, true);
  assert.equal(pm.getLayoutMode(), 'split');

  const config = pm.getSplitConfig();
  assert.equal(config.mode, 'split');
  assert.ok(config.leftPlatform !== config.rightPlatform, 'Left and right must be different platforms');

  // Both views must be attached to contentView
  assert.equal(win.contentView.children.length, 2, 'Exactly two views must be mounted in split mode');

  // Verify non-overlapping horizontal bounds
  const leftView = pm['platformViews'].get(config.leftPlatform);
  const rightView = pm['platformViews'].get(config.rightPlatform);
  assert.ok(leftView.bounds.x + leftView.bounds.width <= rightView.bounds.x, 'Left and right bounds must not overlap');
});

test('Split Screen: Prevents both panes from selecting the same platform simultaneously', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({ platformSetupCompleted: true });
  const pm = new PlatformManager(new MockBrowserWindow(), new MockSessionManager(), storage);

  pm.setLayoutMode('split');
  const cfg = pm.getSplitConfig(); // left: bilibili, right: youtube (or similar)

  // Attempt to set right pane to same platform as left
  const sameOk = pm.setSplitPlatform('right', cfg.leftPlatform);
  // Setting right to left platform shifts focus or rejects duplicates
  const afterCfg = pm.getSplitConfig();
  assert.notEqual(afterCfg.leftPlatform, afterCfg.rightPlatform, 'Panes cannot share the same platform');
});

test('Split Screen: Audio exclusivity between focused and unfocused panes', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({ platformSetupCompleted: true });
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), storage);

  pm.setLayoutMode('split');
  pm.setSplitPlatform('left', 'bilibili');
  pm.setSplitPlatform('right', 'youtube');

  // Focus left pane
  pm.setFocusedPane('left');
  const biliView = pm['platformViews'].get('bilibili');
  const ytView = pm['platformViews'].get('youtube');

  assert.equal(biliView.webContents.isAudioMuted(), false, 'Focused left pane must not be muted');
  assert.equal(ytView.webContents.isAudioMuted(), true, 'Unfocused right pane must be muted');

  // Focus right pane
  pm.setFocusedPane('right');
  assert.equal(biliView.webContents.isAudioMuted(), true, 'Unfocused left pane must now be muted');
  assert.equal(ytView.webContents.isAudioMuted(), false, 'Focused right pane must now be unmuted');
});

test('Split Screen: Navigation commands target the currently focused pane', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({ platformSetupCompleted: true });
  const pm = new PlatformManager(new MockBrowserWindow(), new MockSessionManager(), storage);

  pm.setLayoutMode('split');
  pm.setSplitPlatform('left', 'bilibili');
  pm.setSplitPlatform('right', 'youtube');

  const biliWc = pm['platformViews'].get('bilibili').webContents;
  const ytWc = pm['platformViews'].get('youtube').webContents;

  // Focus left pane and issue reload
  pm.setFocusedPane('left');
  pm.reload();
  assert.ok(biliWc.loadedUrls.includes('mock://reload'), 'Reload should target left platform when focused');
  assert.ok(!ytWc.loadedUrls.includes('mock://reload'), 'Reload should not touch right platform when left is focused');

  // Focus right pane and issue goBack
  pm.setFocusedPane('right');
  pm.goBack();
  assert.ok(ytWc.loadedUrls.includes('mock://history/back'), 'GoBack should target right platform when focused');
});

test('Split Screen: Sidebar platform click replaces focused pane platform without exiting split mode', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({ platformSetupCompleted: true });
  const pm = new PlatformManager(new MockBrowserWindow(), new MockSessionManager(), storage);

  pm.setLayoutMode('split');
  pm.setSplitPlatform('left', 'bilibili');
  pm.setSplitPlatform('right', 'youtube');
  pm.setFocusedPane('left');

  // User clicks Kuaishou on sidebar
  pm.switchPlatform('kuaishou');

  assert.equal(pm.getLayoutMode(), 'split', 'Should remain in split mode');
  assert.equal(pm.getSplitConfig().leftPlatform, 'kuaishou', 'Left focused pane should be replaced with kuaishou');
  assert.equal(pm.getSplitConfig().rightPlatform, 'youtube', 'Right pane platform should remain untouched');
});

test('Split Screen: Unified search simultaneously queries both split platforms without altering layout', async () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({ platformSetupCompleted: true });
  const pm = new PlatformManager(new MockBrowserWindow(), new MockSessionManager(), storage);

  pm.setLayoutMode('split');
  pm.setSplitPlatform('left', 'bilibili');
  pm.setSplitPlatform('right', 'youtube');

  const biliWc = pm['platformViews'].get('bilibili').webContents;
  const ytWc = pm['platformViews'].get('youtube').webContents;

  const result = await pm.searchAllPlatforms('深度学习');
  assert.ok(result.submittedPlatforms.includes('bilibili'));
  assert.ok(result.submittedPlatforms.includes('youtube'));

  assert.ok(biliWc.loadedUrls.some((u) => u.includes('keyword=%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0')));
  assert.ok(ytWc.loadedUrls.some((u) => u.includes('search_query=%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0')));

  assert.equal(pm.getLayoutMode(), 'split', 'Layout mode must remain split during unified search');
});

test('Split Screen: Settings modal visibility hides both split views without losing state', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({ platformSetupCompleted: true });
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), storage);

  pm.setLayoutMode('split');
  pm.setSplitBounds({
    left: { x: 240, y: 138, width: 590, height: 760 },
    right: { x: 838, y: 138, width: 590, height: 760 },
  });

  assert.equal(win.contentView.children.length, 2);

  // Settings modal opens
  pm.setPlatformViewVisible(false);
  assert.equal(win.contentView.children.length, 0, 'All views must be detached when modal opens');

  // Settings modal closes
  pm.setPlatformViewVisible(true);
  assert.equal(win.contentView.children.length, 2, 'Both views must be restored when modal closes');
});

test('Split Screen: Video fullscreen isolates requesting pane and cleanly restores split layout upon exit', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({ platformSetupCompleted: true });
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), storage);

  pm.setLayoutMode('split');
  pm.setSplitPlatform('left', 'bilibili');
  pm.setSplitPlatform('right', 'youtube');
  pm.setSplitBounds({
    left: { x: 240, y: 138, width: 590, height: 760 },
    right: { x: 838, y: 138, width: 590, height: 760 },
  });

  // Right pane (YouTube) requests fullscreen
  pm.handleEnterFullScreen('youtube');
  assert.equal(pm.getIsFullscreen(), true);
  assert.equal(win.contentView.children.length, 1, 'Only the fullscreen view must be active on screen');
  const ytView = pm['platformViews'].get('youtube');
  assert.equal(ytView.bounds.x, 0);
  assert.equal(ytView.bounds.y, 0);

  // Exit fullscreen
  pm.handleLeaveFullScreen('youtube');
  assert.equal(pm.getIsFullscreen(), false);
  assert.equal(pm.getLayoutMode(), 'split', 'Must restore split layout mode');
  assert.equal(win.contentView.children.length, 2, 'Both views must be restored to split layout');
  assert.equal(ytView.bounds.x, 838);
});

test('Split Screen: Disabling one of the split platforms auto-replaces it with another enabled platform', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({
    platformSetupCompleted: true,
    enabledPlatformIds: ['bilibili', 'douyin', 'xiaohongshu', 'youtube', 'kuaishou'],
  });
  const pm = new PlatformManager(new MockBrowserWindow(), new MockSessionManager(), storage);

  pm.setLayoutMode('split');
  pm.setSplitPlatform('left', 'bilibili');
  pm.setSplitPlatform('right', 'youtube');

  // User disables Bilibili in Settings, remaining: [douyin, xiaohongshu, youtube, kuaishou]
  pm.updateEnabledPlatforms(['douyin', 'xiaohongshu', 'youtube', 'kuaishou']);

  const cfg = pm.getSplitConfig();
  assert.equal(pm.getLayoutMode(), 'split');
  assert.notEqual(cfg.leftPlatform, 'bilibili', 'Disabled bilibili must be replaced');
  assert.notEqual(cfg.leftPlatform, cfg.rightPlatform, 'Replaced platform cannot be identical to right platform');
});

test('Split Screen: Disabling platforms down to 1 automatically falls back to single mode', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({
    platformSetupCompleted: true,
    enabledPlatformIds: ['bilibili', 'youtube'],
  });
  const pm = new PlatformManager(new MockBrowserWindow(), new MockSessionManager(), storage);

  pm.setLayoutMode('split');
  assert.equal(pm.getLayoutMode(), 'split');

  // User disables YouTube in settings, only Bilibili remains
  pm.updateEnabledPlatforms(['bilibili']);

  assert.equal(pm.getLayoutMode(), 'single', 'Must safely fall back to single mode when only 1 platform remains');
  assert.equal(pm.getActivePlatform(), 'bilibili');
});


test('Phase 5B Multi-Pane: Triple layout mounts 3 non-overlapping views with audio exclusivity', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({
    platformSetupCompleted: true,
    enabledPlatformIds: ['bilibili', 'youtube', 'douyin', 'kuaishou', 'xiaohongshu'],
  });
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), storage);

  // Set multi bounds for triple mode: pane-1 left (large), pane-2 top-right, pane-3 bottom-right
  pm.setMultiPaneBounds({
    'pane-1': { x: 240, y: 138, width: 700, height: 760 },
    'pane-2': { x: 948, y: 138, width: 480, height: 376 },
    'pane-3': { x: 948, y: 522, width: 480, height: 376 },
  });

  const ok = pm.setLayoutMode('triple');
  assert.equal(ok, true, 'Triple layout mode should be enabled');
  assert.equal(pm.getLayoutMode(), 'triple');

  const config = pm.getSplitConfig();
  assert.equal(config.panes.length, 3, 'Triple mode must return exactly 3 panes');

  // Verify 3 distinct views mounted
  assert.equal(win.contentView.children.length, 3, 'Exactly 3 views must be mounted in triple mode');

  const p1 = config.panes[0].platform;
  const p2 = config.panes[1].platform;
  const p3 = config.panes[2].platform;
  assert.notEqual(p1, p2);
  assert.notEqual(p2, p3);
  assert.notEqual(p1, p3);

  const v1 = pm['platformViews'].get(p1);
  const v2 = pm['platformViews'].get(p2);
  const v3 = pm['platformViews'].get(p3);

  // Bounds checks
  assert.ok(v1.bounds.x + v1.bounds.width <= v2.bounds.x, 'Left pane and right-top pane must not overlap horizontally');
  assert.ok(v2.bounds.y + v2.bounds.height <= v3.bounds.y, 'Right-top pane and right-bottom pane must not overlap vertically');

  // Audio exclusivity: Focus pane-3
  pm.setFocusedPane('pane-3');
  assert.equal(v1.webContents.isAudioMuted(), true, 'Unfocused pane 1 must be muted');
  assert.equal(v2.webContents.isAudioMuted(), true, 'Unfocused pane 2 must be muted');
  assert.equal(v3.webContents.isAudioMuted(), false, 'Focused pane 3 must NOT be muted');
});

test('Phase 5B Multi-Pane: Quad layout mounts 4 non-overlapping views in 2x2 grid', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({
    platformSetupCompleted: true,
    enabledPlatformIds: ['bilibili', 'youtube', 'douyin', 'kuaishou', 'xiaohongshu'],
  });
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), storage);

  // Set multi bounds for quad mode: 2x2 grid
  pm.setMultiPaneBounds({
    'pane-1': { x: 240, y: 138, width: 590, height: 376 },
    'pane-2': { x: 838, y: 138, width: 590, height: 376 },
    'pane-3': { x: 240, y: 522, width: 590, height: 376 },
    'pane-4': { x: 838, y: 522, width: 590, height: 376 },
  });

  const ok = pm.setLayoutMode('quad');
  assert.equal(ok, true, 'Quad layout mode should be enabled');
  assert.equal(pm.getLayoutMode(), 'quad');

  const config = pm.getSplitConfig();
  assert.equal(config.panes.length, 4, 'Quad mode must return 4 panes');
  assert.equal(win.contentView.children.length, 4, 'Exactly 4 views must be mounted in quad mode');

  const platforms = config.panes.map((p) => p.platform);
  const uniquePlatforms = new Set(platforms);
  assert.equal(uniquePlatforms.size, 4, 'All 4 panes must have distinct platforms');

  // Audio exclusivity: Focus pane-4
  pm.setFocusedPane('pane-4');
  const v4 = pm['platformViews'].get(config.panes[3].platform);
  assert.equal(v4.webContents.isAudioMuted(), false, 'Focused pane 4 must not be muted');

  for (let i = 0; i < 3; i++) {
    const v = pm['platformViews'].get(config.panes[i].platform);
    assert.equal(v.webContents.isAudioMuted(), true, `Unfocused pane ${i + 1} must be muted`);
  }
});

test('Phase 5B Multi-Pane: Rejects entering triple/quad layout when enabled platforms are insufficient', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({
    platformSetupCompleted: true,
    enabledPlatformIds: ['bilibili', 'youtube'], // only 2 platforms enabled
  });
  const pm = new PlatformManager(new MockBrowserWindow(), new MockSessionManager(), storage);

  assert.equal(pm.setLayoutMode('triple'), false, 'Should reject triple mode when only 2 platforms are enabled');
  assert.equal(pm.setLayoutMode('quad'), false, 'Should reject quad mode when only 2 platforms are enabled');
  assert.equal(pm.setLayoutMode('split'), true, 'Should accept split mode when 2 platforms are enabled');
});

test('Phase 5B Multi-Pane: Navigation commands in triple/quad mode target the currently focused pane', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({
    platformSetupCompleted: true,
    enabledPlatformIds: ['bilibili', 'youtube', 'douyin', 'kuaishou', 'xiaohongshu'],
  });
  const pm = new PlatformManager(new MockBrowserWindow(), new MockSessionManager(), storage);

  pm.setLayoutMode('quad');
  const config = pm.getSplitConfig();
  const targetPane = config.panes[2]; // pane-3

  pm.setFocusedPane('pane-3');
  const wc = pm['platformViews'].get(targetPane.platform).webContents;

  pm.reload();
  assert.ok(wc.loadedUrls.includes('mock://reload'), 'Reload should target focused pane 3');

  pm.goBack();
  assert.ok(wc.loadedUrls.includes('mock://history/back'), 'GoBack should target focused pane 3');
});

test('Phase 5B Multi-Pane: Sidebar platform click in multi-pane shifts focus or replaces focused pane', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({
    platformSetupCompleted: true,
    enabledPlatformIds: ['bilibili', 'youtube', 'douyin', 'kuaishou', 'xiaohongshu'],
  });
  const pm = new PlatformManager(new MockBrowserWindow(), new MockSessionManager(), storage);

  pm.setLayoutMode('triple');
  pm.setPanePlatform('pane-1', 'bilibili');
  pm.setPanePlatform('pane-2', 'youtube');
  pm.setPanePlatform('pane-3', 'douyin');
  pm.setFocusedPane('pane-1');

  // 1. User clicks an already-visible platform (Douyin in pane-3) -> should shift focus without duplicating
  pm.switchPlatform('douyin');
  assert.equal(pm.getSplitConfig().focusedPaneId, 'pane-3', 'Clicking existing platform should shift focus');
  assert.equal(pm.getLayoutMode(), 'triple');

  // 2. User clicks a platform not in layout (Kuaishou) -> should replace currently focused pane (pane-3)
  pm.switchPlatform('kuaishou');
  assert.equal(pm.getSplitConfig().panes.find((p) => p.id === 'pane-3').platform, 'kuaishou');
  assert.equal(pm.getLayoutMode(), 'triple');
});

test('Phase 5B Multi-Pane: Video fullscreen in quad isolates requesting pane and cleanly restores quad layout', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({
    platformSetupCompleted: true,
    enabledPlatformIds: ['bilibili', 'youtube', 'douyin', 'kuaishou', 'xiaohongshu'],
  });
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), storage);

  pm.setLayoutMode('quad');
  pm.setMultiPaneBounds({
    'pane-1': { x: 240, y: 138, width: 590, height: 376 },
    'pane-2': { x: 838, y: 138, width: 590, height: 376 },
    'pane-3': { x: 240, y: 522, width: 590, height: 376 },
    'pane-4': { x: 838, y: 522, width: 590, height: 376 },
  });

  const quadPanes = pm.getSplitConfig().panes;
  const targetPlatform = quadPanes[3].platform; // pane-4 platform

  // Pane-4 requests fullscreen
  pm.handleEnterFullScreen(targetPlatform);
  assert.equal(pm.getIsFullscreen(), true);
  assert.equal(win.contentView.children.length, 1, 'Only fullscreen view should be mounted');
  const fsView = pm['platformViews'].get(targetPlatform);
  assert.equal(fsView.bounds.x, 0);
  assert.equal(fsView.bounds.y, 0);

  // Exit fullscreen
  pm.handleLeaveFullScreen(targetPlatform);
  assert.equal(pm.getIsFullscreen(), false);
  assert.equal(pm.getLayoutMode(), 'quad', 'Must restore quad layout mode');
  assert.equal(win.contentView.children.length, 4, 'All 4 views must be remounted');
  assert.equal(fsView.bounds.x, 838);
});

test('Phase 5B Multi-Pane: Stepwise layout downgrade when platforms are dynamically disabled', () => {
  const storage = new StorageManager(getTempStoragePath());
  storage.updateSettings({
    platformSetupCompleted: true,
    enabledPlatformIds: ['bilibili', 'youtube', 'douyin', 'kuaishou'], // 4 platforms
  });
  const pm = new PlatformManager(new MockBrowserWindow(), new MockSessionManager(), storage);

  pm.setLayoutMode('quad');
  assert.equal(pm.getLayoutMode(), 'quad');

  // Disable 1 platform -> 3 remain, auto-downgrade to triple
  pm.updateEnabledPlatforms(['bilibili', 'youtube', 'douyin']);
  assert.equal(pm.getLayoutMode(), 'triple', 'Quad should downgrade to triple when 3 platforms remain');

  // Disable 1 platform -> 2 remain, auto-downgrade to split
  pm.updateEnabledPlatforms(['bilibili', 'youtube']);
  assert.equal(pm.getLayoutMode(), 'split', 'Triple should downgrade to split when 2 platforms remain');

  // Disable 1 platform -> 1 remains, auto-downgrade to single
  pm.updateEnabledPlatforms(['bilibili']);
  assert.equal(pm.getLayoutMode(), 'single', 'Split should downgrade to single when 1 platform remains');
  assert.equal(pm.getActivePlatform(), 'bilibili');
});
