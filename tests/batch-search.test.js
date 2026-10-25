const test = require('node:test');
const assert = require('node:assert');
const EventEmitter = require('node:events');

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

const { PlatformManager } = require('../dist/main/platform-manager.js');

class MockSessionManager {
  getSession() { return { setPermissionRequestHandler() {} }; }
}

class MockStorageManager {
  constructor() {
    this.historyRecorded = [];
  }
  getSettings() { return { lastPlatform: 'bilibili' }; }
  updateSettings() {}
  addHistory(platform, title, url) {
    this.historyRecorded.push({ platform, title, url });
  }
}

test('Batch Search: Empty or whitespace query rejection', async () => {
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());

  const res1 = await pm.searchAllPlatforms('');
  assert.strictEqual(res1.query, '');
  assert.strictEqual(res1.submittedPlatforms.length, 0);

  const res2 = await pm.searchAllPlatforms('   ');
  assert.strictEqual(res2.query, '');
  assert.strictEqual(res2.submittedPlatforms.length, 0);
});

test('Batch Search: Dispatches to all 5 registered platforms with correct encoding including Kuaishou & YouTube', async () => {
  const win = new MockBrowserWindow();
  const storage = new MockStorageManager();
  const pm = new PlatformManager(win, new MockSessionManager(), storage);

  // Active platform initially bilibili
  assert.strictEqual(pm.getActivePlatform(), 'bilibili');

  const res = await pm.searchAllPlatforms('人工智能');
  assert.strictEqual(res.query, '人工智能');
  assert.strictEqual(res.totalPlatforms, 5);
  assert.strictEqual(res.submittedPlatforms.length, 5);
  assert.strictEqual(res.submittedPlatforms.includes('bilibili'), true);
  assert.strictEqual(res.submittedPlatforms.includes('douyin'), true);
  assert.strictEqual(res.submittedPlatforms.includes('xiaohongshu'), true);
  assert.strictEqual(res.submittedPlatforms.includes('youtube'), true);
  assert.strictEqual(res.submittedPlatforms.includes('kuaishou'), true);
  assert.strictEqual(res.failedPlatforms.length, 0);

  // Active platform must NOT change
  assert.strictEqual(pm.getActivePlatform(), 'bilibili');

  // Verify URLs for all platform views
  const biliView = pm.platformViews.get('bilibili');
  const douyinView = pm.platformViews.get('douyin');
  const xhsView = pm.platformViews.get('xiaohongshu');
  const ytView = pm.platformViews.get('youtube');
  const ksView = pm.platformViews.get('kuaishou');

  const encoded = encodeURIComponent('人工智能');
  assert.strictEqual(
    biliView.webContents.loadedUrls.pop(),
    `https://search.bilibili.com/all?keyword=${encoded}`
  );
  assert.strictEqual(
    douyinView.webContents.loadedUrls.pop(),
    `https://www.douyin.com/search/${encoded}`
  );
  assert.strictEqual(
    xhsView.webContents.loadedUrls.pop(),
    `https://www.xiaohongshu.com/search_result?keyword=${encoded}`
  );
  assert.strictEqual(
    ytView.webContents.loadedUrls.pop(),
    `https://www.youtube.com/results?search_query=${encoded}`
  );
  assert.strictEqual(
    ksView.webContents.loadedUrls.pop(),
    `https://www.kuaishou.com/search/video?searchKey=${encoded}`
  );
});

test('Batch Search: Special characters and symbols encoding on Kuaishou and YouTube', async () => {
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());

  const query = 'React & Vue #2026? 50% / test+extra';
  const res = await pm.searchAllPlatforms(query);
  assert.strictEqual(res.query, query);
  assert.strictEqual(res.submittedPlatforms.length, 5);

  const encoded = encodeURIComponent(query);
  const ksView = pm.platformViews.get('kuaishou');
  assert.strictEqual(
    ksView.webContents.loadedUrls.pop(),
    `https://www.kuaishou.com/search/video?searchKey=${encoded}`
  );
});

test('Batch Search: Query length truncation (max 200 chars)', async () => {
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());

  const longQuery = 'A'.repeat(250);
  const res = await pm.searchAllPlatforms(longQuery);
  assert.strictEqual(res.query.length, 200);
  assert.strictEqual(res.query, 'A'.repeat(200));
  assert.strictEqual(res.submittedPlatforms.length, 5);
});

test('Batch Search: Active platform persistence across switches', async () => {
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());

  pm.switchPlatform('kuaishou');
  assert.strictEqual(pm.getActivePlatform(), 'kuaishou');

  await pm.searchAllPlatforms('测试搜索');
  // Must remain kuaishou
  assert.strictEqual(pm.getActivePlatform(), 'kuaishou');
});

test('Batch Search: Graceful handling when one view is destroyed', async () => {
  const win = new MockBrowserWindow();
  const pm = new PlatformManager(win, new MockSessionManager(), new MockStorageManager());

  const xhsView = pm.platformViews.get('xiaohongshu');
  xhsView.webContents.destroyed = true;

  const res = await pm.searchAllPlatforms('容错测试');
  assert.strictEqual(res.submittedPlatforms.includes('bilibili'), true);
  assert.strictEqual(res.submittedPlatforms.includes('douyin'), true);
  assert.strictEqual(res.submittedPlatforms.includes('youtube'), true);
  assert.strictEqual(res.submittedPlatforms.includes('kuaishou'), true);
  assert.strictEqual(res.submittedPlatforms.includes('xiaohongshu'), false);
  assert.strictEqual(res.failedPlatforms.length, 1);
  assert.strictEqual(res.failedPlatforms[0].platform, 'xiaohongshu');
  assert.match(res.failedPlatforms[0].reason, /销毁/);
});

test('Batch Search: Inactive platform background search does not pollute history', async () => {
  const win = new MockBrowserWindow();
  const storage = new MockStorageManager();
  const pm = new PlatformManager(win, new MockSessionManager(), storage);

  // Active platform is bilibili
  assert.strictEqual(pm.getActivePlatform(), 'bilibili');

  await pm.searchAllPlatforms('科技前沿');

  // Simulate did-stop-loading event on kuaishou (which is inactive)
  const ksView = pm.platformViews.get('kuaishou');
  ksView.webContents.emit('did-stop-loading');

  // Verify that storage.historyRecorded has NOT added kuaishou's page
  const ksHistory = storage.historyRecorded.filter(h => h.platform === 'kuaishou');
  assert.strictEqual(ksHistory.length, 0, 'Inactive platform search should not record history item');

  // Simulate did-stop-loading event on bilibili (active)
  const biliView = pm.platformViews.get('bilibili');
  biliView.webContents.emit('did-stop-loading');

  const biliHistory = storage.historyRecorded.filter(h => h.platform === 'bilibili');
  assert.strictEqual(biliHistory.length, 1, 'Active platform search should record history when loaded');
  assert.strictEqual(biliHistory[0].platform, 'bilibili');
  assert.match(biliHistory[0].url, /search\.bilibili\.com/);
});
