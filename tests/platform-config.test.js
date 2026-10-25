const test = require('node:test');
const assert = require('node:assert');
const { PLATFORM_CONFIGS } = require('../dist/main/platform-config.js');

test('Platform Configs: All 3 platforms are configured correctly', (t) => {
  const platforms = Object.keys(PLATFORM_CONFIGS);
  assert.deepStrictEqual(platforms.sort(), ['bilibili', 'douyin', 'xiaohongshu'].sort());

  for (const [id, config] of Object.entries(PLATFORM_CONFIGS)) {
    assert.strictEqual(config.id, id);
    assert.ok(config.name.length > 0, `Platform ${id} must have a Chinese display name`);
    assert.ok(config.brandColor.startsWith('#'), `Platform ${id} brandColor must be hex`);
    assert.ok(config.homeUrl.startsWith('https://'), `Platform ${id} homeUrl must be HTTPS`);
    assert.ok(config.searchUrlTemplate.includes('{query}'), `Platform ${id} searchUrlTemplate must include {query}`);
    assert.strictEqual(config.partition, `persist:${id}`, `Platform ${id} must have independent persistent partition`);
    assert.ok(Array.isArray(config.categories) && config.categories.length >= 5, `Platform ${id} must have at least 5 categories`);

    for (const cat of config.categories) {
      assert.ok(cat.id, 'Category must have an id');
      assert.ok(cat.name, 'Category must have a name');
      assert.ok(cat.url.startsWith('https://'), `Category ${cat.name} URL must be HTTPS`);
    }
  }
});

test('Platform Configs: Search URL templates generate valid queries', (t) => {
  const biliSearch = PLATFORM_CONFIGS.bilibili.searchUrlTemplate.replace('{query}', encodeURIComponent('原神'));
  assert.strictEqual(biliSearch, 'https://search.bilibili.com/all?keyword=%E5%8E%9F%E7%A5%9E');

  const douyinSearch = PLATFORM_CONFIGS.douyin.searchUrlTemplate.replace('{query}', encodeURIComponent('美食'));
  assert.strictEqual(douyinSearch, 'https://www.douyin.com/search/%E7%BE%8E%E9%A3%9F');

  const xhsSearch = PLATFORM_CONFIGS.xiaohongshu.searchUrlTemplate.replace('{query}', encodeURIComponent('穿搭'));
  assert.strictEqual(xhsSearch, 'https://www.xiaohongshu.com/search_result?keyword=%E7%A9%BF%E6%90%AD');
});
