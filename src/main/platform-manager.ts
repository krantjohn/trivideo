import { BrowserWindow, WebContentsView, shell } from 'electron';
import { PLATFORM_CONFIGS, isUrlAllowedForPlatform, getPlatformForUrl } from './platform-config';
import { SessionManager } from './session-manager';
import { StorageManager } from './storage';
import {
  PlatformId,
  PlatformConfig,
  NavigationState,
  ContentBounds,
  ViewMode,
  BatchSearchResult,
  LayoutMode,
  PaneId,
  SplitConfig,
  SplitBounds,
  PaneInfo,
} from '../types';

export class PlatformManager {
  private mainWindow: BrowserWindow;
  private sessionManager: SessionManager;
  private storageManager: StorageManager;
  private activePlatform: PlatformId = 'bilibili';
  private viewMode: ViewMode = 'platform';
  private platformViews: Map<PlatformId, WebContentsView> = new Map();
  private currentBounds: ContentBounds = { x: 240, y: 102, width: 1200, height: 798 };
  private onNavChangeCallback?: (state: NavigationState) => void;
  private navErrors: Map<PlatformId, { errorCode: number; errorDescription: string }> = new Map();
  private platformViewVisible: boolean = true;
  private isFullscreen: boolean = false;
  private wasMaximizedBeforeFullscreen: boolean = false;
  private onFullscreenChangeCallback?: (isFullscreen: boolean) => void;
  private enabledPlatformIds: PlatformId[] = ['bilibili', 'douyin', 'xiaohongshu', 'youtube', 'kuaishou'];

  // Split-screen & Multi-panel management
  private layoutMode: LayoutMode = 'single';
  private panes: PaneInfo[] = [
    { id: 'pane-1', platform: 'bilibili' },
    { id: 'pane-2', platform: 'youtube' },
    { id: 'pane-3', platform: 'douyin' },
    { id: 'pane-4', platform: 'kuaishou' },
  ];
  private focusedPaneId: string = 'pane-1';
  private leftPlatform: PlatformId = 'bilibili';
  private rightPlatform: PlatformId = 'youtube';
  private focusedPane: PaneId = 'left';
  private splitRatio: number = 0.5;
  private horizontalRatio: number = 0.5;

  private singleBounds: ContentBounds = { x: 240, y: 102, width: 1200, height: 798 };
  private leftBounds: ContentBounds = { x: 240, y: 138, width: 595, height: 762 };
  private rightBounds: ContentBounds = { x: 845, y: 138, width: 595, height: 762 };
  private paneBounds: Map<string, ContentBounds> = new Map();

  private preFullscreenLayoutMode: LayoutMode = 'single';
  private fullscreenPlatform: PlatformId | null = null;
  private onSplitConfigChangeCallback?: (config: SplitConfig) => void;

  constructor(
    mainWindow: BrowserWindow,
    sessionManager: SessionManager,
    storageManager: StorageManager
  ) {
    this.mainWindow = mainWindow;
    this.sessionManager = sessionManager;
    this.storageManager = storageManager;

    const savedSettings = this.storageManager.getSettings();
    if (savedSettings.enabledPlatformIds && savedSettings.enabledPlatformIds.length > 0) {
      this.enabledPlatformIds = [...savedSettings.enabledPlatformIds];
    }
    if (savedSettings.lastPlatform && PLATFORM_CONFIGS[savedSettings.lastPlatform] && this.enabledPlatformIds.includes(savedSettings.lastPlatform)) {
      this.activePlatform = savedSettings.lastPlatform;
    } else if (this.enabledPlatformIds.length > 0) {
      this.activePlatform = this.enabledPlatformIds[0];
    }

    if (savedSettings.splitConfig) {
      if (savedSettings.splitConfig.splitRatio >= 0.2 && savedSettings.splitConfig.splitRatio <= 0.8) {
        this.splitRatio = savedSettings.splitConfig.splitRatio;
      }
      if (
        savedSettings.splitConfig.horizontalRatio &&
        savedSettings.splitConfig.horizontalRatio >= 0.2 &&
        savedSettings.splitConfig.horizontalRatio <= 0.8
      ) {
        this.horizontalRatio = savedSettings.splitConfig.horizontalRatio;
      }
      if (savedSettings.splitConfig.panes && Array.isArray(savedSettings.splitConfig.panes)) {
        for (const sp of savedSettings.splitConfig.panes) {
          const match = this.panes.find((p) => p.id === sp.id);
          if (match && this.enabledPlatformIds.includes(sp.platform)) {
            match.platform = sp.platform;
          }
        }
      }
      if (this.enabledPlatformIds.includes(savedSettings.splitConfig.leftPlatform)) {
        this.panes[0].platform = savedSettings.splitConfig.leftPlatform;
        this.leftPlatform = savedSettings.splitConfig.leftPlatform;
      }
      if (
        this.enabledPlatformIds.includes(savedSettings.splitConfig.rightPlatform) &&
        savedSettings.splitConfig.rightPlatform !== this.leftPlatform
      ) {
        this.panes[1].platform = savedSettings.splitConfig.rightPlatform;
        this.rightPlatform = savedSettings.splitConfig.rightPlatform;
      }
      if (savedSettings.splitConfig.focusedPaneId) {
        this.focusedPaneId = savedSettings.splitConfig.focusedPaneId;
      } else if (savedSettings.splitConfig.focusedPane) {
        this.focusedPaneId = savedSettings.splitConfig.focusedPane === 'right' ? 'pane-2' : 'pane-1';
      }
    }
    this.ensureValidPanes();

    if (savedSettings.platformSetupCompleted === false) {
      this.platformViewVisible = false;
    }

    this.initViews();
    this.setupWindowListeners();
    this.updateViewPlacement();
  }

