import React from 'react';
import {
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Tv,
  Flame,
  Layers,
  Sparkles,
  Youtube,
  Video,
  Zap,
  Trees,
  Sunset,
} from 'lucide-react';
import { PlatformId, PlatformConfig, ViewMode, PlatformSessionStatus, ThemeId } from '../../types';
import { CatPawIcon, CatCompanionWidget } from '../assets/CatAssets';
import { WaxSealIcon, HangingBannerTab } from '../assets/AdventureAssets';

const THEME_INFO: Record<ThemeId, { name: string; icon: React.ReactNode }> = {
  adventure: { name: '羊皮纸冒险', icon: <WaxSealIcon size={18} /> },
  cat: { name: '猫咪治愈', icon: <CatPawIcon size={18} color="var(--accent-primary)" /> },
  cyberpunk: { name: '赛博霓虹', icon: <Zap size={18} color="var(--accent-primary)" /> },
  forest: { name: '森林抹茶', icon: <Trees size={18} color="var(--accent-primary)" /> },
  sunset: { name: '晚霞暮色', icon: <Sunset size={18} color="var(--accent-primary)" /> },
  nordic: { name: '北欧冷灰', icon: <Sparkles size={18} color="var(--accent-primary)" /> },
  sakura: { name: '樱花二次元', icon: <Sparkles size={18} color="var(--accent-primary)" /> },
  light: { name: '清新浅色', icon: <Sun size={18} /> },
  dark: { name: '深色沉浸', icon: <Moon size={18} /> },
  system: { name: '跟随系统', icon: <Moon size={18} /> },
};

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  platforms: PlatformConfig[];
  activePlatform: PlatformId;
  onSelectPlatform: (platform: PlatformId) => void;
  viewMode?: ViewMode;
  onSelectViewMode?: (mode: ViewMode) => void;
  theme: ThemeId;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  sessionStatuses: Record<PlatformId, PlatformSessionStatus>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  platforms,
  activePlatform,
  onSelectPlatform,
  onSelectViewMode,
  theme,
  onToggleTheme,
  onOpenSettings,
}) => {
  const getPlatformIcon = (id: PlatformId) => {
    switch (id) {
      case 'douyin':
        return <Flame size={18} />;
      case 'bilibili':
        return <Tv size={18} />;
      case 'xiaohongshu':
        return <Sparkles size={18} />;
      case 'youtube':
        return <Youtube size={18} />;
      case 'kuaishou':
        return <Video size={18} />;
    }
  };

  return (
    <aside
      className="sidebar no-drag"
      style={{
        width: collapsed ? '68px' : '240px',
        minWidth: collapsed ? '68px' : '240px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        transition: 'width var(--transition-normal), min-width var(--transition-normal)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Header / Brand Logo */}
      <div
        style={{
          height: '56px',
          padding: collapsed ? '0 12px' : '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflow: 'hidden',
          }}
        >
          {/* TriVideo Icon Logo */}
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              background: theme === 'cat'
                ? 'linear-gradient(135deg, #f4a261 0%, #e76f51 50%, #ff758f 100%)'
                : 'linear-gradient(135deg, #00AEEC 0%, #FE2C55 50%, #FF2442 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: theme === 'cat'
                ? '0 2px 8px rgba(255, 117, 143, 0.4)'
                : '0 2px 8px rgba(0, 174, 236, 0.3)',
              flexShrink: 0,
            }}
          >
            {theme === 'cat' ? <CatPawIcon size={20} color="#ffffff" /> : <Layers size={20} />}
          </div>

          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.3px' }}>
                  三栖视频中心
                </span>
                {theme === 'cat' && <span style={{ fontSize: '13px' }}>🐾</span>}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {theme === 'cat' ? 'Neko Cat Edition' : 'TriVideo Hub'}
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            title="折叠侧边栏"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
            }}
            className="hover-btn"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <button
            onClick={onToggleCollapse}
            title="展开侧边栏"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
            }}
            className="hover-btn"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Section: Platform Tabs */}
        <div>
          {!collapsed && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: '0 8px 6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              聚合平台
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {platforms.map((p) => {
              const isActive = activePlatform === p.id;
              if (theme === 'adventure') {
                return (
                  <HangingBannerTab
                    key={p.id}
                    title={p.name}
                    badgeText={p.englishName}
                    color={p.brandColor}
                    active={isActive}
                    collapsed={collapsed}
                    icon={getPlatformIcon(p.id)}
                    onClick={() => {
                      onSelectPlatform(p.id);
                      onSelectViewMode?.('platform');
                    }}
                  />
                );
              }
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPlatform(p.id);
                    onSelectViewMode?.('platform');
                  }}
                  title={collapsed ? p.name : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: collapsed ? '10px' : '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '13px',
                    position: 'relative',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    border: isActive ? '1px solid var(--border-normal)' : '1px solid transparent',
                  }}
                  className="nav-btn"
                >
                  <span
                    style={{
                      color: isActive ? p.brandColor : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {getPlatformIcon(p.id)}
                  </span>

                  {!collapsed && (
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cute Cat Companion Widget - shown in Cat Theme */}
        {theme === 'cat' && (
          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <CatCompanionWidget collapsed={collapsed} theme={theme} />
          </div>
        )}
      </div>

      {/* Footer Controls: Theme, Session info, Settings */}
      <div
        style={{
          padding: '12px 10px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: '4px',
          }}
        >
          <button
            onClick={onToggleTheme}
            title={`当前主题: ${THEME_INFO[theme]?.name || theme} (点击切换)`}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="hover-btn"
          >
            {THEME_INFO[theme]?.icon || <Moon size={18} />}
          </button>

          <button
            data-id="btn-settings"
            onClick={onOpenSettings}
            title="应用设置"
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="hover-btn"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
