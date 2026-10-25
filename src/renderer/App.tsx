import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { CategoryBar } from './components/CategoryBar';
import { FavoritesView } from './components/FavoritesView';
import { HistoryView } from './components/HistoryView';
import { SettingsModal } from './components/SettingsModal';
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
  });

  const [isMaximized, setIsMaximized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

    return () => {
      unsubNav();
      unsubMax();
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

  // Sync content bounds to WebContentsView whenever layout or viewport size changes
  const updateContentBounds = useCallback(() => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    triVideoService.setContentBounds({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }, []);

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
  const handleSelectPlatform = async (p: PlatformId) => {
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

  const handleSearch = (query: string) => {
    const config = platforms.find((p) => p.id === activePlatform);
    if (!config) return;

    setViewMode('platform');
    triVideoService.setViewMode('platform');

    const searchUrl = config.searchUrlTemplate.replace('{query}', encodeURIComponent(query));
    triVideoService.navigate(searchUrl);
    showToast(`正在在${config.name}搜索：「${query}」`);
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

  const handlePlayBookmarkItem = (item: BookmarkItem) => {
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
    setActivePlatform(item.platform);
    setViewMode('platform');
    triVideoService.switchPlatform(item.platform);
    triVideoService.setViewMode('platform');
    triVideoService.navigate(item.url);
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
        platforms={platforms}
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
          platforms={platforms}
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
        />

        {/* Category & Channel Bar */}
        {currentPlatformConfig && (
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
        onUpdateSettings={(updated) => {
          setSettings((prev) => ({ ...prev, ...updated }));
          if (updated.theme) setTheme(updated.theme === 'light' ? 'light' : 'dark');
          triVideoService.updateSettings(updated);
        }}
        sessionStatuses={sessionStatuses}
        onClearSession={handleClearSession}
        onClearAllCache={handleClearAllCache}
      />
    </div>
  );
};