  private ensureValidPanes(): void {
    const enabled = [...this.enabledPlatformIds];
    const defaultList: PlatformId[] = ['bilibili', 'youtube', 'douyin', 'kuaishou', 'xiaohongshu'];

    if (!this.panes || this.panes.length < 4) {
      this.panes = [
        { id: 'pane-1', platform: 'bilibili' },
        { id: 'pane-2', platform: 'youtube' },
        { id: 'pane-3', platform: 'douyin' },
        { id: 'pane-4', platform: 'kuaishou' },
      ];
    }

    const usedPlatforms = new Set<PlatformId>();
    for (let i = 0; i < this.panes.length; i++) {
      const pane = this.panes[i];
      if (enabled.includes(pane.platform) && !usedPlatforms.has(pane.platform)) {
        usedPlatforms.add(pane.platform);
      } else {
        const available = enabled.find((p) => !usedPlatforms.has(p));
        if (available) {
          pane.platform = available;
          usedPlatforms.add(available);
        } else {
          pane.platform = enabled[i % enabled.length] || defaultList[i] || 'bilibili';
        }
      }
    }

    this.leftPlatform = this.panes[0].platform;
    this.rightPlatform = this.panes[1].platform;

    const visible = this.getVisiblePanes();
    const isFocusedVisible = visible.some(
      (p) =>
        p.id === this.focusedPaneId ||
        (p.id === 'pane-1' && this.focusedPaneId === 'left') ||
        (p.id === 'pane-2' && this.focusedPaneId === 'right')
    );
    if (!isFocusedVisible && visible.length > 0) {
      this.focusedPaneId = visible[0].id;
      this.focusedPane = (this.focusedPaneId === 'pane-1' ? 'left' : this.focusedPaneId === 'pane-2' ? 'right' : this.focusedPaneId) as PaneId;
    }
  }

  public getVisiblePanes(): PaneInfo[] {
    if (this.layoutMode === 'single') {
      return [{ id: 'pane-1', platform: this.activePlatform }];
    }
    if (this.layoutMode === 'split') {
      return this.panes.slice(0, 2);
    }
    if (this.layoutMode === 'triple') {
      return this.panes.slice(0, 3);
    }
    if (this.layoutMode === 'quad') {
      return this.panes.slice(0, 4);
    }
    return this.panes.slice(0, 2);
  }

  public getEffectivePlatform(): PlatformId {
    if (this.layoutMode === 'single') {
      return this.activePlatform;
    }
    const visible = this.getVisiblePanes();
    let target = visible.find((p) => p.id === this.focusedPaneId);
    if (!target && this.focusedPaneId === 'left') target = visible[0];
    if (!target && this.focusedPaneId === 'right') target = visible[1];
    return target ? target.platform : (visible[0]?.platform || this.activePlatform);
  }

  private initViews(): void {
    const platforms = Object.keys(PLATFORM_CONFIGS) as PlatformId[];

    for (const p of platforms) {
      const config = PLATFORM_CONFIGS[p];
      const ses = this.sessionManager.getSession(p);

      const view = new WebContentsView({
        webPreferences: {
          session: ses,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          webSecurity: true,
          allowRunningInsecureContent: false,
        },
      });

      // Hook navigation and safety events
      this.setupViewEvents(p, view);

      // Load home URL
      view.webContents.loadURL(config.homeUrl).catch((err) => {
        console.warn(`[PlatformManager] Initial load failed for ${p}:`, err.message);
      });

      this.platformViews.set(p, view);
    }
  }

  private setupWindowListeners(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    this.mainWindow.on('blur', () => {
      const settings = this.storageManager.getSettings();
      if (settings.muteOnBackground) {
        const activeView = this.platformViews.get(this.activePlatform);
        if (activeView) {
          activeView.webContents.setAudioMuted(true);
        }
      }
    });

    this.mainWindow.on('focus', () => {
      if (this.viewMode === 'platform') {
        const activeView = this.platformViews.get(this.activePlatform);
        if (activeView) {
          activeView.webContents.setAudioMuted(false);
        }
      }
    });

    this.mainWindow.on('leave-full-screen', () => {
      if (this.isFullscreen) {
        this.handleLeaveFullScreen();
      }
    });
  }

