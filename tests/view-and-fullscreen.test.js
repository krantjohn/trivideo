const test = require('node:test');
const assert = require('node:assert');
const EventEmitter = require('node:events');

// Setup mock electron module in require cache
class MockWebContents extends EventEmitter {
  constructor() {
    super();
    this.audioMuted = false;
    this.jsExecuted = [];
  }
  setAudioMuted(val) { this.audioMuted = val; }
  send(channel, ...args) { this.emit(channel, ...args); }
  executeJavaScript(code) {
    this.jsExecuted.push(code);
    return Promise.resolve();
  }
  loadURL() { return Promise.resolve(); }
  setWindowOpenHandler() {}
  canGoBack() { return false; }
  canGoForward() { return false; }
  isLoading() { return false; }
  getURL() { return 'https://www.bilibili.com/'; }
  getTitle() { return 'Bilibili'; }
  isDestroyed() { return false; }
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
    this._contentBounds = { x: 0, y: 0, width: 1920, height: 1080 };
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

const { PlatformManager } = require('../dist/main/platform-manager.js');

class MockSessionManager {
  getSession() { return { setPermissionRequestHandler() {} }; }
}

class MockStorageManager {
  getSettings() { return { lastPlatform: 'bilibili' }; }
  updateSettings() {}
  addHistory() {}
}

test('Bug 1: View Visibility for Settings Modal', (t) => {
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());
  
  pm.setContentBounds({ x: 240, y: 102, width: 1200, height: 798 });

  // 1. Initial active view is attached and visible
  assert.strictEqual(pm.isPlatformViewVisible(), true);
  assert.strictEqual(win.contentView.children.length, 1);
  const activeView = win.contentView.children[0];
  assert.deepStrictEqual(activeView.bounds, { x: 240, y: 102, width: 1200, height: 798 });

  // 2. Hide platform view (Settings opened)
  pm.setPlatformViewVisible(false);
  assert.strictEqual(pm.isPlatformViewVisible(), false);
  assert.strictEqual(win.contentView.children.length, 0, 'Active view should be detached from contentView when hidden');
  assert.strictEqual(activeView.visible, false);
  // Crucial: check that audio was NOT muted and video was NOT paused
  assert.strictEqual(activeView.webContents.audioMuted, false, 'Audio should not be muted for settings modal');
  assert.strictEqual(activeView.webContents.jsExecuted.length, 0, 'Video pause script should not be executed');

  // 3. Re-show platform view (Settings closed)
  pm.setPlatformViewVisible(true);
  assert.strictEqual(pm.isPlatformViewVisible(), true);
  assert.strictEqual(win.contentView.children.length, 1, 'Active view should be re-attached');
  assert.deepStrictEqual(activeView.bounds, { x: 240, y: 102, width: 1200, height: 798 });
  assert.strictEqual(activeView.visible, true);

  // 4. Repeated toggle cycles
  for (let i = 0; i < 5; i++) {
    pm.setPlatformViewVisible(false);
    assert.strictEqual(win.contentView.children.length, 0);
    pm.setPlatformViewVisible(true);
    assert.strictEqual(win.contentView.children.length, 1);
    assert.deepStrictEqual(win.contentView.children[0].bounds, { x: 240, y: 102, width: 1200, height: 798 });
  }
});

test('Bug 2: Fullscreen Lifecycle and Bounds Management', (t) => {
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());
  pm.setContentBounds({ x: 240, y: 102, width: 1200, height: 798 });

  let fsEventState = null;
  pm.setFullscreenChangeCallback((isFs) => {
    fsEventState = isFs;
  });

  const activeView = win.contentView.children[0];

  // 1. Enter fullscreen
  pm.handleEnterFullScreen('bilibili');
  assert.strictEqual(pm.getIsFullscreen(), true);
  assert.strictEqual(win.isFullScreen(), true);
  assert.strictEqual(fsEventState, true);
  // View should cover full screen (1920x1080)
  assert.deepStrictEqual(activeView.bounds, { x: 0, y: 0, width: 1920, height: 1080 });

  // 2. While in fullscreen, updating content bounds does NOT disrupt fullscreen view bounds
  pm.setContentBounds({ x: 200, y: 90, width: 1000, height: 600 });
  assert.deepStrictEqual(activeView.bounds, { x: 0, y: 0, width: 1920, height: 1080 });

  // 3. Exit fullscreen
  pm.handleLeaveFullScreen('bilibili');
  assert.strictEqual(pm.getIsFullscreen(), false);
  assert.strictEqual(win.isFullScreen(), false);
  assert.strictEqual(fsEventState, false);
  // View should be restored to updated content bounds
  assert.deepStrictEqual(activeView.bounds, { x: 200, y: 90, width: 1000, height: 600 });
});

test('Bug 2: Fullscreen Maximized State Retention', (t) => {
  const win = new MockBrowserWindow();
  win.maximize(); // Window was maximized before fullscreen
  assert.strictEqual(win.isMaximized(), true);

  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());
  pm.setContentBounds({ x: 240, y: 102, width: 1200, height: 798 });

  pm.handleEnterFullScreen('bilibili');
  assert.strictEqual(pm.getWasMaximizedBeforeFullscreen(), true);

  // During fullscreen, Chromium may set maximized to false
  win.unmaximize();
  assert.strictEqual(win.isMaximized(), false);

  // When exiting fullscreen, maximized state should be restored
  pm.handleLeaveFullScreen('bilibili');
  assert.strictEqual(win.isMaximized(), true, 'Window should be re-maximized upon leaving fullscreen');
  assert.strictEqual(pm.getIsFullscreen(), false);
});

