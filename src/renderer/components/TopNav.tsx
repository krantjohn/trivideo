import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Home,
  Star,
  ExternalLink,
  Search,
  Minus,
  Square,
  Copy,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  PlatformId,
  PlatformConfig,
  NavigationState,
  PlatformSessionStatus,
} from '../../types';

interface TopNavProps {
  platforms: PlatformConfig[];
  activePlatform: PlatformId;
  onSelectPlatform: (platform: PlatformId) => void;
  navState: NavigationState;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onGoHome: () => void;
  onBookmarkCurrent: () => void;
  onOpenExternal: () => void;
  onSearch: (query: string) => void;
  sessionStatuses: Record<PlatformId, PlatformSessionStatus>;
  isMaximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  platforms,
  activePlatform,
  onSelectPlatform,
  navState,
  onGoBack,
  onGoForward,
  onReload,
  onStop,
  onGoHome,
  onBookmarkCurrent,
  onOpenExternal,
  onSearch,
  sessionStatuses,
  isMaximized,
  onMinimize,
  onMaximize,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const currentPlatform = platforms.find((p) => p.id === activePlatform);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <header
      className="drag-region"
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '12px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* 1. Platform Switch Tabs */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {platforms.map((p) => {
          const isActive = activePlatform === p.id;
          const session = sessionStatuses[p.id];
          return (
            <button
              key={p.id}
              onClick={() => onSelectPlatform(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                border: isActive ? `1.5px solid ${p.brandColor}` : '1.5px solid transparent',
                boxShadow: isActive ? `0 0 10px ${p.accentColor}33` : 'none',
                position: 'relative',
              }}
              className="platform-tab-btn"
            >
              <span>{p.name}</span>
              {session?.isLoggedIn && (
                <span
                  title="账号已在此平台持久登录"
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--status-success)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  已登录
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Navigation Controls */}
      <div
        className="no-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          marginLeft: '4px',
          padding: '2px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={onGoBack}
          disabled={!navState.canGoBack}
          title="后退"
          style={{
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            color: navState.canGoBack ? 'var(--text-primary)' : 'var(--text-disabled)',
            cursor: navState.canGoBack ? 'pointer' : 'not-allowed',
          }}
          className="hover-btn"
        >
          <ArrowLeft size={15} />
        </button>

        <button
          onClick={onGoForward}
          disabled={!navState.canGoForward}
          title="前进"
          style={{
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            color: navState.canGoForward ? 'var(--text-primary)' : 'var(--text-disabled)',
            cursor: navState.canGoForward ? 'pointer' : 'not-allowed',
          }}
          className="hover-btn"
        >
          <ArrowRight size={15} />
        </button>

        <button
          onClick={navState.isLoading ? onStop : onReload}
          title={navState.isLoading ? '停止加载' : '刷新页面'}
          style={{
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
          }}
          className="hover-btn"
        >
          {navState.isLoading ? <X size={15} /> : <RotateCw size={15} />}
        </button>

        <button
          onClick={onGoHome}
          title="返回平台首页"
          style={{
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
          }}
          className="hover-btn"
        >
          <Home size={15} />
        </button>
      </div>

      {/* 3. Action Buttons: Bookmark & External */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={onBookmarkCurrent}
          title="收藏当前页面到收藏夹"
          style={{
            padding: '7px 10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
          }}
          className="hover-btn"
        >
          <Star size={14} color="#f59e0b" />
          <span>收藏</span>
        </button>

        <button
          onClick={onOpenExternal}
          title="在系统浏览器中打开当前页面"
          style={{
            padding: '7px 8px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
          }}
          className="hover-btn"
        >
          <ExternalLink size={14} />
        </button>
      </div>

      {/* 4. Error Indicator & Flexible Center Spacer */}
      {navState.hasError && (
        <div className="no-drag" style={{ display: 'flex', alignItems: 'center', marginLeft: '6px' }}>
          <button
            onClick={onReload}
            title={`页面加载失败: ${navState.errorDescription || '网络错误'}，点击重新加载`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--status-danger)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '11px',
              fontWeight: 500,
            }}
            className="hover-btn"
          >
            <AlertCircle size={13} />
            <span>加载遇到问题 · 点击重试</span>
          </button>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* 5. Platform Search Box with Loading & Clear */}
      <div
        className="no-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-input)',
          border: navState.hasError ? '1px solid var(--status-danger)' : '1px solid var(--border-normal)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 12px',
          width: '260px',
          gap: '8px',
          transition: 'all var(--transition-fast)',
        }}
      >
        {navState.isLoading ? (
          <Loader2 size={14} className="spin-animation" color="var(--accent-primary)" />
        ) : (
          <Search size={14} color="var(--text-muted)" />
        )}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`在${currentPlatform?.name || '平台'}搜索...`}
          style={{
            flex: 1,
            background: 'transparent',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            title="清除内容"
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* 6. Window Controls (Minimize, Maximize, Close) */}
      <div
        className="no-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          marginLeft: '4px',
        }}
      >
        <button
          onClick={onMinimize}
          title="最小化"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
          className="win-btn"
        >
          <Minus size={14} />
        </button>

        <button
          onClick={onMaximize}
          title={isMaximized ? '还原' : '最大化'}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
          className="win-btn"
        >
          {isMaximized ? <Copy size={12} /> : <Square size={12} />}
        </button>

        <button
          onClick={onClose}
          title="关闭"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
          className="win-btn win-close-btn"
        >
          <X size={15} />
        </button>
      </div>
    </header>
  );
};
