const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { StorageManager } = require('../dist/main/storage');

test('Category Recommendation Removal: Clean elimination from Sidebar and App layout', () => {
  const sidebarCode = fs.readFileSync(path.join(__dirname, '../src/renderer/components/Sidebar.tsx'), 'utf-8');
  const appCode = fs.readFileSync(path.join(__dirname, '../src/renderer/App.tsx'), 'utf-8');

  // 1. Sidebar does not contain "分类推荐" heading or cat-pill buttons
  assert.ok(!sidebarCode.includes('分类推荐'), 'Sidebar must not contain "分类推荐" section');
  assert.ok(!sidebarCode.includes('cat-pill'), 'Sidebar must not contain "cat-pill" css class');

  // 2. App.tsx does not mount CategoryBar
  assert.ok(!appCode.includes('<CategoryBar'), 'App.tsx must not render CategoryBar in layout');
  assert.ok(!appCode.includes('handleCategorySelect'), 'App.tsx must not have unused category handler');

  // 3. CategoryBar.tsx exists as clean component file for backwards compatibility
  assert.ok(fs.existsSync(path.join(__dirname, '../src/renderer/components/CategoryBar.tsx')), 'CategoryBar.tsx component exists');
});

test('Theme Palettes: Comprehensive verification of 8 themes in variables.css', () => {
  const css = fs.readFileSync(path.join(__dirname, '../src/renderer/styles/variables.css'), 'utf-8');
  const indexCss = fs.readFileSync(path.join(__dirname, '../src/renderer/styles/index.css'), 'utf-8');

  // Required 8 Themes
  const requiredThemes = ['dark', 'light', 'cat', 'cyberpunk', 'forest', 'sunset', 'nordic', 'sakura'];
  for (const t of requiredThemes) {
    assert.ok(css.includes(`[data-theme='${t}']`), `variables.css must define [data-theme='${t}']`);
  }

  // 1. Cat Theme Palette Verification (Warm healing milk-tea, paw pink)
  assert.ok(css.includes('--bg-primary: #fdf6ee;'), 'Cat theme must have warm almond cream background');
  assert.ok(css.includes('--accent-primary: #ff758f;'), 'Cat theme must have coral paw pink accent');
  assert.ok(css.includes('--text-primary: #3d2b20;'), 'Cat theme must have warm dark mocha text');

  // 2. Cyberpunk Theme Palette Verification (Dark purple, neon cyan)
  assert.ok(css.includes('--bg-primary: #090714;'), 'Cyberpunk theme must have deep night purple background');
  assert.ok(css.includes('--accent-primary: #00f0ff;'), 'Cyberpunk theme must have electric cyan accent');

  // 3. Forest Zen Theme Palette Verification (Moss green, matcha)
  assert.ok(css.includes('--bg-primary: #0d1613;'), 'Forest theme must have deep moss green background');
  assert.ok(css.includes('--accent-primary: #52b788;'), 'Forest theme must have matcha green accent');

  // 4. Sunset Ember Theme Palette Verification (Twilight violet, sunset amber)
  assert.ok(css.includes('--bg-primary: #150f1b;'), 'Sunset theme must have twilight violet background');
  assert.ok(css.includes('--accent-primary: #f97316;'), 'Sunset theme must have sunset amber accent');

  // 5. Nordic Slate Theme Palette Verification (Morandi slate, ice blue)
  assert.ok(css.includes('--bg-primary: #12151b;'), 'Nordic theme must have cold slate background');
  assert.ok(css.includes('--accent-primary: #38bdf8;'), 'Nordic theme must have arctic ice blue accent');

  // 6. Sakura Anime Theme Palette Verification (Romantic cherry blossom pink)
  assert.ok(css.includes('--bg-primary: #fff5f8;'), 'Sakura theme must have cherry blossom pink background');
  assert.ok(css.includes('--accent-primary: #ff758c;'), 'Sakura theme must have sakura pink accent');

  // Glass Acrylic Variables
  assert.ok(css.includes('--bg-glass-sidebar'), 'Must define frosted glass sidebar variable');
  assert.ok(css.includes('--bg-glass-header'), 'Must define frosted glass header variable');
  assert.ok(css.includes('--bg-glass-card'), 'Must define frosted glass card variable');

  // Frosted Glass Blur Rules in index.css
  assert.ok(indexCss.includes('[data-custom-bg="true"]'), 'index.css must include custom background rules');
  assert.ok(indexCss.includes('backdrop-filter: blur('), 'index.css must include backdrop-filter blur');
});

