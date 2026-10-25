import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { CategoryBar } from './components/CategoryBar';
import { FavoritesView } from './components/FavoritesView';
import { HistoryView } from './components/HistoryView';
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
  BookmarkItem,
  HistoryItem,
  LayoutMode,
  PaneId,
  SplitConfig,
  ContentBounds,
} from '../types';

export const App: React.FC = () => {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [activePlatform, setActivePlatform] = useState<PlatformId>('bilibili');
  const [viewMode, setViewMode] = useState<ViewMode>('platform');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
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

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [loadedPlatforms, loadedSettings, loadedBookmarks, loadedHistory, initialStatuses] =
          await Promise.all([
            triVideoService.getPlatforms(),
            triVideoService.getSettings(),
            triVideoService.getBookmarks(),
            triVideoService.getHistory(),
            triVideoService.getSessionStatus(),
          ]);

        setPlatforms(loadedPlatforms);
        if (loadedSettings) {
          setSettings(loadedSettings);
          setTheme(loadedSettings.theme === 'light' ? 'light' : 'dark');
          setSidebarCollapsed(Boolean(loadedSettings.sidebarCollapsed));
          if (loadedSettings.platformSetupCompleted === false) {
            setIsWizardOpen(true);
          }
          if (loadedSettings.lastPlatform) {
            setActivePlatform(loadedSettings.lastPlatform);
          }
        }
        setBookmarks(loadedBookmarks);
        setHistory(loadedHistory);
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
    const unsubNav = triVideoService.onNavigationStateChange((state: NavigationState) => {
      setNavState(state);
      // Refresh history list
      triVideoService.getHistory().then(setHistory);
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
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    triVideoService.updateSettings({ theme: newTheme });
  };

  const handleToggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    triVideoService.updateSettings({ sidebarCollapsed: next });
    setTimeout(updateContentBounds, 100);
  };

  const handleCategorySelect = (url: string) => {
    setViewMode('platform');
    triVideoService.setViewMode('platform');
    triVideoService.navigate(url);
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

  const handleBookmarkCurrent = async () => {
    try {
      const state = await triVideoService.getNavigationState();
      const currentPlatformConfig = platforms.find((p) => p.id === activePlatform);
      const meta = await triVideoService.getPageMetadata?.().catch(() => null);

      const newBm = await triVideoService.addBookmark({
        platform: activePlatform,
        title: meta?.title || state.title || `${currentPlatformConfig?.name} 精彩内容`,
        url: state.currentUrl || currentPlatformConfig?.homeUrl || '',
        coverUrl: meta?.coverUrl,
        author: meta?.author,
        duration: meta?.duration,
        category: currentPlatformConfig?.name,
      });
      setBookmarks((prev) => [newBm, ...prev]);
      showToast('已成功添加到收藏夹！');
    } catch (err) {
      console.error(err);
      showToast('收藏失败');
    }
  };

  const enabledPlatformIds = settings.enabledPlatformIds && settings.enabledPlatformIds.length > 0
    ? settings.enabledPlatformIds
    : ['bilibili', 'douyin', 'xiaohongshu', 'youtube', 'kuaishou'];

  const visiblePlatforms = platforms.filter((p) => enabledPlatformIds.includes(p.id));

  const handlePlayBookmarkItem = (item: BookmarkItem) => {
    if (!enabledPlatformIds.includes(item.platform)) {
      const cfg = platforms.find((p) => p.id === item.platform);
      const name = cfg ? cfg.name : item.platform;
      showToast(`平台「${name}」当前已禁用，请在设置中重新启用后再访问`);
      return;
    }
    setActivePlatform(item.platform);
    setViewMode('platform');
    triVideoService.switchPlatform(item.platform);
    triVideoService.setViewMode('platform');
    triVideoService.navigate(item.url);
  };

  const handleRemoveBookmark = async (id: string) => {
    await triVideoService.removeBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    showToast('已从收藏夹移除');
  };

  const handlePlayHistoryItem = (item: HistoryItem) => {
    if (!enabledPlatformIds.includes(item.platform)) {
      const cfg = platforms.find((p) => p.id === item.platform);
      const name = cfg ? cfg.name : item.platform;
      showToast(`平台「${name}」当前已禁用，请在设置中重新启用后再访问`);
      return;
    }
    setActivePlatform(item.platform);
    setViewMode('platform');
    triVideoService.switchPlatform(item.platform);
    triVideoService.setViewMode('platform');
    triVideoService.navigate(item.url);
  };

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
    if (updated.theme) setTheme(updated.theme === 'light' ? 'light' : 'dark');
    triVideoService.updateSettings(updated);
  };

  const handleRemoveHistoryItem = async (id: string) => {
    await triVideoService.removeHistoryItem(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearHistory = async () => {
    await triVideoService.clearHistory();
    setHistory([]);
    showToast('历史记录已全部清空');
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

  return (
    <div className="app-container">
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
        bookmarkCount={bookmarks.length}
        historyCount={history.length}
        sessionStatuses={sessionStatuses}
      />

      {/* Main Content Column */}
      <div className="main-column">
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
          onBookmarkCurrent={handleBookmarkCurrent}
          onOpenExternal={() => triVideoService.openExternal(navState.currentUrl)}
          onSearch={handleSearch}
          sessionStatuses={sessionStatuses}
          isMaximized={isMaximized}
          onMinimize={() => triVideoService.minimizeWindow()}
          onMaximize={() => triVideoService.maximizeWindow()}
          onClose={() => triVideoService.closeWindow()}
          layoutMode={layoutMode}
          onToggleLayoutMode={handleToggleLayoutMode}
        />

        {/* Category & Channel Bar (only in single platform mode) */}
        {currentPlatformConfig && layoutMode === 'single' && (
          <CategoryBar
            currentPlatform={currentPlatformConfig}
            onSelectCategory={handleCategorySelect}
            viewMode={viewMode}
            onSelectViewMode={handleSelectViewMode}
            bookmarkCount={bookmarks.length}
            historyCount={history.length}
            currentUrl={navState.currentUrl}
          />
        )}

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

          {viewMode === 'favorites' && (
            <FavoritesView
              bookmarks={bookmarks}
              onPlayItem={handlePlayBookmarkItem}
              onRemoveBookmark={handleRemoveBookmark}
            />
          )}

          {viewMode === 'history' && (
            <HistoryView
              history={history}
              onPlayHistoryItem={handlePlayHistoryItem}
              onRemoveHistoryItem={handleRemoveHistoryItem}
              onClearHistory={handleClearHistory}
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

      {/* First-launch Setup Wizard */}
      <OnboardingModal
        isOpen={isWizardOpen}
        platforms={platforms}
        onComplete={handleCompleteWizard}
      />
    </div>
  );
};
