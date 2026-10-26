import React from 'react';

/**
 * 3D Ruby Wax Seal Icon (深红火漆印章)
 * Detailed SVG with molten wax edges, ribbon tails, gloss and embossed emblem.
 */
export const WaxSealIcon: React.FC<{
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  showRibbon?: boolean;
}> = ({ size = 24, color = '#C0392B', className = '', style = {}, showRibbon = false }) => {
  return (
    <svg
      width={size}
      height={showRibbon ? size * 1.3 : size}
      viewBox={showRibbon ? '0 0 40 52' : '0 0 40 40'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        <radialGradient id="waxGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#E74C3C" />
          <stop offset="45%" stopColor={color} />
          <stop offset="85%" stopColor="#96281B" />
          <stop offset="100%" stopColor="#5D150D" />
        </radialGradient>
        <linearGradient id="ribbonLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C0392B" />
          <stop offset="100%" stopColor="#781E14" />
        </linearGradient>
        <linearGradient id="ribbonRight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A93226" />
          <stop offset="100%" stopColor="#641E16" />
        </linearGradient>
        <filter id="waxShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Ribbon tails below seal */}
      {showRibbon && (
        <g id="ribbons">
          {/* Left Ribbon */}
          <path
            d="M16 28L10 49L16 45L22 49L19 28Z"
            fill="url(#ribbonLeft)"
            stroke="#5D150D"
            strokeWidth="0.8"
          />
          {/* Right Ribbon */}
          <path
            d="M21 28L28 47L22 43L16 47L19 28Z"
            fill="url(#ribbonRight)"
            stroke="#4A110A"
            strokeWidth="0.8"
          />
        </g>
      )}

      {/* Main Scalloped Molten Wax Body */}
      <g filter="url(#waxShadow)">
        <path
          d="M20 3C23 3 24.5 4.8 27.5 5.2C30.5 5.6 33.2 4.2 35.5 6.5C37.8 8.8 36.4 11.5 36.8 14.5C37.2 17.5 39 19 39 22C39 25 37.2 26.5 36.8 29.5C36.4 32.5 37.8 35.2 35.5 37.5C33.2 39.8 30.5 38.4 27.5 38.8C24.5 39.2 23 41 20 41C17 41 15.5 39.2 12.5 38.8C9.5 38.4 6.8 39.8 4.5 37.5C2.2 35.2 3.6 32.5 3.2 29.5C2.8 26.5 1 25 1 22C1 19 2.8 17.5 3.2 14.5C3.6 11.5 2.2 8.8 4.5 6.5C6.8 4.2 9.5 5.6 12.5 5.2C15.5 4.8 17 3 20 3Z"
          fill="url(#waxGrad)"
          stroke="#4D120B"
          strokeWidth="1.2"
        />
        {/* Inner Embossed Ring */}
        <circle cx="20" cy="22" r="12" fill="none" stroke="#781E14" strokeWidth="1.5" strokeDasharray="3 1.5" />
        <circle cx="20" cy="22" r="10.5" fill="#A93226" fillOpacity="0.4" stroke="#FFEAE6" strokeOpacity="0.3" strokeWidth="0.8" />
        {/* Center Tri-Bird / Venture Monogram */}
        <path
          d="M20 16L22.5 21H26L23 23.5L24.2 28L20 25.5L15.8 28L17 23.5L14 21H17.5L20 16Z"
          fill="#FADBD8"
          fillOpacity="0.85"
        />
        {/* Specular Highlight Arc */}
        <path
          d="M13 12C15 9.5 18 8.5 22 8.5"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
      </g>
    </svg>
  );
};

/**
 * Rolled Parchment Scroll Icon (古旧羊皮纸卷轴)
 */
export const ParchmentScrollIcon: React.FC<{
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ size = 20, color = 'currentColor', style = {} }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <path
        d="M19 19C19 20.1 18.1 21 17 21H6C4.34 21 3 19.66 3 18C3 16.34 4.34 15 6 15H17C17.55 15 18 14.55 18 14V5C18 3.9 17.1 3 16 3H5C3.9 3 3 3.9 3 5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 19C19.55 19 20 18.55 20 18V8C20 6.9 19.1 6 18 6H7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="7" y1="9" x2="14" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="12" x2="12" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

/**
 * Hanging Pennant / Banner Tab (悬挂布幔旗帜)
 * Designed for Sidebar platform navigation matching the reference image.
 */
export const HangingBannerTab: React.FC<{
  title: string;
  badgeText?: string;
  color: string;
  active: boolean;
  collapsed: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, badgeText, color, active, collapsed, icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="rpg-banner-tab"
      style={{
        position: 'relative',
        cursor: 'pointer',
        margin: collapsed ? '6px auto' : '6px 12px',
        width: collapsed ? '46px' : 'calc(100% - 24px)',
        userSelect: 'none',
        transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease',
        transform: active ? 'translateY(2px) scale(1.02)' : 'translateY(0) scale(1)',
        filter: active
          ? 'drop-shadow(0 6px 10px rgba(0,0,0,0.45)) drop-shadow(0 0 6px rgba(243, 156, 18, 0.35))'
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3)) opacity(0.85)',
      }}
    >
      {/* Top Hanging Wooden Rod */}
      <div
        style={{
          height: '6px',
          background: 'linear-gradient(180deg, #8A5A36 0%, #4E2E19 100%)',
          borderRadius: '3px',
          border: '1px solid #2C1810',
          boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 2px',
        }}
      >
        <div style={{ width: '4px', height: '8px', background: '#2C1810', borderRadius: '2px' }} />
        <div style={{ width: '4px', height: '8px', background: '#2C1810', borderRadius: '2px' }} />
      </div>

      {/* Main Fabric Banner Body */}
      <div
        style={{
          background: active
            ? `linear-gradient(180deg, ${color} 0%, #2A170E 140%)`
            : `linear-gradient(180deg, #3B2418 0%, #22120B 100%)`,
          borderLeft: active ? `2px solid #F39C12` : '1px solid #5A3521',
          borderRight: active ? `2px solid #F39C12` : '1px solid #5A3521',
          padding: collapsed ? '10px 4px 14px' : '9px 12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '10px',
          position: 'relative',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% calc(100% - 10px), 50% 100%, 0% calc(100% - 10px))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -4px 8px rgba(0,0,0,0.5)',
        }}
      >
        {/* Platform Icon with embossed frame */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: active ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0,0,0,0.4)',
            border: active ? '1.5px solid #F39C12' : '1px solid #6E442B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: active ? '#FFF' : '#C8AC93',
            flexShrink: 0,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
          }}
        >
          {icon}
        </div>

        {/* Text info when not collapsed */}
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: active ? '700' : '600',
                color: active ? '#FFF8E7' : '#D5BFAB',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                letterSpacing: '0.4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>
            {badgeText && (
              <div
                style={{
                  fontSize: '11px',
                  color: active ? '#F9E79F' : '#9E7D67',
                  lineHeight: '1.2',
                }}
              >
                {badgeText}
              </div>
            )}
          </div>
        )}

        {/* Active wax dot indicator */}
        {active && (
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#C0392B',
              boxShadow: '0 0 5px #E74C3C, inset 0 1px 2px #FFF',
              border: '1px solid #781E14',
            }}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Black Iron Wood Screw / Rivet (黑铁原木铆钉)
 */
