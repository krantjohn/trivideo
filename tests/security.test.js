const test = require('node:test');
const assert = require('node:assert');
const { isUrlAllowedForPlatform, getPlatformForUrl } = require('../dist/main/platform-config.js');

test('Security URL Validator: Intercepts unsafe protocols', (t) => {
  const safeProtocols = ['http:', 'https:', 'file:'];

  function isProtocolAllowed(rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      return safeProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  assert.strictEqual(isProtocolAllowed('https://www.bilibili.com'), true);
  assert.strictEqual(isProtocolAllowed('https://www.douyin.com'), true);
  assert.strictEqual(isProtocolAllowed('https://www.xiaohongshu.com'), true);
  assert.strictEqual(isProtocolAllowed('javascript:alert(1)'), false);
  assert.strictEqual(isProtocolAllowed('data:text/html,malicious'), false);
  assert.strictEqual(isProtocolAllowed('vbscript:evil()'), false);
  assert.strictEqual(isProtocolAllowed('file:///path/to/local/file'), true);
  assert.strictEqual(isProtocolAllowed('not a valid url'), false);
});

test('Security Domain Routing: Strict domain whitelist & anti-spoofing', (t) => {
  // 1. Legitimate platform subdomains
  assert.strictEqual(isUrlAllowedForPlatform('https://www.bilibili.com/video/BV1xx', 'bilibili'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://passport.bilibili.com/login', 'bilibili'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://live.bilibili.com/123', 'bilibili'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.douyin.com/hot', 'douyin'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://passport.bytedance.com/login', 'douyin'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.xiaohongshu.com/explore', 'xiaohongshu'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.youtube.com/watch?v=abc', 'youtube'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://accounts.google.com/ServiceLogin', 'youtube'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.kuaishou.com/new-reco', 'kuaishou'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://live.kuaishou.com/u/123', 'kuaishou'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://p2.a.yximgs.com/test.jpg', 'kuaishou'), true);

  // 2. Strict Cross-Platform Isolation (Douyin link must NOT be allowed inside Bilibili view)
  assert.strictEqual(isUrlAllowedForPlatform('https://www.douyin.com/video/123', 'bilibili'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.bilibili.com/video/123', 'douyin'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.xiaohongshu.com/explore', 'douyin'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.youtube.com/watch?v=123', 'bilibili'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.bilibili.com/video/123', 'youtube'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.kuaishou.com/video/123', 'bilibili'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.bilibili.com/video/123', 'kuaishou'), false);

  // 3. Subdomain Spoofing & Phishing Attack Rejection (Critical security check)
  assert.strictEqual(isUrlAllowedForPlatform('https://attacker-bilibili.com', 'bilibili'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://bilibili.com.attacker.com', 'bilibili'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://fake-douyin.com', 'douyin'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://phishing-xiaohongshu.com', 'xiaohongshu'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://www.google.com', 'bilibili'), false);
  // 4. Official Short-Domain Routing (b23.tv, v.douyin.com, xhslink.com)
  assert.strictEqual(isUrlAllowedForPlatform('https://b23.tv/BV1xx', 'bilibili'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://v.douyin.com/abc123', 'douyin'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://xhslink.com/a/xyz789', 'xiaohongshu'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://attacker-b23.tv', 'bilibili'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://b23.tv.evil.com', 'bilibili'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://xhslink.com.phishing.cn', 'xiaohongshu'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://youtu.be/xyz123', 'youtube'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://attacker-youtu.be', 'youtube'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://fake-youtube.com', 'youtube'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://youtube.com.attacker.com', 'youtube'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://v.kuaishou.com/xyz123', 'kuaishou'), true);
  assert.strictEqual(isUrlAllowedForPlatform('https://attacker-kuaishou.com', 'kuaishou'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://v.kuaishou.com.evil.com', 'kuaishou'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://fake-kuaishou.com', 'kuaishou'), false);
  assert.strictEqual(isUrlAllowedForPlatform('https://kuaishou.com.attacker.com', 'kuaishou'), false);
});

test('Security Domain Routing: Multi-platform link router detection', (t) => {
  assert.strictEqual(getPlatformForUrl('https://www.bilibili.com/video/BV123'), 'bilibili');
  assert.strictEqual(getPlatformForUrl('https://b23.tv/BV123'), 'bilibili');
  assert.strictEqual(getPlatformForUrl('https://live.douyin.com/456'), 'douyin');
  assert.strictEqual(getPlatformForUrl('https://v.douyin.com/abc456'), 'douyin');
  assert.strictEqual(getPlatformForUrl('https://www.xiaohongshu.com/explore'), 'xiaohongshu');
  assert.strictEqual(getPlatformForUrl('https://xhslink.com/m/xyz'), 'xiaohongshu');
  assert.strictEqual(getPlatformForUrl('https://www.youtube.com/watch?v=123'), 'youtube');
  assert.strictEqual(getPlatformForUrl('https://youtu.be/123'), 'youtube');
  assert.strictEqual(getPlatformForUrl('https://www.kuaishou.com/new-reco'), 'kuaishou');
  assert.strictEqual(getPlatformForUrl('https://v.kuaishou.com/abc'), 'kuaishou');
  assert.strictEqual(getPlatformForUrl('https://www.baidu.com'), null);
  assert.strictEqual(getPlatformForUrl('https://attacker-bilibili.com'), null);
});

test('Security Navigation: In-page navigation decision matrix', (t) => {
  function decideNavigationAction(url, currentPlatform) {
    if (isUrlAllowedForPlatform(url, currentPlatform)) {
      return { action: 'allow' };
    }
    const targetPlatform = getPlatformForUrl(url);
    if (targetPlatform && targetPlatform !== currentPlatform) {
      return { action: 'switch', targetPlatform };
    }
    return { action: 'external' };
  }

  // 1. Same-platform navigation: allow in-page
  assert.deepStrictEqual(
    decideNavigationAction('https://www.bilibili.com/video/BV1', 'bilibili'),
    { action: 'allow' }
  );
  assert.deepStrictEqual(
    decideNavigationAction('https://b23.tv/BV1', 'bilibili'),
    { action: 'allow' }
  );

  // 2. Cross-platform navigation: switch platform
  assert.deepStrictEqual(
    decideNavigationAction('https://www.douyin.com/video/2', 'bilibili'),
    { action: 'switch', targetPlatform: 'douyin' }
  );
  assert.deepStrictEqual(
    decideNavigationAction('https://xhslink.com/a/3', 'bilibili'),
    { action: 'switch', targetPlatform: 'xiaohongshu' }
  );

  // 3. External link: block in-view and route to system browser
  assert.deepStrictEqual(
    decideNavigationAction('https://github.com/trending', 'bilibili'),
    { action: 'external' }
  );
  assert.deepStrictEqual(
    decideNavigationAction('https://phishing.site/fake', 'douyin'),
    { action: 'external' }
  );
});
