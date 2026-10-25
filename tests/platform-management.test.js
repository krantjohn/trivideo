const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const EventEmitter = require('node:events');

function getTempStoragePath() {
  const tmpDir = path.join(os.tmpdir(), `trivideo-test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
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
  send(channel, ...args) { this.emit(channel, ...args); }
  executeJavaScript() { return Promise.resolve(); }
  loadURL(url) {
    if (this.destroyed) return Promise.reject(new Error('destroyed'));
    this.loadedUrls.push(url);
    return Promise.resolve();
  }
  setWindowOpenHandler() {}
  canGoBack() { return false; }
  canGoForward() { return false; }
  isLoading() { return false; }
  getURL() { return this.loadedUrls[this.loadedUrls.length - 1] || 'https://www.bilibili.com/'; }
  getTitle() { return 'Mock Title'; }
  isDestroyed() { return this.destroyed; }
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

const { StorageManager, ALL_PLATFORM_IDS } = require('../dist/main/storage');
const { PlatformManager } = require('../dist/main/platform-manager');
const { PLATFORM_CONFIGS } = require('../dist/main/platform-config');

class MockSessionManager {
  getSession() {
    return {
      cookies: { get: async () => [] },
      clearStorageData: async () => {},
    };
  }
}

test('StorageManager: Brand new user has platformSetupCompleted=false and all 5 platforms enabled', () => {
  const storagePath = getTempStoragePath();
  assert.equal(fs.existsSync(storagePath), false);

  const storage = new StorageManager(storagePath);
  const settings = storage.getSettings();

  assert.equal(settings.platformSetupCompleted, false);
  assert.deepEqual(settings.enabledPlatformIds, ['bilibili', 'douyin', 'xiaohongshu', 'youtube', 'kuaishou']);
  assert.equal(settings.lastPlatform, 'bilibili');
});

test('StorageManager: Existing legacy user without platformSetupCompleted migrates smoothly', () => {
  const storagePath = getTempStoragePath();

  const legacyData = {
    bookmarks: [
      { id: 'b1', platform: 'bilibili', title: 'Video 1', url: 'https://bilibili.com/video/1' },
      { id: 'b2', platform: 'kuaishou', title: 'Kuaishou 1', url: 'https://kuaishou.com/f/1' },
    ],
    history: [
      { id: 'h1', platform: 'youtube', title: 'YT 1', url: 'https://youtube.com/watch?v=1', visitedAt: Date.now() },
    ],
    settings: {
      theme: 'light',
      lastPlatform: 'youtube',
      sidebarCollapsed: true,
    },
  };
  fs.writeFileSync(storagePath, JSON.stringify(legacyData, null, 2), 'utf-8');

  const storage = new StorageManager(storagePath);
  const settings = storage.getSettings();

  // Existing user should have platformSetupCompleted migrated to true without modal
  assert.equal(settings.platformSetupCompleted, true);
  assert.deepEqual(settings.enabledPlatformIds, ['bilibili', 'douyin', 'xiaohongshu', 'youtube', 'kuaishou']);
  assert.equal(settings.theme, 'light');
  assert.equal(settings.lastPlatform, 'youtube');
  assert.equal(settings.sidebarCollapsed, true);

  assert.equal(storage.getBookmarks().length, 2);
  assert.equal(storage.getHistory().length, 1);
});

test('StorageManager: Enforces minimum 1 platform and sanitizes invalid platforms', () => {
  const storagePath = getTempStoragePath();
  const storage = new StorageManager(storagePath);

  // Attempt to pass empty platform array
  const updated1 = storage.updateSettings({ enabledPlatformIds: [] });
  assert.ok(updated1.enabledPlatformIds.length >= 1, 'Should not allow 0 platforms');

  // Attempt to pass invalid/fake platform names
  const updated2 = storage.updateSettings({ enabledPlatformIds: ['fake_platform', 'bilibili'] });
  assert.deepEqual(updated2.enabledPlatformIds, ['bilibili']);

  // Disabling active lastPlatform reassigns lastPlatform to remaining enabled platform
  const updated3 = storage.updateSettings({
    lastPlatform: 'kuaishou',
    enabledPlatformIds: ['bilibili', 'douyin'],
  });
  assert.equal(updated3.lastPlatform, 'bilibili', 'lastPlatform must be reassigned if disabled');
});

test('PlatformManager: New user hides platform view until setup completed', () => {
  const storagePath = getTempStoragePath();
  const storage = new StorageManager(storagePath); // platformSetupCompleted = false
  const win = new MockBrowserWindow();
  const sess = new MockSessionManager();

  const pm = new PlatformManager(win, sess, storage);
  assert.equal(pm.isPlatformViewVisible(), false, 'Platform view should be hidden for uncompleted onboarding');
});

test('PlatformManager: Unified search only queries enabled platforms', async () => {
  const storagePath = getTempStoragePath();
  const storage = new StorageManager(storagePath);
  storage.updateSettings({
    platformSetupCompleted: true,
    enabledPlatformIds: ['bilibili', 'youtube'],
  });

  const win = new MockBrowserWindow();
  const sess = new MockSessionManager();
  const pm = new PlatformManager(win, sess, storage);

  const result = await pm.searchAllPlatforms('人工智能');
  assert.equal(result.totalPlatforms, 2, 'Total platforms in search should only reflect enabled count (2)');
  assert.deepEqual(result.submittedPlatforms.sort(), ['bilibili', 'youtube'].sort());
  assert.equal(result.submittedPlatforms.includes('douyin'), false, 'Disabled Douyin should not be searched');
  assert.equal(result.submittedPlatforms.includes('kuaishou'), false, 'Disabled Kuaishou should not be searched');
});

test('PlatformManager: Disabling current active platform auto-switches to another enabled platform', () => {
  const storagePath = getTempStoragePath();
  const storage = new StorageManager(storagePath);
  storage.updateSettings({
    platformSetupCompleted: true,
    lastPlatform: 'bilibili',
    enabledPlatformIds: ['bilibili', 'douyin', 'kuaishou'],
  });

  const win = new MockBrowserWindow();
  const sess = new MockSessionManager();
  const pm = new PlatformManager(win, sess, storage);

  assert.equal(pm.getActivePlatform(), 'bilibili');

  // User disables bilibili in settings
  pm.updateEnabledPlatforms(['douyin', 'kuaishou']);

  // Active platform must automatically switch to first remaining enabled platform
  assert.equal(pm.getActivePlatform(), 'douyin');

  // Cannot switch directly to disabled platform
  const switchedToBili = pm.switchPlatform('bilibili');
  assert.equal(switchedToBili, false, 'Switching to disabled platform must be rejected');
});

test('PlatformManager: Bookmarks and history of disabled platforms remain completely preserved', () => {
  const storagePath = getTempStoragePath();
  const storage = new StorageManager(storagePath);

  storage.addBookmark({
    platform: 'kuaishou',
    title: '快手热门视频',
    url: 'https://kuaishou.com/video/1',
  });
  storage.addHistory('kuaishou', '快手浏览历史', 'https://kuaishou.com/history/1');

  // Disable Kuaishou
  storage.updateSettings({
    enabledPlatformIds: ['bilibili', 'douyin'],
  });

  const bookmarks = storage.getBookmarks();
  const history = storage.getHistory();

  const ksBookmark = bookmarks.find((b) => b.platform === 'kuaishou');
  const ksHistory = history.find((h) => h.platform === 'kuaishou');

  assert.ok(ksBookmark, 'Kuaishou bookmark should not be deleted');
  assert.ok(ksHistory, 'Kuaishou history should not be deleted');
});
