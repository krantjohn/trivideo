const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Compile first or require from compiled dist/main
const { compareVersions } = require('../dist/main/updater');
const { PlatformManager } = require('../dist/main/platform-manager');

test('Adaptive Zoom: Bilibili scaling calculation for split screens', () => {
  // At >= 1100px, zoom should be 1.0 (no scaling)
  assert.equal(PlatformManager.calculateAdaptiveZoomFactor('bilibili', 1200), 1.0);
  assert.equal(PlatformManager.calculateAdaptiveZoomFactor('bilibili', 1100), 1.0);

  // In split-screen mode (~550px pane width), zoom should scale proportionally to ~0.5
  const factor550 = PlatformManager.calculateAdaptiveZoomFactor('bilibili', 550);
  assert.equal(factor550, 0.5);

  // In narrow split mode (~700px pane width)
  const factor700 = PlatformManager.calculateAdaptiveZoomFactor('bilibili', 700);
  assert.ok(factor700 >= 0.63 && factor700 <= 0.64);

  // Clamped to minimum 0.25
  const factor200 = PlatformManager.calculateAdaptiveZoomFactor('bilibili', 200);
  assert.equal(factor200, 0.25);

  // Other platforms remain 1.0
  assert.equal(PlatformManager.calculateAdaptiveZoomFactor('youtube', 500), 1.0);
  assert.equal(PlatformManager.calculateAdaptiveZoomFactor('douyin', 500), 1.0);
  assert.equal(PlatformManager.calculateAdaptiveZoomFactor('xiaohongshu', 500), 1.0);
});

test('App Updater: Semantic version comparison', () => {
  assert.equal(compareVersions('1.0.2', '1.0.1'), 1);
  assert.equal(compareVersions('1.0.1', '1.0.2'), -1);
  assert.equal(compareVersions('1.0.2', '1.0.2'), 0);
  assert.equal(compareVersions('v1.0.2', '1.0.1'), 1);
  assert.equal(compareVersions('1.0.2', 'v1.0.2'), 0);
  assert.equal(compareVersions('1.0.10', '1.0.9'), 1);
  assert.equal(compareVersions('2.0.0', '1.99.99'), 1);
  assert.equal(compareVersions('1.1.0', '1.0.9'), 1);
  // Edge cases
  assert.equal(compareVersions('', ''), 0);
  assert.equal(compareVersions('1.0.0.1', '1.0.0'), 1);
  assert.equal(compareVersions('1.0.0', '1.0.0.1'), -1);
  assert.equal(compareVersions('v2', 'v1.9.9'), 1);
});

test('UI String Cleanup: Removal of redundant text and deprecated tabs', () => {
  const fs = require('fs');
  const topNavCode = fs.readFileSync(path.join(__dirname, '../src/renderer/components/TopNav.tsx'), 'utf-8');
  const sidebarCode = fs.readFileSync(path.join(__dirname, '../src/renderer/components/Sidebar.tsx'), 'utf-8');
  const categoryBarCode = fs.readFileSync(path.join(__dirname, '../src/renderer/components/CategoryBar.tsx'), 'utf-8');
  const appCode = fs.readFileSync(path.join(__dirname, '../src/renderer/App.tsx'), 'utf-8');

  // 1. Search box placeholder and title simplified from '全平台统一搜索' to '搜索'
  assert.ok(!topNavCode.includes('全平台统一搜索'), 'TopNav must not contain "全平台统一搜索"');
  assert.ok(topNavCode.includes('搜索 (Enter)...'), 'TopNav must use concise search placeholder');

  // 2. Redundant "已登录" badge removed from TopNav and Sidebar
  assert.ok(!topNavCode.includes('已登录'), 'TopNav tabs must not contain redundant "已登录" badge');
  assert.ok(!sidebarCode.includes('已登录 · 独立会话保护'), 'Sidebar must not contain "已登录 · 独立会话保护" status pill');

  // 3. "我的收藏" and "播放历史" removed from Sidebar and TopNav
  assert.ok(!sidebarCode.includes('我的收藏'), 'Sidebar must not contain "我的收藏" button');
  assert.ok(!sidebarCode.includes('播放历史'), 'Sidebar must not contain "播放历史" button');
  assert.ok(!topNavCode.includes('收藏当前页面'), 'TopNav must not contain bookmark button');
  assert.ok(!categoryBarCode.includes('收藏夹'), 'CategoryBar must not contain mode switcher for favorites');
  assert.ok(!categoryBarCode.includes('原网浏览'), 'CategoryBar must not contain mode switcher for original browse');

  // 4. App.tsx does not mount FavoritesView or HistoryView
  assert.ok(!appCode.includes('<FavoritesView'), 'App.tsx must not render FavoritesView');
  assert.ok(!appCode.includes('<HistoryView'), 'App.tsx must not render HistoryView');
});

test('NSIS Overwrite Upgrade Configuration: electron-builder.yml validation', () => {
  const fs = require('fs');
  const builderContent = fs.readFileSync(path.join(__dirname, '../electron-builder.yml'), 'utf-8');

  // Overwrite upgrade persistence guarantees
  assert.ok(builderContent.includes('guid: e89f81a6-8025-4c07-b31a-e7c65349b1fa'), 'NSIS must have fixed guid for overwrite recognition');
  assert.ok(builderContent.includes('uninstallDisplayName: ${productName}'), 'NSIS must have unified uninstallDisplayName');
  assert.ok(builderContent.includes('deleteAppDataOnUninstall: false'), 'Must protect user data on upgrades/uninstalls');
  assert.ok(builderContent.includes('allowToChangeInstallationDirectory: true'), 'Must support directory selection');
  assert.ok(builderContent.includes('oneClick: false'), 'Standard installation wizard');
});

