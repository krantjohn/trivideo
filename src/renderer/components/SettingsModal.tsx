import React, { useState } from 'react';
import {
  X,
  Settings,
  Shield,
  Palette,
  HardDrive,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { AppSettings, PlatformId, PlatformSessionStatus } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  sessionStatuses: Record<PlatformId, PlatformSessionStatus>;
  onClearSession: (platform: PlatformId) => void;
  onClearAllCache: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  sessionStatuses,
  onClearSession,
  onClearAllCache,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'sessions' | 'security'>('general');
  const [clearedMessage, setClearedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setClearedMessage(msg);
    setTimeout(() => setClearedMessage(null), 3000);
  };

  const handleClearPlatformSession = (p: PlatformId, name: string) => {
    onClearSession(p);
    showToast(`已成功清空「${name}」的独立会话与 Cookie 数据`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '640px',
          maxHeight: '80vh',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-normal)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            height: '56px',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px' }}>
            <Settings size={18} color="var(--accent-primary)" />
            <span>三栖视频中心 · 应用设置</span>
          </div>
          <button
            data-id="btn-close-modal"
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
            }}
            className="hover-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with Sidebar Tabs */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Settings Left Tab Menu */}
          <div
            style={{
              width: '160px',
              backgroundColor: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border-subtle)',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setActiveTab('general')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeTab === 'general' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: activeTab === 'general' ? 600 : 500,
                textAlign: 'left',
              }}
            >
              <Palette size={15} />
              <span>常规与主题</span>
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeTab === 'sessions' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'sessions' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: activeTab === 'sessions' ? 600 : 500,
                textAlign: 'left',
              }}
            >
              <HardDrive size={15} />
              <span>平台会话隔离</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeTab === 'security' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'security' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: activeTab === 'security' ? 600 : 500,
                textAlign: 'left',
              }}
            >
              <Shield size={15} />
              <span>架构与安全</span>
            </button>
          </div>

          {/* Settings Right Content */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {clearedMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  marginBottom: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--status-success)',
                  fontSize: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle size={15} />
                <span>{clearedMessage}</span>
              </div>
            )}

            {/* TAB 1: General */}
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    界面外观主题
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={() => onUpdateSettings({ theme: 'dark' })}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: settings.theme === 'dark' ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                        border: settings.theme === 'dark' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>深色沉浸模式</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>护眼低眩光 深灰精调色调</span>
                    </button>

                    <button
                      onClick={() => onUpdateSettings({ theme: 'light' })}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: settings.theme === 'light' ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                        border: settings.theme === 'light' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>清新浅色模式</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>明亮通透 现代办公风格</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    默认启动平台
                  </h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['bilibili', 'douyin', 'xiaohongshu'] as const).map((p) => {
                      const name = p === 'bilibili' ? '哔哩哔哩' : p === 'douyin' ? '抖音' : '小红书';
                      const selected = settings.lastPlatform === p;
                      return (
                        <button
                          key={p}
                          onClick={() => onUpdateSettings({ lastPlatform: p })}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: selected ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                            border: selected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: selected ? 600 : 500,
                          }}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      窗口失焦或后台静音
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      当切换至其他程序或窗口失焦时，自动静音网页播放声音
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ muteOnBackground: !settings.muteOnBackground })}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: settings.muteOnBackground ? 'var(--accent-primary)' : 'var(--bg-surface-active)',
                      color: settings.muteOnBackground ? '#fff' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {settings.muteOnBackground ? '已开启' : '已关闭'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Sessions */}
            {activeTab === 'sessions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  每个平台拥有物理隔离的独立 Session 分区（如 persist:bilibili、persist:douyin、persist:xiaohongshu），Cookie与登录凭据互不干扰。
                </p>

                {(['bilibili', 'douyin', 'xiaohongshu'] as const).map((p) => {
                  const name = p === 'bilibili' ? '哔哩哔哩 (Bilibili)' : p === 'douyin' ? '抖音 (Douyin)' : '小红书 (Xiaohongshu)';
                  const status = sessionStatuses[p];
                  return (
                    <div
                      key={p}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          持久会话分区: <code>persist:{p}</code> · Cookie 数: {status?.cookieCount || 0}
                          {status?.accountName && ` · ${status.accountName}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleClearPlatformSession(p, name)}
                          title="清空此平台的登录态与Cookie"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--status-danger)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            fontSize: '11px',
                          }}
                          className="hover-btn"
                        >
                          <Trash2 size={12} />
                          <span>退出登录/清空</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => {
                      onClearAllCache();
                      showToast('已清空全部平台的网页缓存');
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-normal)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                    className="hover-btn"
                  >
                    清空全部网络临时缓存
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Security & Architecture */}
            {activeTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={14} />
                    <span>现代架构已激活 (Modern WebContentsView)</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1.5 }}>
                    本项目遵循 Electron 现代架构标准，彻底摒弃已弃用的 BrowserView，采用 Electron 推荐的 WebContentsView 视图方案。
                  </p>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <strong>上下文隔离 (contextIsolation):</strong> 已启用
                  </div>
                  <div>
                    <strong>Node.js 渲染进程集成:</strong> 已禁用 (最小权限安全原则)
                  </div>
                  <div>
                    <strong>本地存储架构:</strong> 无云端数据库，数据全部存放于本地操作系统应用目录，完全保护用户隐私
                  </div>
                  <div>
                    <strong>原生播放保护:</strong> 保留平台官方原生播放器，支持 4K/1080P 高清原画、会员特权及弹幕互动
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
