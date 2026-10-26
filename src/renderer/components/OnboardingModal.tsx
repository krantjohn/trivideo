import React, { useState, useEffect } from 'react';
import {
  Tv,
  Flame,
  Sparkles,
  Youtube,
  Video,
  Check,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { PlatformId, PlatformConfig } from '../../types';

interface OnboardingModalProps {
  isOpen: boolean;
  platforms: PlatformConfig[];
  onComplete: (selectedPlatformIds: PlatformId[]) => void;
}

const DEFAULT_TAGLINES: Record<PlatformId, string> = {
  bilibili: '番剧动漫 · 弹幕互动 · 知识科普 · UP主生态',
  douyin: '沉浸短视频 · 即时热点 · 音乐潮流 · 直播互动',
  xiaohongshu: '生活方式分享 · 实用干货 · 探索发现 · 灵感笔记',
  youtube: '全球视界 · 高清长视频 · 丰富创作者 · 热门音乐',
  kuaishou: '记录真实生活 · 高人气短视频 · 精彩直播 · 热榜',
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  platforms,
  onComplete,
}) => {
  const [selectedIds, setSelectedIds] = useState<PlatformId[]>([]);

  // When platforms load or modal opens, initialize selection with all platforms
  useEffect(() => {
    if (platforms.length > 0) {
      setSelectedIds(platforms.map((p) => p.id));
    }
  }, [platforms]);

  if (!isOpen) return null;

  const getPlatformIcon = (id: PlatformId) => {
    switch (id) {
      case 'bilibili':
        return <Tv size={24} />;
      case 'douyin':
        return <Flame size={24} />;
      case 'xiaohongshu':
        return <Sparkles size={24} />;
      case 'youtube':
        return <Youtube size={24} />;
      case 'kuaishou':
        return <Video size={24} />;
    }
  };

  const handleToggle = (id: PlatformId) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(platforms.map((p) => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const isValid = selectedIds.length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onComplete(selectedIds);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '720px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-normal)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 32px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #00AEEC 0%, #FE2C55 50%, #FF2442 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(0, 174, 236, 0.3)',
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)' }}>
                欢迎使用 同画 (TongHua)
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                首次启动向导 · 常用平台配置
              </span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
            请选择您日常希望使用的视频平台。未勾选的平台将不会在侧边栏和跨平台搜索中显示，节省资源与界面空间。您随时可以在「设置」中重新开启或关闭。
          </p>

          {/* Quick select bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              已选择{' '}
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                {selectedIds.length}
              </span>{' '}
              / {platforms.length} 个平台
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                className="hover-btn"
              >
                全选 ({platforms.length}/{platforms.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                className="hover-btn"
              >
                清空选择
              </button>
            </div>
          </div>
        </div>

        {/* Platform Cards List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {platforms.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => handleToggle(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: isSelected ? 'var(--bg-surface)' : 'var(--bg-secondary)',
                  border: isSelected
                    ? `1.5px solid ${p.brandColor}`
                    : '1.5px solid var(--border-subtle)',
                  boxShadow: isSelected ? `0 0 12px ${p.accentColor}26` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-out',
                }}
                className="hover-btn"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Platform Icon & Badge */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: `${p.brandColor}1a`,
                      color: p.brandColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getPlatformIcon(p.id)}
                  </div>

                  {/* Platform Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.name}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--bg-surface-active)',
                        }}
                      >
                        {p.englishName}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {DEFAULT_TAGLINES[p.id] || `${p.name} 视频聚合浏览`}
                    </div>
                  </div>
                </div>

                {/* Checkbox badge */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isSelected ? p.brandColor : 'var(--bg-surface-active)',
                    border: isSelected ? `1px solid ${p.brandColor}` : '1.5px solid var(--border-normal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'all 0.15s ease-out',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <Check size={15} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 32px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {!isValid ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--status-danger)',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                <AlertCircle size={15} />
                <span>请至少选择一个平台才能进入应用</span>
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                后续可在界面左下角设置中随时调整已启用的平台
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!isValid}
            onClick={handleSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isValid ? 'var(--accent-primary)' : 'var(--bg-surface-active)',
              color: isValid ? '#ffffff' : 'var(--text-disabled)',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: isValid ? 'pointer' : 'not-allowed',
              boxShadow: isValid ? 'var(--shadow-md)' : 'none',
              transition: 'all 0.15s ease-out',
            }}
          >
            <span>完成并进入 TriVideo</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
