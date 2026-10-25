import React from 'react';
import { Compass, Bookmark, History } from 'lucide-react';
import { PlatformConfig, ViewMode } from '../../types';

interface CategoryBarProps {
  currentPlatform: PlatformConfig;
  onSelectCategory: (url: string) => void;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  bookmarkCount: number;
  historyCount: number;
  currentUrl?: string;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  currentPlatform,
  onSelectCategory,
  viewMode,
  onSelectViewMode,
  bookmarkCount,
  historyCount,
  currentUrl,
}) => {
  return (
    <div
      style={{
        height: '46px',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      {/* Category Pills (Scrollable horizontally) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '2px 0',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {currentPlatform.name}频道:
        </span>

        {currentPlatform.categories.map((cat) => {
          const isSelected = currentUrl
            ? currentUrl === cat.url ||
              (cat.url !== currentPlatform.homeUrl && currentUrl.startsWith(cat.url.split('?')[0]))
            : false;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.url)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: isSelected ? 600 : 500,
                whiteSpace: 'nowrap',
                border: isSelected
                  ? `1px solid ${currentPlatform.accentColor || currentPlatform.brandColor}`
                  : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? `0 0 8px ${currentPlatform.brandColor}33` : 'none',
                transition: 'all var(--transition-fast)',
                flexShrink: 0,
              }}
              className="cat-chip-btn"
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Mode Switcher Group */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          padding: '2px',
          border: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onSelectViewMode('platform')}
          title="切换至原平台网页视图（支持登录、播放、互动）"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: viewMode === 'platform' ? 'var(--bg-surface-active)' : 'transparent',
            color: viewMode === 'platform' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: viewMode === 'platform' ? 600 : 500,
          }}
        >
          <Compass size={13} />
          <span>原网浏览</span>
        </button>

        <button
          onClick={() => onSelectViewMode('favorites')}
          title="切换至我的收藏夹"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: viewMode === 'favorites' ? 'var(--bg-surface-active)' : 'transparent',
            color: viewMode === 'favorites' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: viewMode === 'favorites' ? 600 : 500,
          }}
        >
          <Bookmark size={13} />
          <span>收藏夹</span>
          {bookmarkCount > 0 && <span style={{ fontSize: '11px', opacity: 0.8 }}>({bookmarkCount})</span>}
        </button>

        <button
          onClick={() => onSelectViewMode('history')}
          title="切换至播放浏览历史"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: viewMode === 'history' ? 'var(--bg-surface-active)' : 'transparent',
            color: viewMode === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: viewMode === 'history' ? 600 : 500,
          }}
        >
          <History size={13} />
          <span>历史</span>
          {historyCount > 0 && <span style={{ fontSize: '11px', opacity: 0.8 }}>({historyCount})</span>}
        </button>
      </div>
    </div>
  );
};
