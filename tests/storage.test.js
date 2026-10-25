const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { StorageManager } = require('../dist/main/storage.js');

test('StorageManager: Initializes with defaults and saves to file', (t) => {
  const tmpFile = path.join(os.tmpdir(), `trivideo-test-${Date.now()}-${Math.random().toString(36).substring(2)}.json`);
  try {
    const storage = new StorageManager(tmpFile);
    const settings = storage.getSettings();
    assert.strictEqual(settings.theme, 'dark');
    assert.strictEqual(settings.lastPlatform, 'bilibili');
    assert.strictEqual(settings.sidebarCollapsed, false);

    const bookmarks = storage.getBookmarks();
    assert.ok(bookmarks.length > 0, 'Should load default bookmarks');

    // Update settings
    storage.updateSettings({ theme: 'light', sidebarCollapsed: true });
    const updatedSettings = storage.getSettings();
    assert.strictEqual(updatedSettings.theme, 'light');
    assert.strictEqual(updatedSettings.sidebarCollapsed, true);

    // Verify written to disk
    assert.ok(fs.existsSync(tmpFile), 'File should exist on disk');
    const diskContent = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
    assert.strictEqual(diskContent.settings.theme, 'light');

    // Add bookmark
    const newBm = storage.addBookmark({
      platform: 'douyin',
      title: '测试抖音视频',
      url: 'https://www.douyin.com/video/123456789',
    });
    assert.ok(newBm.id.startsWith('bm-'));
    assert.strictEqual(newBm.title, '测试抖音视频');

    const bookmarksAfterAdd = storage.getBookmarks();
    assert.strictEqual(bookmarksAfterAdd[0].id, newBm.id);

    // Remove bookmark
    const removed = storage.removeBookmark(newBm.id);
    assert.strictEqual(removed, true);
    assert.strictEqual(storage.getBookmarks().some((b) => b.id === newBm.id), false);

    // History tests
    storage.addHistory('xiaohongshu', '小红书探索笔记', 'https://www.xiaohongshu.com/explore/123');
    const hist = storage.getHistory();
    assert.strictEqual(hist.length, 1);
    assert.strictEqual(hist[0].platform, 'xiaohongshu');

    // Deduplication within 10s
    storage.addHistory('xiaohongshu', '小红书探索笔记', 'https://www.xiaohongshu.com/explore/123');
    assert.strictEqual(storage.getHistory().length, 1, 'Duplicate visit in quick succession should be deduplicated');

    // Remove single history item
    const histId = hist[0].id;
    const removedHist = storage.removeHistoryItem(histId);
    assert.strictEqual(removedHist, true);
    assert.strictEqual(storage.getHistory().length, 0);

    // Clear history
    storage.addHistory('bilibili', 'B站视频', 'https://www.bilibili.com/video/BV1');
    storage.clearHistory();
    assert.strictEqual(storage.getHistory().length, 0);
  } finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
});
