import React, { useState } from 'react';

// Import local downloaded high-quality royalty-free cat wallpapers
import catOrangeUrl from './wallpapers/cat-orange.jpg';
import catBritishUrl from './wallpapers/cat-british.jpg';
import catNightUrl from './wallpapers/cat-night.jpg';
import catBlossomUrl from './wallpapers/cat-blossom.jpg';

export interface CatWallpaperPreset {
  id: string;
  name: string;
  tag: string;
  desc: string;
  url: string;
}

export const CAT_WALLPAPERS: CatWallpaperPreset[] = [
  {
    id: 'cat-orange',
    name: '暖阳金渐层',
    tag: '治愈暖阳',
    desc: '温柔软萌的金黄色小猫咪，伴着和煦日光',
    url: catOrangeUrl,
  },
  {
    id: 'cat-british',
    name: '治愈银渐层',
    tag: '呆萌毛球',
    desc: '圆滚滚的大眼睛英短银渐层，蓬松软糯',
    url: catBritishUrl,
  },
  {
    id: 'cat-night',
    name: '静夜灵眸猫',
    tag: '神秘夜行',
    desc: '神秘深邃的灵动夜猫，夜间观影沉浸感拉满',
    url: catNightUrl,
  },
  {
    id: 'cat-blossom',
    name: '樱粉萌球球',
    tag: '樱花烂漫',
    desc: '软萌粉嫩的小奶猫，宛如春日飘落的粉樱',
    url: catBlossomUrl,
  },
];

/**
 * Resolves wallpaper image setting to a valid display URL.
 * Handles both preset IDs ('cat-orange'), bundled URLs, and user data/http URLs.
 */
export function resolveWallpaperUrl(customBgImage?: string): string {
  if (!customBgImage) return '';
  const preset = CAT_WALLPAPERS.find(
    (wp) => wp.id === customBgImage || wp.url === customBgImage
  );
  if (preset) {
    return preset.url;
  }
  return customBgImage;
}

/**
 * 4-toe Cute Cat Paw Icon
 */
export const CatPawIcon: React.FC<{
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ size = 18, color = 'currentColor', className = '', style = {} }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Main Palm Pad */}
      <path
        d="M12 11.5C9.5 11.5 7.8 13.8 8.2 16.5C8.5 18.5 10 20 12 20C14 20 15.5 18.5 15.8 16.5C16.2 13.8 14.5 11.5 12 11.5Z"
        fill={color}
      />
      {/* Toe 1 - Left Outer */}
      <ellipse cx="6.5" cy="11.5" rx="2" ry="2.6" transform="rotate(-20 6.5 11.5)" fill={color} />
      {/* Toe 2 - Left Inner */}
      <ellipse cx="10" cy="7.8" rx="2.1" ry="2.7" transform="rotate(-6 10 7.8)" fill={color} />
      {/* Toe 3 - Right Inner */}
      <ellipse cx="14" cy="7.8" rx="2.1" ry="2.7" transform="rotate(6 14 7.8)" fill={color} />
      {/* Toe 4 - Right Outer */}
      <ellipse cx="17.5" cy="11.5" rx="2" ry="2.6" transform="rotate(20 17.5 11.5)" fill={color} />
    </svg>
  );
};

/**
 * Adorable Sleeping / Curled Kitty SVG Illustration
 */