test('Bug 2: Platform switch and ViewMode switch while in fullscreen', (t) => {
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());
  pm.setContentBounds({ x: 240, y: 102, width: 1200, height: 798 });

  // Enter fullscreen
  pm.handleEnterFullScreen('bilibili');
  assert.strictEqual(pm.getIsFullscreen(), true);

  // Switching platform should safely exit fullscreen first
  pm.switchPlatform('douyin');
  assert.strictEqual(pm.getIsFullscreen(), false, 'Switching platform should exit fullscreen');
  assert.strictEqual(pm.getActivePlatform(), 'douyin');

  // Enter fullscreen on douyin
  pm.handleEnterFullScreen('douyin');
  assert.strictEqual(pm.getIsFullscreen(), true);

  // Switching viewMode to favorites should safely exit fullscreen first
  pm.setViewMode('favorites');
  assert.strictEqual(pm.getIsFullscreen(), false, 'Switching viewMode to favorites should exit fullscreen');
});

test('Bug 1 & 2: YouTube view visibility for Settings and Fullscreen', (t) => {
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());
  pm.setContentBounds({ x: 240, y: 102, width: 1200, height: 798 });

  // 1. Switch to YouTube
  pm.switchPlatform('youtube');
  assert.strictEqual(pm.getActivePlatform(), 'youtube');
  assert.strictEqual(win.contentView.children.length, 1);
  const ytView = pm.platformViews.get('youtube');
  assert.strictEqual(ytView.visible, true);
  assert.strictEqual(ytView.webContents.audioMuted, false);

  // 2. Open Settings modal on YouTube
  pm.setPlatformViewVisible(false);
  assert.strictEqual(pm.isPlatformViewVisible(), false);
  assert.strictEqual(win.contentView.children.length, 0, 'YouTube view should be detached when Settings modal is open');
  assert.strictEqual(ytView.visible, false);
  assert.strictEqual(ytView.webContents.audioMuted, false, 'Audio should not be muted for settings modal');

  // Close Settings modal
  pm.setPlatformViewVisible(true);
  assert.strictEqual(win.contentView.children.length, 1);
  assert.strictEqual(ytView.visible, true);
  assert.deepStrictEqual(ytView.bounds, { x: 240, y: 102, width: 1200, height: 798 });

  // 3. YouTube HTML5 Fullscreen Lifecycle
  pm.handleEnterFullScreen('youtube');
  assert.strictEqual(pm.getIsFullscreen(), true);
  assert.deepStrictEqual(ytView.bounds, { x: 0, y: 0, width: 1920, height: 1080 }, 'YouTube view should cover display in fullscreen');

  // Exit fullscreen
  pm.handleLeaveFullScreen('youtube');
  assert.strictEqual(pm.getIsFullscreen(), false);
  assert.deepStrictEqual(ytView.bounds, { x: 240, y: 102, width: 1200, height: 798 }, 'YouTube view bounds should be restored');
});

test('Bug 1 & 2: Kuaishou view visibility for Settings and Fullscreen', (t) => {
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());
  pm.setContentBounds({ x: 240, y: 102, width: 1200, height: 798 });

  // 1. Switch to Kuaishou
  pm.switchPlatform('kuaishou');
  assert.strictEqual(pm.getActivePlatform(), 'kuaishou');
  assert.strictEqual(win.contentView.children.length, 1);
  const ksView = pm.platformViews.get('kuaishou');
  assert.strictEqual(ksView.visible, true);
  assert.strictEqual(ksView.webContents.audioMuted, false);

  // 2. Open Settings modal on Kuaishou
  pm.setPlatformViewVisible(false);
  assert.strictEqual(pm.isPlatformViewVisible(), false);
  assert.strictEqual(win.contentView.children.length, 0, 'Kuaishou view should be detached when Settings modal is open');
  assert.strictEqual(ksView.visible, false);
  assert.strictEqual(ksView.webContents.audioMuted, false, 'Audio should not be muted for settings modal');

  // Close Settings modal
  pm.setPlatformViewVisible(true);
  assert.strictEqual(win.contentView.children.length, 1);
  assert.strictEqual(ksView.visible, true);
  assert.deepStrictEqual(ksView.bounds, { x: 240, y: 102, width: 1200, height: 798 });

  // 3. Kuaishou HTML5 Fullscreen Lifecycle
  pm.handleEnterFullScreen('kuaishou');
  assert.strictEqual(pm.getIsFullscreen(), true);
  assert.deepStrictEqual(ksView.bounds, { x: 0, y: 0, width: 1920, height: 1080 }, 'Kuaishou view should cover display in fullscreen');

  // Exit fullscreen
  pm.handleLeaveFullScreen('kuaishou');
  assert.strictEqual(pm.getIsFullscreen(), false);
  assert.deepStrictEqual(ksView.bounds, { x: 240, y: 102, width: 1200, height: 798 }, 'Kuaishou view bounds should be restored');
});
