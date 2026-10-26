import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, RefreshCw, X, ArrowUpCircle } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SplitView } from './components/SplitView';
import { triVideoService } from './services/api';
import {
  PlatformId,
  PlatformConfig,
  ViewMode,
  NavigationState,
  PlatformSessionStatus,
  AppSettings,
  LayoutMode,
  PaneId,
  SplitConfig,
  ContentBounds,
  ThemeId,
  UpdateInfo,
} from '../types';
import { resolveWallpaperUrl } from './assets/CatAssets';

export const App: React.FC = () => {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [activePlatform, setActivePlatform] = useState<PlatformId>('bilibili');
  const [viewMode, setViewMode] = useState<ViewMode>('platform');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeId>('dark');
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    lastPlatform: 'bilibili',
    sidebarCollapsed: false,
    hardwareAcceleration: true,
    clearCacheOnExit: false,
    userAgentType: 'chrome',
  });

  const [navState, setNavState] = useState<NavigationState>({
    canGoBack: false,
    canGoForward: false,
    isLoading: false,
    currentUrl: 'https://www.bilibili.com/',
    title: '哔哩哔哩',
  });

  const [sessionStatuses, setSessionStatuses] = useState<Record<PlatformId, PlatformSessionStatus>>({
    bilibili: { platform: 'bilibili', isLoggedIn: false, cookieCount: 0, lastChecked: Date.now() },
    douyin: { platform: 'douyin', isLoggedIn: false, cookieCount: 0, lastChecked: Date.now() },
    xiaohongshu: { platform: 'xiaohongshu', isLoggedIn: false, cookieCount: 0, lastChecked: Date.now() },
    youtube: { platform: 'youtube', isLoggedIn: false, cookieCount: 0, lastChecked: Date.now() },
    kuaishou: { platform: 'kuaishou', isLoggedIn: false, cookieCount: 0, lastChecked: Date.now() },
  });

  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [autoUpdateInfo, setAutoUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdatePromptOpen, setIsUpdatePromptOpen] = useState(false);
  const [isAutoDownloading, setIsAutoDownloading] = useState(false);
  const [autoDownloadProgress, setAutoDownloadProgress] = useState<{ percent: number; transferred: number; total: number } | null>(null);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');
  const [splitConfig, setSplitConfig] = useState<SplitConfig>({
    mode: 'single',
    leftPlatform: 'bilibili',
    rightPlatform: 'youtube',
    focusedPane: 'left',
    splitRatio: 0.5,
  });

  const viewportRef = useRef<HTMLDivElement>(null);

  // Sync theme to root html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync custom background and frosted glass attributes to root html element
  useEffect(() => {
    const activeBgUrl = resolveWallpaperUrl(settings.customBgImage);
    if (settings.customBgEnabled && activeBgUrl) {
      document.documentElement.setAttribute('data-custom-bg', 'true');
      document.documentElement.style.setProperty('--custom-bg-blur', `${settings.customBgBlur ?? 16}px`);
      document.documentElement.style.setProperty('--custom-bg-opacity', `${settings.customBgOpacity ?? 0.65}`);
    } else {
      document.documentElement.removeAttribute('data-custom-bg');
      document.documentElement.style.removeProperty('--custom-bg-blur');
      document.documentElement.style.removeProperty('--custom-bg-opacity');
    }
  }, [settings.customBgEnabled, settings.customBgImage, settings.customBgBlur, settings.customBgOpacity]);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [loadedPlatforms, loadedSettings, initialStatuses] =
          await Promise.all([
            triVideoService.getPlatforms(),
            triVideoService.getSettings(),
            triVideoService.getSessionStatus(),
          ]);

        setPlatforms(loadedPlatforms);
        if (loadedSettings) {
          setSettings(loadedSettings);
          if (loadedSettings.theme) {
            setTheme(loadedSettings.theme);
          }
          setSidebarCollapsed(Boolean(loadedSettings.sidebarCollapsed));
          if (loadedSettings.platformSetupCompleted === false) {
            setIsWizardOpen(true);
          }
          if (loadedSettings.lastPlatform) {
            setActivePlatform(loadedSettings.lastPlatform);
          }
        }
        if (initialStatuses) {
          setSessionStatuses((prev) => ({ ...prev, ...initialStatuses }));
        }

        const max = await triVideoService.isMaximized();
        setIsMaximized(max);

        const loadedSplit = await triVideoService.getSplitConfig();
        if (loadedSplit) {
          setSplitConfig(loadedSplit);
          setLayoutMode(loadedSplit.mode);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  // Listeners for window events & navigation state
  useEffect(() => {
    const unsubTheme = triVideoService.onThemeChange((newTheme: ThemeId) => {
      setTheme(newTheme);
    });

    const unsubNav = triVideoService.onNavigationStateChange((state: NavigationState) => {
      setNavState(state);
    });

    const unsubMax = triVideoService.onMaximizeChange((max: boolean) => {
      setIsMaximized(max);
    });

    const unsubFs = triVideoService.onFullscreenChange((fs: boolean) => {
      setIsFullscreen(fs);
    });

    const unsubSplit = triVideoService.onSplitConfigChange((cfg) => {
      setSplitConfig(cfg);
      setLayoutMode(cfg.mode);
    });

    return () => {
      unsubTheme();
      unsubNav();
      unsubMax();
      unsubFs();
      unsubSplit();
    };
  }, []);

  // Polling session status every 15s to check login changes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const statuses = await triVideoService.getSessionStatus();
        if (statuses) {
          setSessionStatuses((prev) => ({ ...prev, ...statuses }));
        }
      } catch (e) {
        // ignore
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Manage WebContentsView visibility when settings modal or wizard toggles
  useEffect(() => {
    triVideoService.setPlatformViewVisible(!isSettingsOpen && !isWizardOpen);
  }, [isSettingsOpen, isWizardOpen]);

  // Handle Escape key at app level when in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triVideoService.exitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Sync content bounds to WebContentsView whenever layout or viewport size changes
  const updateContentBounds = useCallback(() => {
    if (isFullscreen) return;
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    triVideoService.setContentBounds({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }, [isFullscreen]);

  useEffect(() => {
    updateContentBounds();
    const handleResize = () => updateContentBounds();
    window.addEventListener('resize', handleResize);

    const ro = new ResizeObserver(() => {
      updateContentBounds();
    });
    if (viewportRef.current) {
      ro.observe(viewportRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, [updateContentBounds, sidebarCollapsed, viewMode]);

  
  // Auto check for updates on startup (bypassing caches)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const info = await triVideoService.checkForUpdates();
        if (info && info.hasUpdate) {
          setAutoUpdateInfo(info);
          setIsUpdatePromptOpen(true);
        }
      } catch (err) {
        console.warn('[AutoUpdateCheck] Error checking update:', err);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleTriggerAutoUpdate = async () => {
    if (!autoUpdateInfo) return;
    setIsAutoDownloading(true);
    setAutoDownloadProgress({ percent: 0, transferred: 0, total: 0 });

    const unsubscribe = triVideoService.onUpdateProgress((progress) => {
      setAutoDownloadProgress(progress);
    });

    try {
      const res = await triVideoService.downloadAndInstallUpdate(autoUpdateInfo.downloadUrl || undefined);
      unsubscribe();
      if (!res.success) {
        setIsAutoDownloading(false);
        showToast(res.message);
      }
    } catch (err: any) {
      unsubscribe();
      setIsAutoDownloading(false);
      showToast(err?.message || '下载更新失败');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Actions
  const handleToggleLayoutMode = async (mode: LayoutMode) => {
    if (mode === 'split' && visiblePlatforms.length < 2) {
      showToast('开启双屏至少需要启用两个平台，请在设置中启用更多平台');
      return;
    }
    if (mode === 'triple' && visiblePlatforms.length < 3) {
      showToast('开启三屏至少需要启用三个平台，请在设置中启用更多平台');
      return;
    }
    if (mode === 'quad' && visiblePlatforms.length < 4) {
      showToast('开启四屏至少需要启用四个平台，请在设置中启用更多平台');
      return;
    }
    setLayoutMode(mode);
    await triVideoService.setLayoutMode(mode);
    const cfg = await triVideoService.getSplitConfig();
    if (cfg) setSplitConfig(cfg);
    setTimeout(updateContentBounds, 50);
  };

  const handleSplitSelectPlatform = async (pane: PaneId, platform: PlatformId) => {
    const success = await triVideoService.setSplitPlatform(pane, platform);
    if (success) {
      const cfg = await triVideoService.getSplitConfig();
      if (cfg) setSplitConfig(cfg);
      setTimeout(updateContentBounds, 50);
    } else {
      showToast('该平台已在其他面板展示或不可用');
    }
  };

  const handleSetFocusPane = async (pane: PaneId) => {
    setSplitConfig((prev) => ({
      ...prev,
      focusedPane: pane,
      focusedPaneId: pane,
    }));
    await triVideoService.setFocusedPane(pane);
  };

  const handleSplitRatioChange = (ratio: number) => {
    setSplitConfig((prev) => ({ ...prev, splitRatio: ratio }));
  };

  const handleHorizontalRatioChange = (ratio: number) => {
    setSplitConfig((prev) => ({ ...prev, horizontalRatio: ratio }));
  };

  const handleSplitBoundsChange = useCallback(
    (bounds: { left: ContentBounds; right: ContentBounds }) => {
      if (isFullscreen) return;
      triVideoService.setSplitBounds(bounds);
    },
    [isFullscreen]
  );

  const handleMultiBoundsChange = useCallback(
    (bounds: Record<string, ContentBounds>) => {
      if (isFullscreen) return;
      triVideoService.setMultiPaneBounds(bounds);
    },
    [isFullscreen]
  );

  const handleReloadPane = () => {
    triVideoService.reload();
  };

  const handleGoHomePane = (pane: PaneId) => {
    const targetPane = splitConfig.panes?.find((p) => p.id === pane);
    let targetPlatform = targetPane?.platform;
    if (!targetPlatform) {
      targetPlatform = pane === 'left' ? splitConfig.leftPlatform : splitConfig.rightPlatform;
    }
    const cfg = platforms.find((p) => p.id === targetPlatform);
    if (cfg) {
      triVideoService.navigate(cfg.homeUrl);
    }
  };

  const handleSelectPlatform = async (p: PlatformId) => {
    if (layoutMode !== 'single') {
      const visible = splitConfig.panes || [
        { id: 'pane-1', platform: splitConfig.leftPlatform },
        { id: 'pane-2', platform: splitConfig.rightPlatform },
      ];
      const existing = visible.find((item) => item.platform === p);
      if (existing) {
        handleSetFocusPane(existing.id as PaneId);
        showToast(`已将焦点切换至「${platforms.find((item) => item.id === p)?.name}」`);
        return;
      }
      // Replace platform on currently focused pane
      const currentPaneId = splitConfig.focusedPaneId || splitConfig.focusedPane || 'pane-1';
      await handleSplitSelectPlatform(currentPaneId as PaneId, p);
      return;
    }

    setActivePlatform(p);
    setViewMode('platform');
    await triVideoService.switchPlatform(p);
    await triVideoService.setViewMode('platform');
    setTimeout(updateContentBounds, 50);
  };

  const handleSelectViewMode = async (mode: ViewMode) => {
    setViewMode(mode);
    await triVideoService.setViewMode(mode);
    setTimeout(updateContentBounds, 50);
  };

  const handleToggleTheme = () => {
    const themeCycle: ThemeId[] = ['adventure', 'dark', 'light', 'sakura'];
    const currentIndex = themeCycle.indexOf(theme);
    const nextTheme = currentIndex !== -1 ? themeCycle[(currentIndex + 1) % themeCycle.length] : 'dark';
    setTheme(nextTheme);
    triVideoService.updateSettings({ theme: nextTheme });
  };

  const handleToggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    triVideoService.updateSettings({ sidebarCollapsed: next });
    setTimeout(updateContentBounds, 100);
  };

  const handleSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (viewMode !== 'platform') {
      setViewMode('platform');
      await triVideoService.setViewMode('platform');
    }

    try {
      const result = await triVideoService.searchAll(trimmed);
      if (result && result.submittedPlatforms.length > 0) {
        if (result.failedPlatforms.length === 0) {
          showToast(`已向 ${result.submittedPlatforms.length} 个平台提交搜索：「${result.query}」`);
        } else {
          showToast(`已向 ${result.submittedPlatforms.length} 个平台提交搜索，${result.failedPlatforms.length} 个平台异常`);
        }
      } else {
        showToast('搜索提交未完成，请检查关键词或网络');
      }
    } catch (err) {
      console.error('Failed to execute batch search:', err);
      showToast('搜索提交失败，请重试');
    }
  };

  const enabledPlatformIds = settings.enabledPlatformIds && settings.enabledPlatformIds.length > 0
    ? settings.enabledPlatformIds
    : ['bilibili', 'douyin', 'xiaohongshu', 'youtube', 'kuaishou'];

  const visiblePlatforms = platforms.filter((p) => enabledPlatformIds.includes(p.id));

  const handleCompleteWizard = async (selectedPlatformIds: PlatformId[]) => {
    const nextLast = selectedPlatformIds.includes(activePlatform)
      ? activePlatform
      : selectedPlatformIds[0];
    const updated: Partial<AppSettings> = {
      platformSetupCompleted: true,
      enabledPlatformIds: selectedPlatformIds,
      lastPlatform: nextLast,
    };
    setSettings((prev) => ({ ...prev, ...updated }));
    setActivePlatform(nextLast);
    setIsWizardOpen(false);
    await triVideoService.updateSettings(updated);
    await triVideoService.switchPlatform(nextLast);
    setTimeout(updateContentBounds, 50);
    showToast(`设置完成！已启用 ${selectedPlatformIds.length} 个视频平台`);
  };

  const handleUpdateSettings = (updated: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      if (updated.enabledPlatformIds && updated.enabledPlatformIds.length > 0) {
        if (!updated.enabledPlatformIds.includes(activePlatform)) {
          handleSelectPlatform(updated.enabledPlatformIds[0]);
        }
      }
      return next;
    });
    if (updated.theme) setTheme(updated.theme);
    triVideoService.updateSettings(updated);
  };

  const handleClearSession = async (platform: PlatformId) => {
    await triVideoService.clearPlatformSession(platform);
    const updated = await triVideoService.getSessionStatus();
    setSessionStatuses((prev) => ({ ...prev, ...updated }));
  };

  const handleClearAllCache = async () => {
    try {
      await triVideoService.clearAllCache();
      showToast('网页临时缓存已清空');
    } catch {
      showToast('清理缓存遇到问题');
    }
  };

  const currentPlatformConfig = platforms.find((p) => p.id === activePlatform) || platforms[0];
  const activeBgUrl = resolveWallpaperUrl(settings.customBgImage);

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* Custom Background & Frosted Acrylic Layer */}
      {settings.customBgEnabled && activeBgUrl && (
        <div
          className="app-custom-bg-root"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: `url("${activeBgUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          {/* Tint overlay preserving text contrast while frosted chrome blurs over it */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--bg-primary)',
              opacity: settings.customBgOpacity ?? 0.65,
            }}
          />
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        platforms={visiblePlatforms}
        activePlatform={activePlatform}
        onSelectPlatform={handleSelectPlatform}
        viewMode={viewMode}
        onSelectViewMode={handleSelectViewMode}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        sessionStatuses={sessionStatuses}
      />

      {/* Main Content Column */}
      <div className="main-column" style={{ position: 'relative', zIndex: 1 }}>
        {/* Top Platform and Navigation Bar */}
        <TopNav
          platforms={visiblePlatforms}
          activePlatform={activePlatform}
          onSelectPlatform={handleSelectPlatform}
          navState={navState}
          onGoBack={() => triVideoService.goBack()}
          onGoForward={() => triVideoService.goForward()}
          onReload={() => triVideoService.reload()}
          onStop={() => triVideoService.stopLoading()}
          onGoHome={() => currentPlatformConfig && triVideoService.navigate(currentPlatformConfig.homeUrl)}
          onOpenExternal={() => triVideoService.openExternal(navState.currentUrl)}
          onSearch={handleSearch}
          sessionStatuses={sessionStatuses}
          isMaximized={isMaximized}
          onMinimize={() => triVideoService.minimizeWindow()}
          onMaximize={() => triVideoService.maximizeWindow()}
          onClose={() => triVideoService.closeWindow()}
          layoutMode={layoutMode}
          onToggleLayoutMode={handleToggleLayoutMode}
          theme={theme}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'absolute',
              top: '110px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 500,
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-normal)',
              zIndex: 90,
              pointerEvents: 'none',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {toastMessage}
          </div>
        )}

        {/* Content Viewport */}
        <div ref={viewportRef} className="content-viewport">
          {viewMode === 'platform' && layoutMode !== 'single' && (
            <SplitView
              layoutMode={layoutMode}
              splitConfig={splitConfig}
              leftPlatform={splitConfig.leftPlatform}
              rightPlatform={splitConfig.rightPlatform}
              focusedPane={splitConfig.focusedPane}
              splitRatio={splitConfig.splitRatio}
              horizontalRatio={splitConfig.horizontalRatio}
              platforms={visiblePlatforms}
              onSetFocus={handleSetFocusPane}
              onSelectPlatform={handleSplitSelectPlatform}
              onRatioChange={handleSplitRatioChange}
              onVerticalRatioChange={handleSplitRatioChange}
              onHorizontalRatioChange={handleHorizontalRatioChange}
              onBoundsChange={handleSplitBoundsChange}
              onMultiBoundsChange={handleMultiBoundsChange}
              onReloadPane={handleReloadPane}
              onGoHomePane={handleGoHomePane}
            />
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        sessionStatuses={sessionStatuses}
        onClearSession={handleClearSession}
        onClearAllCache={handleClearAllCache}
      />


      {/* Auto Update Prompt Dialog */}
      {isUpdatePromptOpen && autoUpdateInfo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => !isAutoDownloading && setIsUpdatePromptOpen(false)}
        >
          <div
            className="settings-modal-dialog"
            style={{
              width: '520px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px solid var(--border-normal)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                  }}
                >
                  <ArrowUpCircle size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      同画新版本发布
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--accent-primary)',
                        color: '#FFF',
                        fontWeight: 600,
                      }}
                    >
                      v{autoUpdateInfo.latestVersion}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    当前安装版本: v{autoUpdateInfo.currentVersion} · 检测到官方最新更新
                  </div>
                </div>
              </div>

              {!isAutoDownloading && (
                <button
                  onClick={() => setIsUpdatePromptOpen(false)}
                  style={{
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  className="hover-btn"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Release notes */}
            <div
              style={{
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                border: '1px solid var(--border-subtle)',
                maxHeight: '160px',
                overflowY: 'auto',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}
            >
              {autoUpdateInfo.releaseNotes}
            </div>

            {/* Download progress if downloading */}
            {isAutoDownloading && autoDownloadProgress && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>正在极速下载无损覆盖安装包...</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {autoDownloadProgress.percent}% ({((autoDownloadProgress.transferred || 0) / (1024 * 1024)).toFixed(1)}MB / {((autoDownloadProgress.total || 0) / (1024 * 1024)).toFixed(1)}MB)
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-input)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${autoDownloadProgress.percent}%`,
                      backgroundColor: 'var(--accent-primary)',
                      borderRadius: '4px',
                      transition: 'width 0.2s linear',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              {!isAutoDownloading && (
                <button
                  onClick={() => setIsUpdatePromptOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-normal)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  className="hover-btn"
                >
                  稍后提醒
                </button>
              )}
              <button
                disabled={isAutoDownloading}
                onClick={handleTriggerAutoUpdate}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#FFF',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isAutoDownloading ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
                className={theme === 'adventure' ? 'rpg-bevel-btn rpg-btn-green' : 'hover-btn'}
              >
                {isAutoDownloading ? (
                  <>
                    <RefreshCw size={15} className="spin-animation" />
                    <span>极速更新中 ({autoDownloadProgress?.percent || 0}%)...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>立即极速升级</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-launch Setup Wizard */}
      <OnboardingModal
        isOpen={isWizardOpen}
        platforms={platforms}
        onComplete={handleCompleteWizard}
      />
    </div>
  );
};
