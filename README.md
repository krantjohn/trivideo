# 同画 (TongHua) · 多平台视频创作聚合工作台

> 一个为 Windows 10/11 深度打造的现代化多平台视频聚合、同屏对比与多屏视窗工作台客户端。原名 TriVideo，自 v1.5.0 起全面重构升级更名为 **「同画」**。

[![Release](https://img.shields.io/badge/Release-v1.5.0-blue.svg)](https://github.com/krantjohn/trivideo/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D6.svg?logo=windows)](https://github.com/krantjohn/trivideo)
[![Electron](https://img.shields.io/badge/Electron-33.x-47848F.svg?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)

---

## 📖 软件简介

**「同画 (TongHua)」** 旨在彻底解决 PC 端用户在多个视频平台（**哔哩哔哩、抖音、小红书、YouTube、快手**）之间频繁切换窗口、账号串号、多屏对比繁琐等痛点。

通过底层多实例 `WebContentsView` 沙箱架构，同画为各大视频平台提供完全独立的持久化 Session 隔离，并打造了前所未有的**同屏多视窗交互工作台（单屏 / 双屏 / 三屏 / 四屏）**，让视频观看、多源情报对比、创作参考与休闲娱乐在一个界面内同时展开。

---

## 🌟 核心特性与亮点 (v1.5.0)

### 1. 4 大精选定制主题（含全新羊皮纸冒险）
- **羊皮纸冒险 (RPG Adventure)**：中世纪工坊拟物风格，配备深胡桃木雕刻横梁、手撕羊皮纸搜索卷轴、3D 赤红火漆印章按钮、悬挂布幔战旗平台导航与藏宝图路线多屏节点。
- **深色沉浸 (Dark Slate)**：黑曜石墨高沉浸护眼深色，低眩光长时间观影首选。
- **清新浅色 (Pure Light)**：极简雅致素白开阔质感。
- **浪漫樱粉 (Sakura Anime)**：梦幻甜美樱花粉色调。

### 2. 五大主流视频平台原生聚合
- **原生支持**：哔哩哔哩 (`bilibili`)、抖音 (`douyin`)、小红书 (`xiaohongshu`)、YouTube (`youtube`)、快手 (`kuaishou`)。
- **独立 Session 物理隔离**：每个平台均运行在专属的 `persist:<platform>` 沙箱分区中，Cookie、登录令牌与本地存储互不串号、互不干扰。
- **原网高码率原生体验**：保留各平台原生 4K/1080P 超高清画质、弹幕渲染、点赞投币、倍速播放与登录态。

### 3. 多屏协同视频工作台 (Multi-Pane Workbench)
- **单屏模式 (Single)**：纯享全屏沉浸浏览。
- **双屏模式 (Split)**：左右双栏对比，无级拖拽分屏宽度比例。
- **三屏模式 (Triple)**：1 个主视窗 (~60% 宽) + 2 个副视窗上下堆叠 (~50% 高)。
- **四屏模式 (Quad)**：2x2 四宫格全景监控工作台。
- **音频独占管理**：仅当前鼠标聚焦的视窗发声，其余视窗自动静音，告别声音嘈杂；点击任一视窗一秒无缝切换声音。
- **全屏无损恢复**：网页视频原生全屏时自动独立占满显示器；退出全屏后精准恢复原有工作台分屏比例与音频焦点。

### 4. 全平台统一批量搜索
- 顶部羊皮纸卷轴搜索框中单次输入关键词，一键同步向所有已启用的平台并发检索，搜索结果在各分屏视窗内原位展示。

### 5. 极速更新机制与主页自动弹窗提示
- **自动检测与即时提醒**：启动软件后自动并行向官方更新通道检测，新版本发布时主页第一时间主动弹出升级提醒窗口。
- **取消限速与镜像加速**：直连与镜像智能双通道，下载不限速，支持断点与高速流式写入。
- **无感覆盖升级与数据安全**：升级覆盖绝不删除用户的登录凭据、自选平台偏好与本地配置。

---

## 🛠 技术架构

- **桌面运行时**：Electron 33 (Chromium 131)
- **UI 渲染引擎**：React 18 + TypeScript + Vite 6
- **图标与资产**：Lucide React + 独家手工矢量拟物资产 (`AdventureAssets.tsx`)
- **存储方案**：本地原子写入持久化 JSON 配置库
- **打包分发**：electron-builder (Windows NSIS 安装程序 + 免安装便携版)

---

## 🚀 极简编译与运行

```bash
# 1. 克隆仓库
git clone https://github.com/krantjohn/trivideo.git
cd trivideo

# 2. 安装依赖
npm install

# 3. 本地开发调试
npm run dev

# 4. 执行自动化测试 (65项全量通过)
npm test

# 5. 打包 Windows 正式安装程序与便携版
npm run dist:nsis      # 生成 release/TongHua-Setup-1.5.0.exe
npm run dist:portable  # 生成 release/TongHua-Portable-1.5.0.exe
```

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 许可协议开源。
