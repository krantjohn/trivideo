import React from 'react';
import { PlatformConfig, ViewMode } from '../../types';

interface CategoryBarProps {
  currentPlatform: PlatformConfig;
  onSelectCategory: (url: string) => void;
  viewMode?: ViewMode;
  onSelectViewMode?: (mode: ViewMode) => void;
  currentUrl?: string;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  currentPlatform,
  onSelectCategory,
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
    </div>
  );
};
