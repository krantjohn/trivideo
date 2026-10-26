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
} from 'lucide-react';
import { PlatformId, PlatformConfig, ViewMode, PlatformSessionStatus } from '../../types';
import { triVideoService } from '../services/api';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  platforms: PlatformConfig[];
  activePlatform: PlatformId;
  onSelectPlatform: (platform: PlatformId) => void;
  viewMode?: ViewMode;
  onSelectViewMode?: (mode: ViewMode) => void;
  theme: 'dark' | 'light';
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
  const currentPlatformConfig = platforms.find((p) => p.id === activePlatform);

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
              background: 'linear-gradient(135deg, #00AEEC 0%, #FE2C55 50%, #FF2442 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 174, 236, 0.3)',
              flexShrink: 0,
            }}
          >
            <Layers size={20} />
          </div>

          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.3px' }}>
                三栖视频中心
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TriVideo Hub</span>
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

        {/* Section: Platform Categories Summary */}
        {!collapsed && currentPlatformConfig && (
          <div>
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
              {currentPlatformConfig.name} 分类推荐
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px',
                padding: '0 4px',
              }}
            >
              {currentPlatformConfig.categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectViewMode?.('platform');
                    triVideoService.navigate(cat.url);
                  }}
                  style={{
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  className="cat-pill"
                >
                  {cat.name}
                </button>
              ))}
            </div>
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
            title={theme === 'dark' ? '切换为浅色主题' : '切换为深色主题'}
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
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
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
