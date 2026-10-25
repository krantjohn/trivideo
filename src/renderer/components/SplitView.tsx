import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCw,
  Home,
  Check,
  ChevronDown,
  GripVertical,
  GripHorizontal,
} from 'lucide-react';
import { PlatformId, PlatformConfig, PaneId, ContentBounds, LayoutMode, SplitConfig } from '../../types';

interface SplitViewProps {
  layoutMode?: LayoutMode;
  splitConfig: SplitConfig;
  leftPlatform?: PlatformId;
  rightPlatform?: PlatformId;
  focusedPane?: PaneId;
  splitRatio?: number;
  horizontalRatio?: number;
  platforms: PlatformConfig[]; // Enabled platforms
  onSetFocus: (pane: PaneId) => void;
  onSelectPlatform: (pane: PaneId, platform: PlatformId) => void;
  onRatioChange?: (ratio: number) => void;
  onVerticalRatioChange?: (ratio: number) => void;
  onHorizontalRatioChange?: (ratio: number) => void;
  onBoundsChange?: (bounds: { left: ContentBounds; right: ContentBounds }) => void;
  onMultiBoundsChange?: (bounds: Record<string, ContentBounds>) => void;
  onReloadPane: (pane: PaneId) => void;
  onGoHomePane: (pane: PaneId) => void;
}

