import React, { useState, useMemo } from 'react';
import { History, Search, Trash2, ExternalLink, Play, Tv, Flame, Sparkles } from 'lucide-react';
import { HistoryItem, PlatformId } from '../../types';
import { triVideoService } from '../services/api';

interface HistoryViewProps {
  history: HistoryItem[];
  onPlayHistoryItem: (item: HistoryItem) => void;
  onRemoveHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onPlayHistoryItem,
  onRemoveHistoryItem,
  onClearHistory,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformId | 'all'>('all');

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;
      const matchesSearch =
        !searchFilter.trim() ||
        item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.url.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesPlatform && matchesSearch;
    });
  }, [history, platformFilter, searchFilter]);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `今天 ${timeStr}`;
    }
    return `${date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} ${timeStr}`;
  };

  const getPlatformIcon = (platform: PlatformId) => {
    switch (platform) {
      case 'bilibili':
        return <Tv size={14} color="#00AEEC" />;
      case 'douyin':
        return <Flame size={14} color="#FE2C55" />;
      case 'xiaohongshu':
        return <Sparkles size={14} color="#FF2442" />;
    }
  };

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
            <History size={20} color="var(--accent-primary)" />
            <span>浏览与播放历史</span>
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
              共 {history.length} 条记录
            </span>
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            记录各平台的最近访问轨迹，可直接点击重新打开
          </p>
        </div>

        {/* Filter controls & Clear */}
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
            {(['all', 'bilibili', 'douyin', 'xiaohongshu'] as const).map((p) => {
              const label =
                p === 'all' ? '全部' : p === 'bilibili' ? 'B站' : p === 'douyin' ? '抖音' : '小红书';
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

          {/* Search inside history */}
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
              placeholder="搜索历史记录..."
              style={{
                flex: 1,
                fontSize: '12px',
                background: 'transparent',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Clear all */}
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              title="清空全部历史记录"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--status-danger)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontSize: '12px',
                fontWeight: 500,
              }}
              className="hover-btn"
            >
              <Trash2 size={13} />
              <span>清空历史</span>
            </button>
          )}
        </div>
      </div>

      {/* History list */}
      <div style={{ flex: 1, padding: '16px 24px' }}>
        {filteredHistory.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '280px',
              color: 'var(--text-muted)',
              gap: '12px',
            }}
          >
            <History size={36} color="var(--text-disabled)" />
            <p style={{ fontSize: '14px' }}>暂无历史记录</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all var(--transition-fast)',
                }}
                className="history-row"
              >
                {/* Platform Icon */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getPlatformIcon(item.platform)}
                </div>

                {/* Title & URL */}
                <div
                  onClick={() => onPlayHistoryItem(item)}
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    className="card-title-hover"
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '2px',
                    }}
                  >
                    {item.url}
                  </div>
                </div>

                {/* Timestamp */}
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {formatTimestamp(item.visitedAt)}
                </span>

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => onPlayHistoryItem(item)}
                    title="重新打开此页面"
                    style={{
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--accent-primary)',
                    }}
                    className="hover-btn"
                  >
                    <Play size={14} fill="currentColor" />
                  </button>

                  <button
                    onClick={() => triVideoService.openExternal(item.url)}
                    title="在系统浏览器中打开"
                    style={{
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                    }}
                    className="hover-btn"
                  >
                    <ExternalLink size={13} />
                  </button>

                  <button
                    onClick={() => onRemoveHistoryItem(item.id)}
                    title="删除此记录"
                    style={{
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                    }}
                    className="hover-btn-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
