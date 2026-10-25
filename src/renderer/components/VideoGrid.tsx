import React from 'react';
import { Play, Trash2, ExternalLink, Flame, Tv, Sparkles, Eye, Youtube, Video } from 'lucide-react';
import { BookmarkItem, PlatformId } from '../../types';
import { triVideoService } from '../services/api';

interface VideoGridProps {
  items: BookmarkItem[];
  onPlayItem: (item: BookmarkItem) => void;
  onRemoveItem?: (id: string) => void;
  emptyMessage?: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  items,
  onPlayItem,
  onRemoveItem,
  emptyMessage = '暂无收藏的视频或笔记',
}) => {
  const getPlatformBadge = (platform: PlatformId) => {
    switch (platform) {
      case 'bilibili':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(0, 174, 236, 0.15)',
              color: '#00AEEC',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Tv size={12} />
            <span>哔哩哔哩</span>
          </span>
        );
      case 'douyin':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(254, 44, 85, 0.15)',
              color: '#FE2C55',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Flame size={12} />
            <span>抖音</span>
          </span>
        );
      case 'xiaohongshu':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(255, 36, 66, 0.15)',
              color: '#FF2442',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Sparkles size={12} />
            <span>小红书</span>
          </span>
        );
      case 'youtube':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(255, 0, 0, 0.15)',
              color: '#FF0000',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Youtube size={12} />
            <span>YouTube</span>
          </span>
        );
      case 'kuaishou':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(255, 119, 0, 0.15)',
              color: '#FF7700',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Video size={12} />
            <span>快手</span>
          </span>
        );
    }
  };

  if (items.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '360px',
          color: 'var(--text-muted)',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-disabled)',
          }}
        >
          <Play size={28} />
        </div>
        <p style={{ fontSize: '14px' }}>{emptyMessage}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-disabled)' }}>
          在上方原网浏览中，点击顶部「收藏」按钮即可将当前视频或笔记添加到这里
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        padding: '20px',
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-card)',
            transition: 'transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)',
            position: 'relative',
          }}
          className="video-card"
        >
          {/* Card Thumbnail / Header */}
          <div
            onClick={() => onPlayItem(item)}
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%', // 16:9 aspect ratio
              backgroundColor: 'var(--bg-surface-active)',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            {/* Background Branded Fallback */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  item.platform === 'bilibili'
                    ? 'linear-gradient(135deg, rgba(0, 174, 236, 0.25) 0%, rgba(20, 24, 34, 0.9) 100%)'
                    : item.platform === 'douyin'
                    ? 'linear-gradient(135deg, rgba(254, 44, 85, 0.25) 0%, rgba(20, 24, 34, 0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 36, 66, 0.25) 0%, rgba(20, 24, 34, 0.9) 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
              }}
            >
              {item.platform === 'bilibili' && <Tv size={32} color="#00AEEC" />}
              {item.platform === 'douyin' && <Flame size={32} color="#FE2C55" />}
              {item.platform === 'xiaohongshu' && <Sparkles size={32} color="#FF2442" />}
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {item.platform === 'bilibili' ? '哔哩哔哩' : item.platform === 'douyin' ? '抖音' : '小红书'} · 原网视频
              </span>
            </div>

            {item.coverUrl && (
              <img
                src={item.coverUrl}
                alt={item.title}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform var(--transition-normal)',
                }}
                className="card-thumb"
              />
            )}

            {/* Play Button Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity var(--transition-fast)',
              }}
              className="card-play-overlay"
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#121316',
                  transform: 'scale(0.9)',
                  transition: 'transform var(--transition-fast)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
              >
                <Play size={20} fill="#121316" style={{ marginLeft: '2px' }} />
              </div>
            </div>

            {/* Duration / Media Type Badge */}
            {item.duration && (
              <span
                style={{
                  position: 'absolute',
                  right: '8px',
                  bottom: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {item.duration}
              </span>
            )}

            {/* Platform Tag */}
            <div style={{ position: 'absolute', left: '8px', top: '8px' }}>
              {getPlatformBadge(item.platform)}
            </div>
          </div>

          {/* Card Content Body */}
          <div
            style={{
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              gap: '8px',
            }}
          >
            {/* Title */}
            <h3
              onClick={() => onPlayItem(item)}
              title={item.title}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: 1.4,
                color: 'var(--text-primary)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              className="card-title-hover"
            >
              {item.title}
            </h3>

            {/* Author / Creator Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: 'auto',
              }}
            >
              {item.authorAvatar ? (
                <img
                  src={item.authorAvatar}
                  alt={item.author || 'Author'}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface-active)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {(item.author || 'P')[0]}
                </div>
              )}
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {item.author || '平台创作者'}
              </span>

              {/* Stats: Play count or Like count */}
              {item.playCount && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <Eye size={12} />
                  {item.playCount}
                </span>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '4px',
              }}
            >
              <button
                onClick={() => onPlayItem(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-primary-glow)',
                }}
                className="hover-btn"
              >
                <Play size={12} fill="currentColor" />
                <span>原网播放</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => triVideoService.openExternal(item.url)}
                  title="在外部浏览器打开"
                  style={{
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                  }}
                  className="hover-btn"
                >
                  <ExternalLink size={13} />
                </button>

                {onRemoveItem && (
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    title="从收藏夹移除"
                    style={{
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                    }}
                    className="hover-btn-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