test('Cat Theme Assets & Wallpapers: Vector SVG illustrations and wallpaper bundling', () => {
  const catAssetsPath = path.join(__dirname, '../src/renderer/assets/CatAssets.tsx');
  assert.ok(fs.existsSync(catAssetsPath), 'CatAssets.tsx must exist');

  const catAssetsCode = fs.readFileSync(catAssetsPath, 'utf-8');
  assert.ok(catAssetsCode.includes('CatPawIcon'), 'Must export CatPawIcon');
  assert.ok(catAssetsCode.includes('CatSleepingIllustration'), 'Must export CatSleepingIllustration');
  assert.ok(catAssetsCode.includes('CatCompanionWidget'), 'Must export CatCompanionWidget');
  assert.ok(catAssetsCode.includes('CAT_WALLPAPERS'), 'Must export CAT_WALLPAPERS list');

  // All 4 downloaded royalty-free high-res cat wallpapers
  const wpDir = path.join(__dirname, '../src/renderer/assets/wallpapers');
  const expectedWallpapers = [
    'cat-orange.jpg',
    'cat-british.jpg',
    'cat-night.jpg',
    'cat-blossom.jpg',
  ];

  for (const wp of expectedWallpapers) {
    const filePath = path.join(wpDir, wp);
    assert.ok(fs.existsSync(filePath), `Wallpaper ${wp} must exist on disk`);
    const stats = fs.statSync(filePath);
    assert.ok(stats.size > 50000, `Wallpaper ${wp} must be a real high-res image (>50KB)`);
  }
});

test('StorageManager: Theme and custom background persistence', () => {
  const tmpPath = path.join(__dirname, `tmp-theme-test-${Date.now()}.json`);
  try {
    const storage = new StorageManager(tmpPath);
    const initialSettings = storage.getSettings();

    // Default values
    assert.equal(initialSettings.theme, 'dark');
    assert.equal(initialSettings.customBgEnabled, false);
    assert.equal(initialSettings.customBgBlur, 16);
    assert.equal(initialSettings.customBgOpacity, 0.65);

    // Update to Cat theme
    const updatedCat = storage.updateSettings({ theme: 'cat' });
    assert.equal(updatedCat.theme, 'cat');

    // Update custom background settings
    const updatedBg = storage.updateSettings({
      customBgEnabled: true,
      customBgImage: 'data:image/png;base64,mockImageContent',
      customBgBlur: 20,
      customBgOpacity: 0.8,
    });
    assert.equal(updatedBg.customBgEnabled, true);
    assert.equal(updatedBg.customBgImage, 'data:image/png;base64,mockImageContent');
    assert.equal(updatedBg.customBgBlur, 20);
    assert.equal(updatedBg.customBgOpacity, 0.8);

    // Reload from file to ensure persistence
    const reloadedStorage = new StorageManager(tmpPath);
    const reloadedSettings = reloadedStorage.getSettings();
    assert.equal(reloadedSettings.theme, 'cat');
    assert.equal(reloadedSettings.customBgEnabled, true);
    assert.equal(reloadedSettings.customBgImage, 'data:image/png;base64,mockImageContent');
    assert.equal(reloadedSettings.customBgBlur, 20);
    assert.equal(reloadedSettings.customBgOpacity, 0.8);

    // Switch between all themes
    const allThemes = ['cyberpunk', 'forest', 'sunset', 'nordic', 'sakura', 'light', 'dark'];
    for (const theme of allThemes) {
      storage.updateSettings({ theme });
      assert.equal(storage.getSettings().theme, theme);
    }
  } finally {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  }
});

test('SettingsModal & Components: Theme picker and Frosted Background controls', () => {
  const settingsModalCode = fs.readFileSync(path.join(__dirname, '../src/renderer/components/SettingsModal.tsx'), 'utf-8');
  const sidebarCode = fs.readFileSync(path.join(__dirname, '../src/renderer/components/Sidebar.tsx'), 'utf-8');
  const topNavCode = fs.readFileSync(path.join(__dirname, '../src/renderer/components/TopNav.tsx'), 'utf-8');

  // SettingsModal Theme Picker
  assert.ok(settingsModalCode.includes('猫咪治愈'), 'SettingsModal must have 猫咪治愈 theme');
  assert.ok(settingsModalCode.includes('赛博霓虹'), 'SettingsModal must have 赛博霓虹 theme');
  assert.ok(settingsModalCode.includes('森林抹茶'), 'SettingsModal must have 森林抹茶 theme');
  assert.ok(settingsModalCode.includes('晚霞暮色'), 'SettingsModal must have 晚霞暮色 theme');
  assert.ok(settingsModalCode.includes('北欧冷灰'), 'SettingsModal must have 北欧冷灰 theme');
  assert.ok(settingsModalCode.includes('樱花二次元'), 'SettingsModal must have 樱花二次元 theme');

  // SettingsModal Custom Background Controls
  assert.ok(settingsModalCode.includes('自定义背景图与磨砂高斯模糊'), 'Must include custom background section');
  assert.ok(settingsModalCode.includes('上传本地图片'), 'Must include local image upload button');
  assert.ok(settingsModalCode.includes('磨砂高斯模糊 (Gaussian Blur)'), 'Must include Gaussian blur slider');
  assert.ok(settingsModalCode.includes('磨砂遮罩透明度 (Mask Opacity)'), 'Must include mask opacity slider');
  assert.ok(settingsModalCode.includes('CAT_WALLPAPERS.map'), 'Must render preset wallpapers');

  // Sidebar and TopNav Cat Theme integration
  assert.ok(sidebarCode.includes('CatCompanionWidget'), 'Sidebar must render CatCompanionWidget');
  assert.ok(sidebarCode.includes("theme === 'cat'"), 'Sidebar must conditionally show CatCompanionWidget on cat theme');
  assert.ok(sidebarCode.includes('CatPawIcon'), 'Sidebar must include CatPawIcon');
  assert.ok(topNavCode.includes('CatPawIcon'), 'TopNav must render CatPawIcon on active platform tab');
});

