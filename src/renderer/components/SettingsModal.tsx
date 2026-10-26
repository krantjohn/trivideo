import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Shield,
  Palette,
  HardDrive,
  Trash2,
  CheckCircle,
  Layers,
  Tv,
  Flame,
  Sparkles,
  Youtube,
  Video,
  RefreshCw,
  Download,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { AppSettings, PlatformId, PlatformSessionStatus, UpdateInfo } from '../../types';
import { triVideoService } from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'general' | 'platforms' | 'sessions' | 'security' | 'updates'>('general');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.2');
  const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'available' | 'uptodate' | 'downloading' | 'ready' | 'error'>('idle');
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; transferred: number; total: number } | null>(null);
  const [updateErrorMsg, setUpdateErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    triVideoService.getAppVersion().then((v) => {
      if (v) setCurrentVersion(v);
    }).catch(() => {});
  }, []);

  const ALL_PLATFORMS: { id: PlatformId; name: string; englishName: string; brandColor: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'bilibili', name: '哔哩哔哩', englishName: 'Bilibili', brandColor: '#00AEEC', icon: <Tv size={18} />, desc: '番剧动漫与UP主创作社区' },
    { id: 'douyin', name: '抖音', englishName: 'Douyin', brandColor: '#FE2C55', icon: <Flame size={18} />, desc: '国民级沉浸短视频与直播' },
    { id: 'xiaohongshu', name: '小红书', englishName: 'RED', brandColor: '#FF2442', icon: <Sparkles size={18} />, desc: '年轻人的生活方式分享平台' },
    { id: 'youtube', name: 'YouTube', englishName: 'YouTube', brandColor: '#FF0000', icon: <Youtube size={18} />, desc: '全球高质量长视频平台' },
    { id: 'kuaishou', name: '快手', englishName: 'Kuaishou', brandColor: '#FF7700', icon: <Video size={18} />, desc: '记录真实生活的人气短视频' },
  ];

  const enabledIds: PlatformId[] = settings.enabledPlatformIds && settings.enabledPlatformIds.length > 0
    ? settings.enabledPlatformIds
    : ['bilibili', 'douyin', 'xiaohongshu', 'youtube', 'kuaishou'];
  const enabledPlatformList = ALL_PLATFORMS.filter((p) => enabledIds.includes(p.id));
  const [clearedMessage, setClearedMessage] = useState<string | null>(null);

  // Keyboard shortcut to close settings on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setClearedMessage(msg);
    setTimeout(() => setClearedMessage(null), 3000);
  };

  const handleClearPlatformSession = (p: PlatformId, name: string) => {
    onClearSession(p);
    showToast(`已成功清空「${name}」的独立会话与 Cookie 数据`);
  };

  const handleCheckUpdate = async () => {
    setUpdateState('checking');
    setUpdateErrorMsg(null);
    try {
      const info = await triVideoService.checkForUpdates();
      setUpdateInfo(info);
      if (info.hasUpdate) {
        setUpdateState('available');
      } else {
        setUpdateState('uptodate');
      }
    } catch (err: any) {
      setUpdateState('error');
      setUpdateErrorMsg(err?.message || '检查更新失败，请重试');
    }
  };

  const handleStartUpdate = async () => {
    if (!updateInfo) return;
    setUpdateState('downloading');
    setDownloadProgress({ percent: 0, transferred: 0, total: 0 });

    const unsubscribe = triVideoService.onUpdateProgress((p) => {
      setDownloadProgress(p);
    });

    try {
      const res = await triVideoService.downloadAndInstallUpdate(updateInfo.downloadUrl || undefined);
      unsubscribe();
      if (res.success) {
        setUpdateState('ready');
      } else {
        setUpdateState('error');
        setUpdateErrorMsg(res.message);
      }
    } catch (err: any) {
      unsubscribe();
      setUpdateState('error');
      setUpdateErrorMsg(err?.message || '下载安装包失败');
    }
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
              onClick={() => setActiveTab('platforms')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeTab === 'platforms' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'platforms' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: activeTab === 'platforms' ? 600 : 500,
                textAlign: 'left',
              }}
            >
              <Layers size={15} />
              <span>平台管理</span>
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

            <button
              onClick={() => {
                setActiveTab('updates');
                if (updateState === 'idle') {
                  handleCheckUpdate();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeTab === 'updates' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'updates' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: activeTab === 'updates' ? 600 : 500,
                textAlign: 'left',
              }}
            >
              <RefreshCw size={15} />
              <span>覆盖更新</span>
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

            {/* TAB: Platforms Management */}
            {activeTab === 'platforms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    聚合平台启用管理
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    开启或关闭平台。已关闭的平台将不会在侧边栏、顶部导航和跨平台搜索中显示，释放后台计算资源。系统至少保留一个启用的平台。
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ALL_PLATFORMS.map((p) => {
                    const isEnabled = enabledIds.includes(p.id);
                    const isOnlyOne = enabledIds.length === 1 && isEnabled;

                    const handleTogglePlatform = () => {
                      if (isEnabled) {
                        if (isOnlyOne) {
                          showToast('至少需要保留一个启用的平台');
                          return;
                        }
                        const nextEnabled = enabledIds.filter((id) => id !== p.id);
                        const nextLast = settings.lastPlatform === p.id ? nextEnabled[0] : settings.lastPlatform;
                        onUpdateSettings({
                          enabledPlatformIds: nextEnabled,
                          lastPlatform: nextLast,
                        });
                        showToast(`已禁用「${p.name}」平台`);
                      } else {
                        const nextEnabled = [...enabledIds, p.id];
                        onUpdateSettings({
                          enabledPlatformIds: nextEnabled,
                        });
                        showToast(`已启用「${p.name}」平台`);
                      }
                    };

                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-lg)',
                          backgroundColor: 'var(--bg-surface)',
                          border: isEnabled ? `1px solid ${p.brandColor}55` : '1px solid var(--border-subtle)',
                          opacity: isEnabled ? 1 : 0.65,
                          transition: 'all 0.15s ease-out',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: `${p.brandColor}1a`,
                              color: p.brandColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {p.icon}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                              {isOnlyOne && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    color: 'var(--accent-primary)',
                                    padding: '1px 6px',
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: 'var(--bg-surface-active)',
                                  }}
                                >
                                  唯一定位平台
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {p.desc}
                            </div>
                          </div>
                        </div>

                        {/* Switch Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            disabled={isOnlyOne}
                            onClick={handleTogglePlatform}
                            style={{
                              width: '46px',
                              height: '24px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: isEnabled ? p.brandColor : 'var(--bg-surface-active)',
                              border: 'none',
                              cursor: isOnlyOne ? 'not-allowed' : 'pointer',
                              position: 'relative',
                              transition: 'background-color 0.2s',
                              padding: '2px',
                              opacity: isOnlyOne ? 0.7 : 1,
                            }}
                            title={isOnlyOne ? '至少需要保留一个启用的平台' : isEnabled ? '点击禁用' : '点击启用'}
                          >
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#ffffff',
                                transform: isEnabled ? 'translateX(22px)' : 'translateX(0)',
                                transition: 'transform 0.2s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              }}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {enabledPlatformList.map((p) => {
                      const selected = settings.lastPlatform === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => onUpdateSettings({ lastPlatform: p.id })}
                          style={{
                            flex: 1,
                            minWidth: '80px',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: selected ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                            border: selected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: selected ? 600 : 500,
                          }}
                        >
                          {p.name}
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
                  每个平台拥有物理隔离的独立 Session 分区（如 persist:bilibili、persist:douyin、persist:xiaohongshu、persist:youtube、persist:kuaishou），Cookie与登录凭据互不干扰。
                </p>

                {(['bilibili', 'douyin', 'xiaohongshu', 'youtube', 'kuaishou'] as const).map((p) => {
                  const name =
                    p === 'bilibili'
                      ? '哔哩哔哩 (Bilibili)'
                      : p === 'douyin'
                      ? '抖音 (Douyin)'
                      : p === 'xiaohongshu'
                      ? '小红书 (Xiaohongshu)'
                      : p === 'youtube'
                      ? 'YouTube (Google)'
                      : '快手 (Kuaishou)';
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

            {/* TAB 4: Software Overwrite Update */}
            {activeTab === 'updates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>当前版本: v{updateInfo?.currentVersion || currentVersion}</span>
                      <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(0, 174, 236, 0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(0, 174, 236, 0.3)' }}>
                        正式发布版
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      三栖视频中心 (TriVideo) 桌面客户端 · 支持多平台聚合与分屏协作
                    </div>
                  </div>

                  <button
                    onClick={handleCheckUpdate}
                    disabled={updateState === 'checking' || updateState === 'downloading'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: (updateState === 'checking' || updateState === 'downloading') ? 'not-allowed' : 'pointer',
                      opacity: (updateState === 'checking' || updateState === 'downloading') ? 0.7 : 1,
                    }}
                    className="hover-btn"
                  >
                    <RefreshCw size={14} className={updateState === 'checking' ? 'spin-animation' : undefined} />
                    <span>{updateState === 'checking' ? '正在检查...' : '检查新版本'}</span>
                  </button>
                </div>

                {/* Overwrite update status card */}
                {updateState === 'uptodate' && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: 'var(--status-success)',
                    }}
                  >
                    <CheckCircle size={18} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>当前已是最新版本 (v{updateInfo?.currentVersion || currentVersion})</div>
                      <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                        暂无更新，所有平台分屏与自适应特性已就绪
                      </div>
                    </div>
                  </div>
                )}

                {updateState === 'available' && updateInfo && (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-active)',
                      border: '1.5px solid var(--accent-primary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          发现新版本: v{updateInfo.latestVersion}
                        </span>
                        <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--accent-primary)', color: '#fff' }}>
                          Update
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        发布时间: {new Date(updateInfo.publishedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {updateInfo.releaseNotes || '新版本功能优化与体验提升'}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={handleStartUpdate}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--accent-primary)',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        className="hover-btn"
                      >
                        <Download size={15} />
                        <span>一键覆盖更新</span>
                      </button>

                      <button
                        onClick={() => triVideoService.openReleasePage(updateInfo.releaseUrl)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                        className="hover-btn"
                      >
                        <ExternalLink size={13} />
                        <span>浏览器查看</span>
                      </button>
                    </div>
                  </div>
                )}

                {updateState === 'downloading' && (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span>正在下载新版本安装包...</span>
                      <span>{downloadProgress?.percent || 0}%</span>
                    </div>
                    {/* Progress Bar Track */}
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${downloadProgress?.percent || 0}%`,
                          backgroundColor: 'var(--accent-primary)',
                          transition: 'width 0.2s ease',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        {downloadProgress ? `${(downloadProgress.transferred / 1024 / 1024).toFixed(1)} MB / ${(downloadProgress.total / 1024 / 1024).toFixed(1)} MB` : '准备中...'}
                      </span>
                      <span>下载完成后将自动启动覆盖安装</span>
                    </div>
                  </div>
                )}

                {updateState === 'ready' && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: 'var(--status-success)',
                    }}
                  >
                    <CheckCircle size={18} />
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                      安装包已准备就绪，正在启动覆盖安装向导并关闭当前程序...
                    </div>
                  </div>
                )}

                {updateState === 'error' && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      color: 'var(--status-danger)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                      <AlertCircle size={16} />
                      <span>更新提示</span>
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                      {updateErrorMsg || '网络连接超时或无法连接到更新服务器，建议直接在浏览器下载最新版本。'}
                    </div>
                    <button
                      onClick={() => triVideoService.openReleasePage()}
                      style={{
                        marginTop: '4px',
                        alignSelf: 'flex-start',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      在 GitHub Releases 手动下载
                    </button>
                  </div>
                )}

                {/* Explanation Card */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    关于软件覆盖安装机制
                  </div>
                  <div>
                    1. <strong>固定应用全局唯一标识 (GUID):</strong> 保证后续所有版本安装时准确识别已有程序，不会重复产生多个独立版本。
                  </div>
                  <div>
                    2. <strong>就地覆盖与平滑升级:</strong> 新版本安装向导会自动替换旧版本可执行文件与资源，同时完好保留用户配置与已登录的账号状态。
                  </div>
                  <div>
                    3. <strong>桌面与开始菜单快捷方式同步:</strong> 自动将旧快捷方式重定向至最新版本，杜绝桌面上堆积多个版本图标。
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