export const SplitView: React.FC<SplitViewProps> = ({
  layoutMode,
  splitConfig,
  leftPlatform,
  rightPlatform,
  focusedPane,
  splitRatio,
  horizontalRatio,
  platforms,
  onSetFocus,
  onSelectPlatform,
  onRatioChange,
  onVerticalRatioChange,
  onHorizontalRatioChange,
  onBoundsChange,
  onMultiBoundsChange,
  onReloadPane,
  onGoHomePane,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pane1Ref = useRef<HTMLDivElement>(null);
  const pane2Ref = useRef<HTMLDivElement>(null);
  const pane3Ref = useRef<HTMLDivElement>(null);
  const pane4Ref = useRef<HTMLDivElement>(null);

  const [dragType, setDragType] = useState<'vertical' | 'horizontal' | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const currentMode: LayoutMode = layoutMode || splitConfig?.mode || 'split';

  // Effective ratios
  const vRatio = splitRatio ?? splitConfig?.splitRatio ?? (currentMode === 'triple' ? 0.6 : 0.5);
  const hRatio = horizontalRatio ?? splitConfig?.horizontalRatio ?? 0.5;

  // Resolve pane platforms
  const rawPanes = splitConfig?.panes || [];
  const pane1Platform: PlatformId =
    rawPanes.find((p) => p.id === 'pane-1')?.platform || leftPlatform || splitConfig?.leftPlatform || platforms[0]?.id || 'bilibili';
  const pane2Platform: PlatformId =
    rawPanes.find((p) => p.id === 'pane-2')?.platform || rightPlatform || splitConfig?.rightPlatform || platforms[1]?.id || platforms[0]?.id || 'youtube';
  const pane3Platform: PlatformId =
    rawPanes.find((p) => p.id === 'pane-3')?.platform || platforms[2]?.id || platforms[0]?.id || 'douyin';
  const pane4Platform: PlatformId =
    rawPanes.find((p) => p.id === 'pane-4')?.platform || platforms[3]?.id || platforms[0]?.id || 'kuaishou';

  // Focused pane identification
  const effectiveFocusedId =
    splitConfig?.focusedPaneId ||
    focusedPane ||
    splitConfig?.focusedPane ||
    'pane-1';

  const isPaneFocused = (paneId: string): boolean => {
    if (effectiveFocusedId === paneId) return true;
    if (paneId === 'pane-1' && (effectiveFocusedId === 'left' || effectiveFocusedId === 'pane-1')) return true;
    if (paneId === 'pane-2' && (effectiveFocusedId === 'right' || effectiveFocusedId === 'pane-2')) return true;
    return false;
  };

  // Measure and notify bounds of all active pane viewports
  const updateBounds = useCallback(() => {
    const multiBounds: Record<string, ContentBounds> = {};

    if (pane1Ref.current) {
      const r = pane1Ref.current.getBoundingClientRect();
      multiBounds['pane-1'] = { x: r.x, y: r.y, width: Math.max(0, r.width), height: Math.max(0, r.height) };
      multiBounds['left'] = multiBounds['pane-1'];
    }
    if (pane2Ref.current) {
      const r = pane2Ref.current.getBoundingClientRect();
      multiBounds['pane-2'] = { x: r.x, y: r.y, width: Math.max(0, r.width), height: Math.max(0, r.height) };
      multiBounds['right'] = multiBounds['pane-2'];
    }
    if (pane3Ref.current && (currentMode === 'triple' || currentMode === 'quad')) {
      const r = pane3Ref.current.getBoundingClientRect();
      multiBounds['pane-3'] = { x: r.x, y: r.y, width: Math.max(0, r.width), height: Math.max(0, r.height) };
    }
    if (pane4Ref.current && currentMode === 'quad') {
      const r = pane4Ref.current.getBoundingClientRect();
      multiBounds['pane-4'] = { x: r.x, y: r.y, width: Math.max(0, r.width), height: Math.max(0, r.height) };
    }

    if (onMultiBoundsChange) {
      onMultiBoundsChange(multiBounds);
    }
    if (onBoundsChange && multiBounds['pane-1'] && multiBounds['pane-2']) {
      onBoundsChange({ left: multiBounds['pane-1'], right: multiBounds['pane-2'] });
    }
  }, [currentMode, onMultiBoundsChange, onBoundsChange]);

  useEffect(() => {
    updateBounds();
    const handleResize = () => updateBounds();
    window.addEventListener('resize', handleResize);

    const ro = new ResizeObserver(() => {
      updateBounds();
    });

    if (containerRef.current) ro.observe(containerRef.current);
    if (pane1Ref.current) ro.observe(pane1Ref.current);
    if (pane2Ref.current) ro.observe(pane2Ref.current);
    if (pane3Ref.current) ro.observe(pane3Ref.current);
    if (pane4Ref.current) ro.observe(pane4Ref.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, [updateBounds, currentMode, vRatio, hRatio]);

  // Handle divider drag events
  useEffect(() => {
    if (!dragType) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (dragType === 'vertical') {
        const relativeX = e.clientX - rect.left;
        let newRatio = relativeX / rect.width;
        const minRatio = Math.max(0.25, 260 / rect.width);
        const maxRatio = Math.min(0.75, (rect.width - 260) / rect.width);
        newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));

        if (onVerticalRatioChange) onVerticalRatioChange(newRatio);
        else if (onRatioChange) onRatioChange(newRatio);
      } else if (dragType === 'horizontal') {
        const relativeY = e.clientY - rect.top;
        let newRatio = relativeY / rect.height;
        const minRatio = Math.max(0.25, 160 / rect.height);
        const maxRatio = Math.min(0.75, (rect.height - 160) / rect.height);
        newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));

        if (onHorizontalRatioChange) onHorizontalRatioChange(newRatio);
      }
      updateBounds();
    };

    const handleMouseUp = () => {
      setDragType(null);
      updateBounds();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragType, onVerticalRatioChange, onHorizontalRatioChange, onRatioChange, updateBounds]);

  // Visible platform set to exclude duplicates in selector
  const activePlatformsList = [
    pane1Platform,
    pane2Platform,
    currentMode === 'triple' || currentMode === 'quad' ? pane3Platform : null,
    currentMode === 'quad' ? pane4Platform : null,
  ].filter(Boolean) as PlatformId[];

  const renderPaneHeader = (paneId: string, platformId: PlatformId) => {
    const config = platforms.find((p) => p.id === platformId) || platforms[0];
    if (!config) return null;
    const isFocused = isPaneFocused(paneId);
    const dropdownOpen = openDropdownId === paneId;

    // Available platforms excluding those already in other visible panes
    const availablePlatforms = platforms.filter(
      (p) => p.id === platformId || !activePlatformsList.includes(p.id)
    );

    return (
      <div
        style={{
          height: '38px',
          backgroundColor: isFocused ? 'var(--bg-surface)' : 'var(--bg-secondary)',
          borderBottom: `2px solid ${isFocused ? config.brandColor : 'var(--border-subtle)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          userSelect: 'none',
          position: 'relative',
          zIndex: 40,
        }}
        onClick={() => onSetFocus(paneId)}
      >
        {/* Left: Platform Dropdown / Selector */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(dropdownOpen ? null : paneId);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-active)',
              border: `1px solid ${config.brandColor}66`,
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            className="hover-btn"
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: config.brandColor,
              }}
            />
            <span>{config.name}</span>
            <ChevronDown size={13} color="var(--text-muted)" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                minWidth: '150px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-normal)',
                boxShadow: 'var(--shadow-lg)',
                padding: '4px',
                zIndex: 100,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 8px', fontWeight: 600 }}>
                切换此面板平台
              </div>
              {availablePlatforms.map((p) => {
                const isSelected = p.id === config.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectPlatform(paneId, p.id);
                      setOpenDropdownId(null);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                    className="hover-btn"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: p.brandColor,
                        }}
                      />
                      <span>{p.name}</span>
                    </div>
                    {isSelected && <Check size={13} color="var(--accent-primary)" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Center: Focus & Audio Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isFocused ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--status-success)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <Volume2 size={12} />
              <span>活动面板 · 发声中</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetFocus(paneId);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-surface-active)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              className="hover-btn"
              title="点击将键盘导航与音频焦点切换至此面板"
            >
              <VolumeX size={12} />
              <span>静音 (点击聚焦)</span>
            </button>
          )}
        </div>

        {/* Right: Pane controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGoHomePane(paneId);
            }}
            title="平台主页"
            style={{
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            className="hover-btn"
          >
            <Home size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReloadPane(paneId);
            }}
            title="刷新此面板"
            style={{
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            className="hover-btn"
          >
            <RotateCw size={13} />
          </button>
        </div>
      </div>
    );
  };

  const renderVerticalDivider = () => (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        setDragType('vertical');
      }}
      style={{
        width: '8px',
        height: '100%',
        backgroundColor: dragType === 'vertical' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
        cursor: 'col-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        userSelect: 'none',
        transition: 'background-color 0.15s ease',
        boxShadow: dragType === 'vertical' ? '0 0 10px rgba(0, 174, 236, 0.4)' : 'none',
      }}
      title="拖动调整左右分栏宽度"
    >
      <GripVertical size={12} color={dragType === 'vertical' ? '#ffffff' : 'var(--text-muted)'} />
    </div>
  );

  const renderHorizontalDivider = () => (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        setDragType('horizontal');
      }}
      style={{
        height: '8px',
        width: '100%',
        backgroundColor: dragType === 'horizontal' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
        cursor: 'row-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        userSelect: 'none',
        transition: 'background-color 0.15s ease',
        boxShadow: dragType === 'horizontal' ? '0 0 10px rgba(0, 174, 236, 0.4)' : 'none',
      }}
      title="拖动调整上下高度"
    >
      <GripHorizontal size={12} color={dragType === 'horizontal' ? '#ffffff' : 'var(--text-muted)'} />
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
      }}
      onClick={() => setOpenDropdownId(null)}
    >
      {/* Layout: Dual Split (split) */}
      {currentMode === 'split' && (
        <>
          {/* Left Pane (pane-1) */}
          <div
            style={{
              width: `${vRatio * 100}%`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              borderRight: '1px solid var(--border-subtle)',
            }}
          >
            {renderPaneHeader('pane-1', pane1Platform)}
            <div ref={pane1Ref} style={{ flex: 1, width: '100%', height: '100%' }} />
          </div>

          {/* Draggable Vertical Divider */}
          {renderVerticalDivider()}

          {/* Right Pane (pane-2) */}
          <div
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {renderPaneHeader('pane-2', pane2Platform)}
            <div ref={pane2Ref} style={{ flex: 1, width: '100%', height: '100%' }} />
          </div>
        </>
      )}

      {/* Layout: Triple Workbench (triple) */}
      {currentMode === 'triple' && (
        <>
          {/* Left Large Pane (pane-1, ~60% default width) */}
          <div
            style={{
              width: `${vRatio * 100}%`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              borderRight: '1px solid var(--border-subtle)',
            }}
          >
            {renderPaneHeader('pane-1', pane1Platform)}
            <div ref={pane1Ref} style={{ flex: 1, width: '100%', height: '100%' }} />
          </div>

          {/* Draggable Vertical Divider */}
          {renderVerticalDivider()}

          {/* Right Column with Stacked Panes (pane-2 top, pane-3 bottom) */}
          <div
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Top-right Pane (pane-2) */}
            <div
              style={{
                height: `${hRatio * 100}%`,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {renderPaneHeader('pane-2', pane2Platform)}
              <div ref={pane2Ref} style={{ flex: 1, width: '100%', height: '100%' }} />
            </div>

            {/* Draggable Horizontal Divider */}
            {renderHorizontalDivider()}

            {/* Bottom-right Pane (pane-3) */}
            <div
              style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {renderPaneHeader('pane-3', pane3Platform)}
              <div ref={pane3Ref} style={{ flex: 1, width: '100%', height: '100%' }} />
            </div>
          </div>
        </>
      )}

      {/* Layout: Quad Grid 2x2 (quad) */}
      {currentMode === 'quad' && (
        <>
          {/* Left Column (pane-1 top, pane-3 bottom) */}
          <div
            style={{
              width: `${vRatio * 100}%`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              borderRight: '1px solid var(--border-subtle)',
            }}
          >
            {/* Top-left Pane (pane-1) */}
            <div
              style={{
                height: `${hRatio * 100}%`,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {renderPaneHeader('pane-1', pane1Platform)}
              <div ref={pane1Ref} style={{ flex: 1, width: '100%', height: '100%' }} />
            </div>

            {/* Draggable Horizontal Divider */}
            {renderHorizontalDivider()}

            {/* Bottom-left Pane (pane-3) */}
            <div
              style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {renderPaneHeader('pane-3', pane3Platform)}
              <div ref={pane3Ref} style={{ flex: 1, width: '100%', height: '100%' }} />
            </div>
          </div>

          {/* Draggable Vertical Divider */}
          {renderVerticalDivider()}

          {/* Right Column (pane-2 top, pane-4 bottom) */}
          <div
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Top-right Pane (pane-2) */}
            <div
              style={{
                height: `${hRatio * 100}%`,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {renderPaneHeader('pane-2', pane2Platform)}
              <div ref={pane2Ref} style={{ flex: 1, width: '100%', height: '100%' }} />
            </div>

            {/* Draggable Horizontal Divider */}
            {renderHorizontalDivider()}

            {/* Bottom-right Pane (pane-4) */}
            <div
              style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {renderPaneHeader('pane-4', pane4Platform)}
              <div ref={pane4Ref} style={{ flex: 1, width: '100%', height: '100%' }} />
            </div>
          </div>
        </>
      )}

      {/* Drag Overlay: Prevents WebContentsView from eating mousemove during rapid dragging */}
      {dragType !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            cursor: dragType === 'vertical' ? 'col-resize' : 'row-resize',
            userSelect: 'none',
          }}
        />
      )}
    </div>
  );
};