export const WoodRivet: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 8,
  style = {},
}) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #555 0%, #1A1A1A 85%, #000 100%)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.3)',
        border: '0.5px solid #0D0D0D',
        display: 'inline-block',
        ...style,
      }}
    />
  );
};

/**
 * Milestone Roadmap Item for Multi-Screen layout switcher (藏宝图多屏路线节点)
 */
export const MilestoneNode: React.FC<{
  label: string;
  roman: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, roman, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        border: active ? '2px solid #F39C12' : '1.5px solid #6E462E',
        background: active
          ? 'radial-gradient(circle at 35% 35%, #F5E8C7 0%, #D4AC0D 70%, #9A7D0A 100%)'
          : 'radial-gradient(circle at 35% 35%, #4A2E1B 0%, #2B1810 100%)',
        color: active ? '#2B1810' : '#C8AC93',
        fontWeight: 'bold',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: active
          ? '0 0 8px rgba(243, 156, 18, 0.6), inset 0 1px 2px rgba(255,255,255,0.6)'
          : 'inset 0 2px 4px rgba(0,0,0,0.6)',
        transition: 'all 0.2s ease',
        transform: active ? 'scale(1.1)' : 'scale(1)',
        padding: 0,
      }}
    >
      {roman}
    </button>
  );
};