  private setupViewEvents(platform: PlatformId, view: WebContentsView): void {
    const wc = view.webContents;
    wc.setMaxListeners(30);

    // Handle new-window / popup safely
    wc.setWindowOpenHandler((details) => {
      const url = details.url;
      try {
        // 1. Check if the URL is allowed for the current platform
        if (isUrlAllowedForPlatform(url, platform)) {
          wc.loadURL(url);
          return { action: 'deny' };
        }

        // 2. Check if the URL belongs to another integrated platform
        const targetPlatform = getPlatformForUrl(url);
        if (targetPlatform && targetPlatform !== platform) {
          this.switchPlatform(targetPlatform);
          this.navigate(url);
          return { action: 'deny' };
        }

        // 3. Otherwise open safely in external system browser
        shell.openExternal(url);
        return { action: 'deny' };
      } catch {
        return { action: 'deny' };
      }
    });

    // Handle in-page top-level navigation safely
    wc.on('will-navigate', (event, url) => {
      try {
        // 1. Check if the URL is allowed for the current platform
        if (isUrlAllowedForPlatform(url, platform)) {
          return;
        }

        // 2. Check if the URL belongs to another integrated platform
        const targetPlatform = getPlatformForUrl(url);
        if (targetPlatform && targetPlatform !== platform) {
          event.preventDefault();
          this.switchPlatform(targetPlatform);
          this.navigate(url);
          return;
        }

        // 3. Otherwise intercept external navigation and open in system browser
        event.preventDefault();
        shell.openExternal(url);
      } catch {
        event.preventDefault();
      }
    });

    // Navigation state listeners
    wc.on('did-start-loading', () => {
      this.navErrors.delete(platform);
      if (this.activePlatform === platform) {
        this.emitNavState();
      }
    });

    wc.on('did-stop-loading', () => {
      if (this.activePlatform === platform) {
        this.emitNavState();
        // Record visit history only for active platform viewed by user
        const title = wc.getTitle();
        const url = wc.getURL();
        if (url && !url.startsWith('about:') && !url.startsWith('chrome:')) {
          this.storageManager.addHistory(platform, title || url, url);
        }
      }
    });

    wc.on('page-title-updated', () => {
      if (this.activePlatform === platform) {
        this.emitNavState();
      }
    });

    wc.on('did-navigate', () => {
      this.navErrors.delete(platform);
      if (this.activePlatform === platform) {
        this.emitNavState();
      }
    });

    wc.on('did-navigate-in-page', () => {
      if (this.activePlatform === platform) {
        this.emitNavState();
      }
    });

    wc.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (errorCode === -3) {
        // ABORTED - usually normal redirect or user navigation
        return;
      }
      console.warn(`[${platform}] Page load failed: ${errorCode} ${errorDescription} on ${validatedURL}`);
      this.navErrors.set(platform, { errorCode, errorDescription });
      if (this.activePlatform === platform) {
        this.emitNavState();
      }
    });

    // Responsive adaptation for platforms (especially Bilibili in split screen)
    if (platform === 'bilibili') {
      const injectBiliStyles = () => {
        if (typeof (wc as any).insertCSS === 'function') {
          (wc as any).insertCSS(`
            /* TriVideo split-screen adaptive styles for Bilibili */
            html, body {
              min-width: 0 !important;
              max-width: 100% !important;
              overflow-x: auto !important;
            }
            #i_cecream, #app, .bili-layout, .bili-feed4, #biliMainHeader, .bili-header, .video-container-v1, .bpx-player-container {
              max-width: 100% !important;
              min-width: 0 !important;
              box-sizing: border-box !important;
            }
            .bili-header, .bili-header__bar, .bili-header__channel {
              max-width: 100% !important;
              min-width: 0 !important;
            }
            .video-container-v1 {
              display: flex !important;
              flex-wrap: wrap !important;
              justify-content: center !important;
              max-width: 100% !important;
              min-width: 0 !important;
            }
            .video-container-v1 .left-container {
              min-width: 0 !important;
              flex: 1 1 600px !important;
            }
            .video-container-v1 .right-container {
              min-width: 0 !important;
              flex: 0 0 350px !important;
            }
          `).catch(() => {});
        }
        const b = this.getPlatformBounds(platform);
        this.applyAdaptiveZoom('bilibili', b.width);
      };

      wc.on('dom-ready', injectBiliStyles);
      wc.on('did-finish-load', injectBiliStyles);
      wc.on('did-navigate', injectBiliStyles);
      wc.on('did-navigate-in-page', injectBiliStyles);
    }

    wc.on('enter-html-full-screen', () => {
      this.handleEnterFullScreen(platform);
    });

    wc.on('leave-html-full-screen', () => {
      this.handleLeaveFullScreen(platform);
    });
  }

  public setNavChangeCallback(cb: (state: NavigationState) => void): void {
    this.onNavChangeCallback = cb;
  }

  private emitNavState(): void {
    if (!this.onNavChangeCallback) return;
    const effective = this.getEffectivePlatform();
    const view = this.platformViews.get(effective);
    if (!view) return;

    const wc = view.webContents;
    const err = this.navErrors.get(effective);
    const state: NavigationState = {
      canGoBack: wc.navigationHistory ? wc.navigationHistory.canGoBack() : wc.canGoBack(),
      canGoForward: wc.navigationHistory ? wc.navigationHistory.canGoForward() : wc.canGoForward(),
      isLoading: wc.isLoading(),
      currentUrl: wc.getURL() || PLATFORM_CONFIGS[effective].homeUrl,
      title: wc.getTitle() || PLATFORM_CONFIGS[effective].name,
      hasError: Boolean(err),
      errorCode: err?.errorCode,
      errorDescription: err?.errorDescription,
    };

    this.onNavChangeCallback(state);
  }

  public getNavigationState(): NavigationState {
    const effective = this.getEffectivePlatform();
    const view = this.platformViews.get(effective);
    if (!view) {
      return {
        canGoBack: false,
        canGoForward: false,
        isLoading: false,
        currentUrl: '',
        title: '',
      };
    }
    const wc = view.webContents;
    const err = this.navErrors.get(effective);
    return {
      canGoBack: wc.navigationHistory ? wc.navigationHistory.canGoBack() : wc.canGoBack(),
      canGoForward: wc.navigationHistory ? wc.navigationHistory.canGoForward() : wc.canGoForward(),
      isLoading: wc.isLoading(),
      currentUrl: wc.getURL() || PLATFORM_CONFIGS[effective].homeUrl,
      title: wc.getTitle() || PLATFORM_CONFIGS[effective].name,
      hasError: Boolean(err),
      errorCode: err?.errorCode,
      errorDescription: err?.errorDescription,
    };
  }

  public updateEnabledPlatforms(enabledIds: PlatformId[]): void {
    if (!Array.isArray(enabledIds) || enabledIds.length === 0) return;
    this.enabledPlatformIds = [...enabledIds];

    // Check layout downgrade if not enough enabled platforms
    if (this.layoutMode === 'quad' && this.enabledPlatformIds.length < 4) {
      this.layoutMode = this.enabledPlatformIds.length >= 3 ? 'triple' : this.enabledPlatformIds.length >= 2 ? 'split' : 'single';
    } else if (this.layoutMode === 'triple' && this.enabledPlatformIds.length < 3) {
      this.layoutMode = this.enabledPlatformIds.length >= 2 ? 'split' : 'single';
    } else if (this.layoutMode === 'split' && this.enabledPlatformIds.length < 2) {
      this.layoutMode = 'single';
    }

    this.ensureValidPanes();

    if (this.layoutMode === 'single') {
      if (!this.enabledPlatformIds.includes(this.activePlatform)) {
        this.activePlatform = this.enabledPlatformIds[0];
        this.storageManager.updateSettings({ lastPlatform: this.activePlatform });
      }
    }

    this.saveSplitConfig();
    this.emitSplitConfig();
    this.updateViewPlacement();
    this.emitNavState();
  }

  public getEnabledPlatformIds(): PlatformId[] {
    return [...this.enabledPlatformIds];
  }

  // Multi-panel & Split-Screen Layout Controls
  public setLayoutMode(mode: LayoutMode): boolean {
    if (mode === 'split' && this.enabledPlatformIds.length < 2) return false;
    if (mode === 'triple' && this.enabledPlatformIds.length < 3) return false;
    if (mode === 'quad' && this.enabledPlatformIds.length < 4) return false;

    this.layoutMode = mode;
    this.ensureValidPanes();

    if (mode === 'single') {
      const effective = this.getEffectivePlatform();
      if (this.enabledPlatformIds.includes(effective)) {
        this.activePlatform = effective;
        this.storageManager.updateSettings({ lastPlatform: effective });
      }
    }

    this.saveSplitConfig();
    this.updateViewPlacement();
    this.emitNavState();
    this.emitSplitConfig();
    return true;
  }

  public getLayoutMode(): LayoutMode {
    return this.layoutMode;
  }

  public getSplitConfig(): SplitConfig {
    const visiblePanes = this.getVisiblePanes();
    return {
      mode: this.layoutMode,
      leftPlatform: this.panes[0]?.platform || 'bilibili',
      rightPlatform: this.panes[1]?.platform || 'youtube',
      focusedPane: (this.focusedPaneId === 'pane-1' ? 'left' : this.focusedPaneId === 'pane-2' ? 'right' : this.focusedPaneId) as PaneId,
      splitRatio: this.splitRatio,
      horizontalRatio: this.horizontalRatio,
      panes: visiblePanes,
      focusedPaneId: this.focusedPaneId,
    };
  }

  public setSplitPlatform(pane: PaneId, platform: PlatformId): boolean {
    let paneId = pane;
    if (pane === 'left') paneId = 'pane-1';
    else if (pane === 'right') paneId = 'pane-2';
    return this.setPanePlatform(paneId, platform);
  }

  public setPanePlatform(paneId: string, platform: PlatformId): boolean {
    if (!PLATFORM_CONFIGS[platform]) return false;
    if (!this.enabledPlatformIds.includes(platform)) return false;

    let resolvedId = paneId;
    if (paneId === 'left') resolvedId = 'pane-1';
    else if (paneId === 'right') resolvedId = 'pane-2';

    const visible = this.getVisiblePanes();
    const targetPane = this.panes.find((p) => p.id === resolvedId);
    if (!targetPane) return false;

    // Check if platform is already shown in another visible pane
    const duplicatePane = visible.find((p) => p.id !== resolvedId && p.platform === platform);
    if (duplicatePane) {
      // Shift focus to existing pane displaying this platform
      this.setFocusedPane(duplicatePane.id as PaneId);
      return true;
    }

    targetPane.platform = platform;
    if (resolvedId === 'pane-1') this.leftPlatform = platform;
    if (resolvedId === 'pane-2') this.rightPlatform = platform;

    this.focusedPaneId = resolvedId;
    this.focusedPane = (resolvedId === 'pane-1' ? 'left' : resolvedId === 'pane-2' ? 'right' : resolvedId) as PaneId;

    this.saveSplitConfig();
    this.updateViewPlacement();
    this.emitNavState();
    this.emitSplitConfig();
    return true;
  }

  public setFocusedPane(pane: PaneId): void {
    let resolvedId = pane;
    if (pane === 'left') resolvedId = 'pane-1';
    else if (pane === 'right') resolvedId = 'pane-2';

    if (this.focusedPaneId === resolvedId) return;
    this.focusedPaneId = resolvedId;
    this.focusedPane = (resolvedId === 'pane-1' ? 'left' : resolvedId === 'pane-2' ? 'right' : resolvedId) as PaneId;

    this.saveSplitConfig();
    this.updateViewPlacement();
    this.emitNavState();
    this.emitSplitConfig();
  }

  public setSplitBounds(bounds: SplitBounds): void {
    if (bounds.left) {
      this.leftBounds = bounds.left;
      this.paneBounds.set('pane-1', bounds.left);
      this.paneBounds.set('left', bounds.left);
    }
    if (bounds.right) {
      this.rightBounds = bounds.right;
      this.paneBounds.set('pane-2', bounds.right);
      this.paneBounds.set('right', bounds.right);
    }
    if (bounds.paneBounds) {
      for (const [id, b] of Object.entries(bounds.paneBounds)) {
        this.paneBounds.set(id, b);
      }
    }
    if (this.layoutMode !== 'single' && !this.isFullscreen) {
      this.updateViewPlacement();
    }
  }

  public setMultiPaneBounds(bounds: Record<string, ContentBounds>): void {
    for (const [id, b] of Object.entries(bounds)) {
      this.paneBounds.set(id, b);
    }
    if (bounds['pane-1']) {
      this.leftBounds = bounds['pane-1'];
      this.paneBounds.set('left', bounds['pane-1']);
    }
    if (bounds['pane-2']) {
      this.rightBounds = bounds['pane-2'];
      this.paneBounds.set('right', bounds['pane-2']);
    }
    if (this.layoutMode !== 'single' && !this.isFullscreen) {
      this.updateViewPlacement();
    }
  }

  public setSplitRatio(ratio: number): void {
    const clamped = Math.max(0.2, Math.min(0.8, ratio));
    this.splitRatio = clamped;
    this.saveSplitConfig();
    this.emitSplitConfig();
  }

  public setHorizontalRatio(ratio: number): void {
    const clamped = Math.max(0.2, Math.min(0.8, ratio));
    this.horizontalRatio = clamped;
    this.saveSplitConfig();
    this.emitSplitConfig();
  }

  public setSplitConfigChangeCallback(cb: (config: SplitConfig) => void): void {
    this.onSplitConfigChangeCallback = cb;
  }

  private emitSplitConfig(): void {
    if (this.onSplitConfigChangeCallback) {
      this.onSplitConfigChangeCallback(this.getSplitConfig());
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed() && typeof this.mainWindow.webContents?.send === 'function') {
      this.mainWindow.webContents.send('split:configChanged', this.getSplitConfig());
    }
  }

  private saveSplitConfig(): void {
    this.storageManager.updateSettings({
      splitConfig: this.getSplitConfig(),
    });
  }

  public switchPlatform(platform: PlatformId): boolean {
    if (!PLATFORM_CONFIGS[platform]) return false;
    if (!this.enabledPlatformIds.includes(platform)) return false;

    if (this.isFullscreen) {
      this.exitFullScreen();
    }

    if (this.layoutMode !== 'single') {
      const visible = this.getVisiblePanes();
      const existing = visible.find((p) => p.platform === platform);
      if (existing) {
        this.setFocusedPane(existing.id as PaneId);
        return true;
      }

      let target = this.panes.find((p) => p.id === this.focusedPaneId);
      if (!target && this.focusedPaneId === 'left') target = this.panes[0];
      if (!target && this.focusedPaneId === 'right') target = this.panes[1];
      if (!target) target = this.panes[0];

      target.platform = platform;
      if (target.id === 'pane-1') this.leftPlatform = platform;
      if (target.id === 'pane-2') this.rightPlatform = platform;

      this.saveSplitConfig();
      this.updateViewPlacement();
      this.emitNavState();
      this.emitSplitConfig();
      return true;
    }

    this.activePlatform = platform;
    this.storageManager.updateSettings({ lastPlatform: platform });
    this.updateViewPlacement();
    this.emitNavState();

    const view = this.platformViews.get(platform);
    if (view) {
      const url = view.webContents.getURL();
      const title = view.webContents.getTitle();
      if (url && !url.startsWith('about:') && !url.startsWith('chrome:')) {
        this.storageManager.addHistory(platform, title || url, url);
      }
    }

    return true;
  }

  public setViewMode(mode: ViewMode): void {
    if (this.isFullscreen && mode !== 'platform') {
      this.exitFullScreen();
    }
    this.viewMode = mode;
    this.updateViewPlacement();
  }

  public setContentBounds(bounds: ContentBounds): void {
    this.singleBounds = bounds;
    this.currentBounds = bounds;
    if (this.layoutMode === 'single' && !this.isFullscreen) {
      this.updateViewPlacement();
    }
  }

  public updateViewPlacement(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    const contentView = this.mainWindow.contentView;

    // 1. React modal is visible (Settings or Onboarding) -> hide all WebContentsViews
    if (!this.platformViewVisible) {
      for (const view of this.platformViews.values()) {
        if (contentView.children.includes(view)) {
          contentView.removeChildView(view);
        }
        if (typeof (view as any).setVisible === 'function') {
          (view as any).setVisible(false);
        }
        view.setBounds({ x: -10000, y: -10000, width: 0, height: 0 });
      }
      return;
    }

    // 2. Fullscreen mode
    if (this.isFullscreen && this.fullscreenPlatform) {
      const winBounds = this.mainWindow.getContentBounds();
      for (const [p, view] of this.platformViews.entries()) {
        if (p === this.fullscreenPlatform) {
          view.webContents.setAudioMuted(false);
          if (!contentView.children.includes(view)) {
            contentView.addChildView(view);
          }
          if (typeof (view as any).setVisible === 'function') {
            (view as any).setVisible(true);
          }
          view.setBounds({
            x: 0,
            y: 0,
            width: Math.max(0, winBounds.width),
            height: Math.max(0, winBounds.height),
          });
          this.applyAdaptiveZoom(p, winBounds.width);
        } else {
          view.webContents.setAudioMuted(true);
          if (contentView.children.includes(view)) {
            contentView.removeChildView(view);
          }
          if (typeof (view as any).setVisible === 'function') {
            (view as any).setVisible(false);
          }
          view.setBounds({ x: -10000, y: -10000, width: 0, height: 0 });
        }
      }
      return;
    }

    // 3. Non-platform view modes (Favorites, History)
    if (this.viewMode !== 'platform') {
      for (const view of this.platformViews.values()) {
        view.webContents.setAudioMuted(true);
        if (contentView.children.includes(view)) {
          contentView.removeChildView(view);
        }
        if (typeof (view as any).setVisible === 'function') {
          (view as any).setVisible(false);
        }
        view.setBounds({ x: -10000, y: -10000, width: 0, height: 0 });
      }
      return;
    }

    // 4. Single platform mode
    if (this.layoutMode === 'single') {
      for (const [p, view] of this.platformViews.entries()) {
        if (p === this.activePlatform) {
          view.webContents.setAudioMuted(false);
          if (!contentView.children.includes(view)) {
            contentView.addChildView(view);
          }
          if (typeof (view as any).setVisible === 'function') {
            (view as any).setVisible(true);
          }
          view.setBounds({
            x: Math.round(this.singleBounds.x),
            y: Math.round(this.singleBounds.y),
            width: Math.max(0, Math.round(this.singleBounds.width)),
            height: Math.max(0, Math.round(this.singleBounds.height)),
          });
          this.applyAdaptiveZoom(p, this.singleBounds.width);
        } else {
          view.webContents.setAudioMuted(true);
          view.webContents.executeJavaScript(
            'try { document.querySelectorAll("video, audio").forEach(el => el.pause()); } catch(e){}'
          ).catch(() => {});
          if (contentView.children.includes(view)) {
            contentView.removeChildView(view);
          }
          if (typeof (view as any).setVisible === 'function') {
            (view as any).setVisible(false);
          }
          view.setBounds({ x: -10000, y: -10000, width: 0, height: 0 });
        }
      }
      return;
    }

    // 5. Multi-panel mode (split, triple, quad)
    const visiblePanes = this.getVisiblePanes();
    const visiblePlatformSet = new Set(visiblePanes.map((p) => p.platform));
    const effectivePlatform = this.getEffectivePlatform();

    // Position and configure visible panes
    for (const pane of visiblePanes) {
      const view = this.platformViews.get(pane.platform);
      if (!view) continue;

      const isFocused = pane.platform === effectivePlatform;
      view.webContents.setAudioMuted(!isFocused);

      if (!contentView.children.includes(view)) {
        contentView.addChildView(view);
      }
      if (typeof (view as any).setVisible === 'function') {
        (view as any).setVisible(true);
      }

      let bounds = this.paneBounds.get(pane.id);
      if (!bounds) {
        if (pane.id === 'pane-1') bounds = this.leftBounds;
        else if (pane.id === 'pane-2') bounds = this.rightBounds;
        else bounds = { x: -10000, y: -10000, width: 0, height: 0 };
      }

      view.setBounds({
        x: Math.round(bounds.x),
        y: Math.round(bounds.y),
        width: Math.max(0, Math.round(bounds.width)),
        height: Math.max(0, Math.round(bounds.height)),
      });
      this.applyAdaptiveZoom(pane.platform, bounds.width);
    }

    // Detach and pause views not present in active layout
    for (const [p, view] of this.platformViews.entries()) {
      if (!visiblePlatformSet.has(p)) {
        view.webContents.setAudioMuted(true);
        view.webContents.executeJavaScript(
          'try { document.querySelectorAll("video, audio").forEach(el => el.pause()); } catch(e){}'
        ).catch(() => {});
        if (contentView.children.includes(view)) {
          contentView.removeChildView(view);
        }
        if (typeof (view as any).setVisible === 'function') {
          (view as any).setVisible(false);
        }
        view.setBounds({ x: -10000, y: -10000, width: 0, height: 0 });
      }
    }
  }

  public getPlatformBounds(platform: PlatformId): ContentBounds {
    if (this.isFullscreen) {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        const b = this.mainWindow.getContentBounds();
        return { x: 0, y: 0, width: b.width, height: b.height };
      }
      return this.singleBounds;
    }
    if (this.layoutMode === 'single') {
      return this.singleBounds;
    }
    const visiblePanes = this.getVisiblePanes();
    const pane = visiblePanes.find((p) => p.platform === platform);
    if (pane) {
      const b = this.paneBounds.get(pane.id);
      if (b && b.width > 0) return b;
      if (pane.id === 'pane-1') return this.leftBounds;
      if (pane.id === 'pane-2') return this.rightBounds;
      const totalW = this.singleBounds.width || 1200;
      const totalH = this.singleBounds.height || 762;
      const startX = this.singleBounds.x || 240;
      const startY = this.singleBounds.y || 138;
      if (this.layoutMode === 'triple') {
        if (pane.id === 'pane-3') {
          return {
            x: startX + Math.round(totalW * 0.6),
            y: startY + Math.round(totalH * 0.5),
            width: Math.round(totalW * 0.4),
            height: Math.round(totalH * 0.5),
          };
        }
      } else if (this.layoutMode === 'quad') {
        const halfW = Math.round(totalW * 0.5);
        const halfH = Math.round(totalH * 0.5);
        if (pane.id === 'pane-3') return { x: startX, y: startY + halfH, width: halfW, height: halfH };
        if (pane.id === 'pane-4') return { x: startX + halfW, y: startY + halfH, width: halfW, height: halfH };
      }
    }
    return this.singleBounds;
  }

  public static calculateAdaptiveZoomFactor(platform: PlatformId, width: number): number {
    if (platform === 'bilibili') {
      const BILI_BASE_WIDTH = 1160;
      if (width > 0 && width < BILI_BASE_WIDTH) {
        return Math.min(1.0, Math.max(0.25, Math.round((width / BILI_BASE_WIDTH) * 1000) / 1000));
      }
      return 1.0;
    }
    return 1.0;
  }

  public applyAdaptiveZoom(platform: PlatformId, width: number): void {
    const view = this.platformViews.get(platform);
    if (!view || !view.webContents) return;
    if (typeof (view.webContents as any).setZoomFactor !== 'function') return;

    const factor = PlatformManager.calculateAdaptiveZoomFactor(platform, width);
    try {
      (view.webContents as any).setZoomFactor(factor);
    } catch {}

    if (platform === 'bilibili') {
      try {
        view.webContents.executeJavaScript('try { window.dispatchEvent(new Event("resize")); } catch(e){}').catch(() => {});
      } catch {}
    }
  }

  public getPlatformZoomFactor(platform: PlatformId): number {
    const view = this.platformViews.get(platform);
    if (!view || !view.webContents || typeof (view.webContents as any).getZoomFactor !== 'function') {
      return 1.0;
    }
    try {
      return (view.webContents as any).getZoomFactor() || 1.0;
    } catch {
      return 1.0;
    }
  }

  // Visibility and Fullscreen Controls
  public setPlatformViewVisible(visible: boolean): void {
    if (this.platformViewVisible === visible) return;
    this.platformViewVisible = visible;
    this.updateViewPlacement();
  }

  public isPlatformViewVisible(): boolean {
    return this.platformViewVisible;
  }

  public getIsFullscreen(): boolean {
    return this.isFullscreen;
  }

  public getWasMaximizedBeforeFullscreen(): boolean {
    return this.wasMaximizedBeforeFullscreen;
  }

  public setFullscreenChangeCallback(cb: (isFullscreen: boolean) => void): void {
    this.onFullscreenChangeCallback = cb;
  }

  private emitFullscreenChange(isFullscreen: boolean): void {
    if (this.onFullscreenChangeCallback) {
      this.onFullscreenChangeCallback(isFullscreen);
    }
  }

  public handleEnterFullScreen(platform: PlatformId): void {
    const visible = this.getVisiblePanes();
    const isAllowed =
      this.layoutMode === 'single'
        ? platform === this.activePlatform
        : visible.some((p) => p.platform === platform);

    if (!isAllowed || this.viewMode !== 'platform') {
      return;
    }
    if (this.isFullscreen) return;

    this.wasMaximizedBeforeFullscreen = this.mainWindow.isMaximized();
    this.preFullscreenLayoutMode = this.layoutMode;
    this.fullscreenPlatform = platform;
    this.isFullscreen = true;

    if (!this.mainWindow.isFullScreen()) {
      this.mainWindow.setFullScreen(true);
    }

    this.updateViewPlacement();
    this.emitFullscreenChange(true);
  }

  public handleLeaveFullScreen(platform?: PlatformId): void {
    if (platform && this.fullscreenPlatform && platform !== this.fullscreenPlatform) {
      return;
    }
    if (!this.isFullscreen) return;

    this.isFullscreen = false;
    this.fullscreenPlatform = null;
    this.layoutMode = this.preFullscreenLayoutMode;

    if (this.mainWindow.isFullScreen()) {
      this.mainWindow.setFullScreen(false);
    }

    if (this.wasMaximizedBeforeFullscreen && !this.mainWindow.isMaximized()) {
      this.mainWindow.maximize();
    }

    this.updateViewPlacement();
    this.emitFullscreenChange(false);

    if (!this.mainWindow.isDestroyed() && typeof this.mainWindow.webContents?.send === 'function') {
      this.mainWindow.webContents.send('window:maximizeChanged', this.mainWindow.isMaximized());
    }
  }

  public exitFullScreen(): void {
    if (!this.isFullscreen) return;
    const target = this.fullscreenPlatform || this.getEffectivePlatform();
    const view = this.platformViews.get(target);
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.executeJavaScript(
        'if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); }'
      ).catch(() => {});
    }
    this.handleLeaveFullScreen();
  }

  public getActivePlatform(): PlatformId {
    return this.activePlatform;
  }

  public getPlatformConfigs(): PlatformConfig[] {
    return Object.values(PLATFORM_CONFIGS);
  }

  // Real metadata extraction for bookmarking
  public async extractActivePageMeta(): Promise<{
    title: string;
    url: string;
    coverUrl?: string;
    author?: string;
    duration?: string;
  }> {
    const view = this.platformViews.get(this.activePlatform);
    if (!view) {
      return {
        title: PLATFORM_CONFIGS[this.activePlatform].name,
        url: PLATFORM_CONFIGS[this.activePlatform].homeUrl,
      };
    }
    const wc = view.webContents;
    const currentUrl = wc.getURL() || PLATFORM_CONFIGS[this.activePlatform].homeUrl;
    const currentTitle = wc.getTitle() || PLATFORM_CONFIGS[this.activePlatform].name;

    try {
      const script = `
        (() => {
          let cover = '';
          const ogImg = document.querySelector('meta[property="og:image"]');
          if (ogImg && ogImg.content) cover = ogImg.content;
          if (!cover) {
            const twImg = document.querySelector('meta[name="twitter:image"]');
            if (twImg && twImg.content) cover = twImg.content;
          }
          if (!cover) {
            const poster = document.querySelector('video')?.getAttribute('poster');
            if (poster) cover = poster;
          }

          let author = '';
          const authorMeta = document.querySelector('meta[name="author"]') ||
                             document.querySelector('meta[property="article:author"]') ||
                             document.querySelector('link[itemprop="name"]');
          if (authorMeta && (authorMeta.content || authorMeta.getAttribute('content'))) {
            author = authorMeta.content || authorMeta.getAttribute('content');
          }
          if (!author) {
            const authorEl = document.querySelector('.up-name, .username, .author-name, [data-e2e="user-title"], .user-nickname, ytd-channel-name a, #channel-name a, .profile-user-name, .video-info-name, .kw-author');
            if (authorEl) author = authorEl.textContent?.trim();
          }

          let duration = '';
          const durEl = document.querySelector('.bpx-player-ctrl-time-duration, .xgplayer-time-duration, .ytp-time-duration, .kw-player-duration, .player-duration');
          if (durEl) duration = durEl.textContent?.trim();

          return { cover, author, duration };
        })()
      `;
      const result = await wc.executeJavaScript(script);
      return {
        title: currentTitle,
        url: currentUrl,
        coverUrl: result?.cover || undefined,
        author: result?.author || undefined,
        duration: result?.duration || undefined,
      };
    } catch {
      return {
        title: currentTitle,
        url: currentUrl,
      };
    }
  }

  public async captureActivePlatformView(): Promise<Buffer | null> {
    const view = this.platformViews.get(this.activePlatform);
    if (!view) return null;
    const img = await view.webContents.capturePage();
    return img.toPNG();
  }

  // Unified cross-platform batch search
  public async searchAllPlatforms(query: string): Promise<BatchSearchResult> {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return {
        query: '',
        totalPlatforms: 0,
        submittedPlatforms: [],
        failedPlatforms: [],
      };
    }
    const cleanQuery = trimmed.slice(0, 200);
    const encoded = encodeURIComponent(cleanQuery);

    const configs = Object.values(PLATFORM_CONFIGS).filter((c) =>
      this.enabledPlatformIds.includes(c.id)
    );
    const submitted: PlatformId[] = [];
    const failed: { platform: PlatformId; reason: string }[] = [];

    for (const config of configs) {
      const pid = config.id;
      const view = this.platformViews.get(pid);

      if (!view) {
        failed.push({ platform: pid, reason: '平台视图未初始化' });
        continue;
      }

      if (view.webContents.isDestroyed()) {
        failed.push({ platform: pid, reason: '平台视图已销毁' });
        continue;
      }

      if (!config.searchUrlTemplate || !config.searchUrlTemplate.includes('{query}')) {
        failed.push({ platform: pid, reason: '未配置有效搜索模板' });
        continue;
      }

      const searchUrl = config.searchUrlTemplate.replace('{query}', encoded);

      try {
        this.navErrors.delete(pid);
        // Directly navigate the platform view's webContents without modifying activePlatform
        view.webContents.loadURL(searchUrl).catch((err: any) => {
          if (err?.code !== 'ERR_ABORTED' && err?.errno !== -3) {
            console.warn(`[PlatformManager] Search load error for ${pid}:`, err?.message);
          }
        });
        submitted.push(pid);
      } catch (err: any) {
        console.warn(`[PlatformManager] Failed to dispatch search for ${pid}:`, err?.message);
        failed.push({ platform: pid, reason: err?.message || '发起导航失败' });
      }
    }

    // Update nav state for active view
    const activeView = this.platformViews.get(this.activePlatform);
    if (activeView && !activeView.webContents.isDestroyed()) {
      this.emitNavState();
    }

    return {
      query: cleanQuery,
      totalPlatforms: configs.length,
      submittedPlatforms: submitted,
      failedPlatforms: failed,
    };
  }

  // Navigation commands for active platform / focused pane
  public navigate(url: string): void {
    const target = this.getEffectivePlatform();
    const view = this.platformViews.get(target);
    if (view) {
      view.webContents.loadURL(url);
    }
  }

  public goBack(): void {
    const target = this.getEffectivePlatform();
    const view = this.platformViews.get(target);
    if (view && view.webContents.canGoBack()) {
      view.webContents.goBack();
    }
  }

  public goForward(): void {
    const target = this.getEffectivePlatform();
    const view = this.platformViews.get(target);
    if (view && view.webContents.canGoForward()) {
      view.webContents.goForward();
    }
  }

  public reload(): void {
    const target = this.getEffectivePlatform();
    const view = this.platformViews.get(target);
    if (view) {
      this.navErrors.delete(target);
      view.webContents.reload();
    }
  }

  public stopLoading(): void {
    const target = this.getEffectivePlatform();
    const view = this.platformViews.get(target);
    if (view) {
      view.webContents.stop();
    }
  }

  public openExternal(url?: string): void {
    const targetUrl = url || this.getNavigationState().currentUrl;
    if (targetUrl) {
      shell.openExternal(targetUrl);
    }
  }

  public destroy(): void {
    for (const view of this.platformViews.values()) {
      try {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.contentView.removeChildView(view);
        }
      } catch (e) {
        console.error('Error destroying view:', e);
      }
    }
    this.platformViews.clear();
  }
}
