const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { StorageManager } = require('../dist/main/storage.js');

test('Edge Cases: StorageManager handles corrupted JSON gracefully', (t) => {
  const tmpFile = path.join(os.tmpdir(), `trivideo-corrupt-${Date.now()}.json`);
  try {
    fs.writeFileSync(tmpFile, '!!! INVALID CORRUPT JSON DATA @@@', 'utf-8');
    const storage = new StorageManager(tmpFile);
    // Should fallback to default settings without crashing
    const settings = storage.getSettings();
    assert.strictEqual(settings.theme, 'dark');
    assert.strictEqual(settings.lastPlatform, 'bilibili');
    assert.ok(storage.getBookmarks().length > 0);
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test('Edge Cases: History enforces maximum capacity limit (200 items)', (t) => {
  const tmpFile = path.join(os.tmpdir(), `trivideo-histcap-${Date.now()}.json`);
  try {
    const storage = new StorageManager(tmpFile);
    storage.clearHistory();

    // Add 250 distinct history items
    for (let i = 0; i < 250; i++) {
      storage.addHistory('bilibili', `Video ${i}`, `https://www.bilibili.com/video/BV${i}`);
    }

    const hist = storage.getHistory();
    assert.strictEqual(hist.length, 200, 'History should be capped at 200 items');
    assert.strictEqual(hist[0].title, 'Video 249', 'Most recent item should be first');
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test('Edge Cases: Bookmarks with special characters and empty notes', (t) => {
  const tmpFile = path.join(os.tmpdir(), `trivideo-bm-edge-${Date.now()}.json`);
  try {
    const storage = new StorageManager(tmpFile);
    const item = storage.addBookmark({
      platform: 'douyin',
      title: '<script>alert("xss")</script> & "quotes" & 💖 special chars',
      url: 'https://www.douyin.com/video/999?query=1&ref=test#hash',
    });
    assert.ok(item.id);
    assert.strictEqual(item.title, '<script>alert("xss")</script> & "quotes" & 💖 special chars');

    const loaded = storage.getBookmarks().find((b) => b.id === item.id);
    assert.ok(loaded);
    assert.strictEqual(loaded.title, item.title);
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test('Edge Cases: Removing non-existent bookmark or history returns false', (t) => {
  const tmpFile = path.join(os.tmpdir(), `trivideo-nonexist-${Date.now()}.json`);
  try {
    const storage = new StorageManager(tmpFile);
    const removedBm = storage.removeBookmark('non-existent-id-12345');
    assert.strictEqual(removedBm, false);

    const removedHist = storage.removeHistoryItem('non-existent-id-67890');
    assert.strictEqual(removedHist, false);
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});
