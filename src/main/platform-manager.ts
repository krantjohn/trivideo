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

  constructor(
    mainWindow: BrowserWindow,
    sessionManager: SessionManager,
    storageManager: StorageManager
  ) {
    this.mainWindow = mainWindow;
    this.sessionManager = sessionManager;
    this.storageManager = storageManager;

    const savedSettings = this.storageManager.getSettings();
    if (savedSettings.lastPlatform && PLATFORM_CONFIGS[savedSettings.lastPlatform]) {
      this.activePlatform = savedSettings.lastPlatform;
    }

    this.initViews();
    this.setupWindowListeners();
    this.updateViewPlacement();
  }

  private initViews(): void {
    const platforms: PlatformId[] = ['bilibili', 'douyin', 'xiaohongshu'];

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
  }

  public setNavChangeCallback(cb: (state: NavigationState) => void): void {
    this.onNavChangeCallback = cb;
  }

  private emitNavState(): void {
    if (!this.onNavChangeCallback) return;
    const view = this.platformViews.get(this.activePlatform);
    if (!view) return;

    const wc = view.webContents;
    const err = this.navErrors.get(this.activePlatform);
    const state: NavigationState = {
      canGoBack: wc.navigationHistory ? wc.navigationHistory.canGoBack() : wc.canGoBack(),
      canGoForward: wc.navigationHistory ? wc.navigationHistory.canGoForward() : wc.canGoForward(),
      isLoading: wc.isLoading(),
      currentUrl: wc.getURL() || PLATFORM_CONFIGS[this.activePlatform].homeUrl,
      title: wc.getTitle() || PLATFORM_CONFIGS[this.activePlatform].name,
      hasError: Boolean(err),
      errorCode: err?.errorCode,
      errorDescription: err?.errorDescription,
    };

    this.onNavChangeCallback(state);
  }

  public getNavigationState(): NavigationState {
    const view = this.platformViews.get(this.activePlatform);
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
    const err = this.navErrors.get(this.activePlatform);
    return {
      canGoBack: wc.navigationHistory ? wc.navigationHistory.canGoBack() : wc.canGoBack(),
      canGoForward: wc.navigationHistory ? wc.navigationHistory.canGoForward() : wc.canGoForward(),
      isLoading: wc.isLoading(),
      currentUrl: wc.getURL() || PLATFORM_CONFIGS[this.activePlatform].homeUrl,
      title: wc.getTitle() || PLATFORM_CONFIGS[this.activePlatform].name,
      hasError: Boolean(err),
      errorCode: err?.errorCode,
      errorDescription: err?.errorDescription,
    };
  }

  public switchPlatform(platform: PlatformId): boolean {
    if (!PLATFORM_CONFIGS[platform]) return false;

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
    this.viewMode = mode;
    this.updateViewPlacement();
  }

  public setContentBounds(bounds: ContentBounds): void {
    this.currentBounds = bounds;
    this.updateViewPlacement();
  }

  public updateViewPlacement(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    const contentView = this.mainWindow.contentView;

    for (const [p, view] of this.platformViews.entries()) {
      const isCurrentActive = p === this.activePlatform && this.viewMode === 'platform';

      if (isCurrentActive) {
        // Ensure active view is attached and unmuted
        view.webContents.setAudioMuted(false);
        if (!contentView.children.includes(view)) {
          contentView.addChildView(view);
        }
        if (typeof (view as any).setVisible === 'function') {
          (view as any).setVisible(true);
        }
        view.setBounds({
          x: Math.round(this.currentBounds.x),
          y: Math.round(this.currentBounds.y),
          width: Math.max(0, Math.round(this.currentBounds.width)),
          height: Math.max(0, Math.round(this.currentBounds.height)),
        });
      } else {
        // Inactive views: mute audio, pause playback, remove from contentView
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
                             document.querySelector('meta[property="article:author"]');
          if (authorMeta && authorMeta.content) author = authorMeta.content;
          if (!author) {
            const authorEl = document.querySelector('.up-name, .username, .author-name, [data-e2e="user-title"], .user-nickname');
            if (authorEl) author = authorEl.textContent?.trim();
          }

          let duration = '';
          const durEl = document.querySelector('.bpx-player-ctrl-time-duration, .xgplayer-time-duration');
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

  // Navigation commands for active platform
  public navigate(url: string): void {
    const view = this.platformViews.get(this.activePlatform);
    if (view) {
      view.webContents.loadURL(url);
    }
  }

  public goBack(): void {
    const view = this.platformViews.get(this.activePlatform);
    if (view && view.webContents.canGoBack()) {
      view.webContents.goBack();
    }
  }

  public goForward(): void {
    const view = this.platformViews.get(this.activePlatform);
    if (view && view.webContents.canGoForward()) {
      view.webContents.goForward();
    }
  }

  public reload(): void {
    const view = this.platformViews.get(this.activePlatform);
    if (view) {
      this.navErrors.delete(this.activePlatform);
      view.webContents.reload();
    }
  }

  public stopLoading(): void {
    const view = this.platformViews.get(this.activePlatform);
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
