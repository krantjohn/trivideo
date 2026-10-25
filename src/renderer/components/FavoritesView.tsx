import React, { useState, useMemo } from 'react';
import { Bookmark, Search } from 'lucide-react';
import { BookmarkItem, PlatformId } from '../../types';
import { VideoGrid } from './VideoGrid';

interface FavoritesViewProps {
  bookmarks: BookmarkItem[];
  onPlayItem: (item: BookmarkItem) => void;
  onRemoveBookmark: (id: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  bookmarks,
  onPlayItem,
  onRemoveBookmark,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformId | 'all'>('all');

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((item) => {
      const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;
      const matchesSearch =
        !searchFilter.trim() ||
        item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.author && item.author.toLowerCase().includes(searchFilter.toLowerCase()));
      return matchesPlatform && matchesSearch;
    });
  }, [bookmarks, platformFilter, searchFilter]);

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bookmark size={20} color="var(--accent-primary)" />
            <span>我的收藏夹</span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-surface)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              共 {bookmarks.length} 项
            </span>
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            点击任意卡片将直接唤起对应的原平台独立沙箱并在应用内无缝播放
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Platform chips */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {(['all', 'bilibili', 'douyin', 'xiaohongshu', 'youtube', 'kuaishou'] as const).map((p) => {
              const label =
                p === 'all'
                  ? '全部'
                  : p === 'bilibili'
                  ? 'B站'
                  : p === 'douyin'
                  ? '抖音'
                  : p === 'xiaohongshu'
                  ? '小红书'
                  : p === 'youtube'
                  ? 'YouTube'
                  : '快手';
              const active = platformFilter === p;
              return (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    backgroundColor: active ? 'var(--bg-surface-active)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search inside favorites */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-normal)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 10px',
              width: '180px',
            }}
          >
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="搜索收藏内容..."
              style={{
                flex: 1,
                fontSize: '12px',
                background: 'transparent',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid of video cards */}
      <VideoGrid
        items={filteredBookmarks}
        onPlayItem={onPlayItem}
        onRemoveItem={onRemoveBookmark}
        emptyMessage={
          searchFilter || platformFilter !== 'all'
            ? '未找到符合筛选条件的收藏内容'
            : '收藏夹还是空的，在原网浏览时点击右上角「收藏」即可添加'
        }
      />
    </div>
  );
};