export const CatSleepingIllustration: React.FC<{
  size?: number;
  style?: React.CSSProperties;
}> = ({ size = 64, style = {} }) => {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', ...style }}
    >
      {/* Shadow */}
      <ellipse cx="60" cy="80" rx="46" ry="7" fill="rgba(0,0,0,0.12)" />

      {/* Cat Body (Curled) */}
      <path
        d="M25 60C25 42 42 28 65 28C88 28 100 42 100 60C100 74 85 78 65 78C40 78 25 72 25 60Z"
        fill="#F4A261"
      />
      {/* Lighter belly patch */}
      <path
        d="M45 62C45 52 56 46 68 46C78 46 84 52 84 62C84 70 74 74 65 74C52 74 45 69 45 62Z"
        fill="#FFE8D6"
      />

      {/* Cat Tail curled around */}
      <path
        d="M95 56C105 52 112 60 110 68C108 76 96 78 86 76"
        stroke="#E76F51"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="86" cy="76" r="3.5" fill="#FFE8D6" />

      {/* Head */}
      <ellipse cx="40" cy="48" rx="20" ry="18" fill="#F4A261" />

      {/* Left Ear */}
      <polygon points="26,38 32,18 42,32" fill="#F4A261" stroke="#E76F51" strokeWidth="1.5" />
      <polygon points="29,36 33,23 39,32" fill="#FFB4A2" />

      {/* Right Ear */}
      <polygon points="40,32 50,18 56,38" fill="#F4A261" stroke="#E76F51" strokeWidth="1.5" />
      <polygon points="43,32 49,23 53,36" fill="#FFB4A2" />

      {/* Sleeping Eyes (Happy curves) */}
      <path
        d="M28 50C31 53 34 53 37 50"
        stroke="#4A3B32"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M43 50C46 53 49 53 52 50"
        stroke="#4A3B32"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Pink Cute Nose */}
      <polygon points="39,55 41,55 40,57" fill="#E76F51" />

      {/* Cute Mouth */}
      <path
        d="M37 58C39 60 40 59 40 57C40 59 41 60 43 58"
        stroke="#4A3B32"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Soft Pink Cheeks */}
      <ellipse cx="27" cy="54" rx="4" ry="2.5" fill="#FFB4A2" opacity="0.75" />
      <ellipse cx="53" cy="54" rx="4" ry="2.5" fill="#FFB4A2" opacity="0.75" />

      {/* Whisker details */}
      <path d="M22 53L14 51" stroke="#E76F51" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M22 56L15 58" stroke="#E76F51" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M58 53L66 51" stroke="#E76F51" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M58 56L65 58" stroke="#E76F51" strokeWidth="1.2" strokeLinecap="round" />

      {/* Fur Stripes */}
      <path d="M60 30L62 38" stroke="#E76F51" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 32L73 40" stroke="#E76F51" strokeWidth="2" strokeLinecap="round" />
      <path d="M84 37L83 45" stroke="#E76F51" strokeWidth="2" strokeLinecap="round" />

      {/* Floating Zzz */}
      <text
        x="68"
        y="24"
        fill="#FF758F"
        fontSize="12"
        fontWeight="bold"
        fontFamily="sans-serif"
        style={{ animation: 'floatZ 2.4s ease-in-out infinite' }}
      >
        z
      </text>
      <text
        x="78"
        y="14"
        fill="#FF758F"
        fontSize="15"
        fontWeight="bold"
        fontFamily="sans-serif"
        opacity="0.85"
        style={{ animation: 'floatZ 2.4s ease-in-out infinite 0.8s' }}
      >
        Z
      </text>
    </svg>
  );
};

/**
 * Interactive Sidebar Cat Companion Widget
 */
export const CatCompanionWidget: React.FC<{
  collapsed: boolean;
  theme?: string;
}> = ({ collapsed, theme = 'cat' }) => {
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const isCatTheme = theme === 'cat';

  const CAT_QUOTES = [
    '喵呜~ 主人好！ฅ^•ﻌ•^ฅ',
    '摸摸猫头，烦恼全消~ 🐾',
    '呼噜呼噜... 陪你一起看视频~',
    '看视频累了记得揉揉眼睛喵~',
    '按 Esc 可以随时退出全屏喵！',
    '三栖聚合看视频超爽的喵~ (🐾)',
    '最喜欢主人了！蹭蹭~ ✨',
  ];

  const handlePetCat = () => {
    setBubbleIndex((prev) => (prev + 1) % CAT_QUOTES.length);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1200);
  };

  if (collapsed) {
    return (
      <div
        onClick={handlePetCat}
        title={CAT_QUOTES[bubbleIndex]}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 0',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-surface)',
            border: '1.5px solid var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform var(--transition-fast)',
          }}
          className="hover-btn"
        >
          <CatPawIcon size={20} color="var(--accent-primary)" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handlePetCat}
      style={{
        margin: '6px 10px',
        padding: '10px 12px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-surface)',
        border: isCatTheme ? '1px solid rgba(255, 117, 143, 0.35)' : '1px solid var(--border-subtle)',
        boxShadow: isCatTheme ? '0 0 12px rgba(255, 117, 143, 0.25)' : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        position: 'relative',
        userSelect: 'none',
        transition: 'all var(--transition-fast)',
      }}
      className="cat-companion-card"
    >
      {/* Speech Bubble */}
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 10px',
          fontSize: '11px',
          color: 'var(--text-primary)',
          fontWeight: 500,
          textAlign: 'center',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          position: 'relative',
          lineHeight: '1.4',
        }}
      >
        {CAT_QUOTES[bubbleIndex]}
        {showHeart && (
          <span
            style={{
              position: 'absolute',
              top: '-8px',
              right: '8px',
              fontSize: '14px',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            💖
          </span>
        )}
      </div>

      {/* Sleeping Cat SVG */}
      <div style={{ transform: 'scale(0.95)', margin: '-2px 0' }}>
        <CatSleepingIllustration size={64} />
      </div>

      <div
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <CatPawIcon size={11} color="var(--accent-primary)" />
        <span>点击摸摸猫猫 (ฅ'ω'ฅ)</span>
      </div>
    </div>
  );
};