test('Wallpaper Resolution & Image Scale Protection', () => {
  const catAssetsCode = fs.readFileSync(path.join(__dirname, '../src/renderer/assets/CatAssets.tsx'), 'utf-8');
  const indexCss = fs.readFileSync(path.join(__dirname, '../src/renderer/styles/index.css'), 'utf-8');
  const settingsModalCode = fs.readFileSync(path.join(__dirname, '../src/renderer/components/SettingsModal.tsx'), 'utf-8');

  // 1. resolveWallpaperUrl exported and defined
  assert.ok(catAssetsCode.includes('export function resolveWallpaperUrl'), 'Must export resolveWallpaperUrl');

  // 2. floatZ keyframe animation exists
  assert.ok(indexCss.includes('@keyframes floatZ'), 'index.css must define @keyframes floatZ');
  assert.ok(indexCss.includes('translateY(-10px)'), 'floatZ must include vertical motion');

  // 3. Canvas image upload compression in SettingsModal
  assert.ok(settingsModalCode.includes('document.createElement(\'canvas\')'), 'SettingsModal must compress uploaded image via canvas');
  assert.ok(settingsModalCode.includes('canvas.toDataURL'), 'SettingsModal must export compressed canvas dataUrl');
});

test('StorageManager: Blur and Opacity bounds validation', () => {
  const tmpPath = path.join(__dirname, `tmp-bounds-test-${Date.now()}.json`);
  try {
    const storage = new StorageManager(tmpPath);

    // Negative blur clamped to 0
    storage.updateSettings({ customBgBlur: -10 });
    assert.equal(storage.getSettings().customBgBlur, 0);

    // Excessive blur clamped to 50
    storage.updateSettings({ customBgBlur: 100 });
    assert.equal(storage.getSettings().customBgBlur, 50);

    // Negative opacity clamped to 0
    storage.updateSettings({ customBgOpacity: -0.5 });
    assert.equal(storage.getSettings().customBgOpacity, 0);

    // Excessive opacity clamped to 1
    storage.updateSettings({ customBgOpacity: 2.5 });
    assert.equal(storage.getSettings().customBgOpacity, 1);
  } finally {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  }
});



test('Adventure Parchment & Wood Theme: Assets and CSS integration', () => {
  const css = fs.readFileSync(path.join(__dirname, '../src/renderer/styles/variables.css'), 'utf-8');
  const indexCss = fs.readFileSync(path.join(__dirname, '../src/renderer/styles/index.css'), 'utf-8');
  const assetsPath = path.join(__dirname, '../src/renderer/assets/AdventureAssets.tsx');

  assert.ok(fs.existsSync(assetsPath), 'AdventureAssets.tsx must exist');
  const assetsCode = fs.readFileSync(assetsPath, 'utf-8');
  assert.ok(assetsCode.includes('WaxSealIcon'), 'Must export WaxSealIcon');
  assert.ok(assetsCode.includes('HangingBannerTab'), 'Must export HangingBannerTab');
  assert.ok(assetsCode.includes('MilestoneNode'), 'Must export MilestoneNode');

  assert.ok(css.includes("[data-theme='adventure']"), 'Must define adventure theme in variables.css');
  assert.ok(css.includes('--bg-primary: #1e110a;'), 'Adventure theme must have dark timber background');
  assert.ok(css.includes('--bg-surface: #f5e8c7;'), 'Adventure theme must have parchment surface color');
  assert.ok(css.includes('--accent-primary: #c0392b;'), 'Adventure theme must have ruby wax seal accent');

  assert.ok(indexCss.includes("[data-theme='adventure']"), 'Must define adventure theme rules in index.css');
  assert.ok(indexCss.includes('.search-input-container'), 'Must style parchment search container');
});
