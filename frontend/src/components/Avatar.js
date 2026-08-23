import React, { useState } from 'react';
import { User } from 'lucide-react';

/**
 * Universal Avatar Component
 * 
 * Supports:
 * 1. Uploaded/Processed Image Avatars (WebP, JPG, PNG, Data URLs)
 * 2. PC & Component-Themed Emoji Avatars (e.g. 🎮, 🖥️, 💻, ⌨️, 🕹️)
 * 3. Gradient themes and fallback states (User initial or Lucide User icon)
 */

// Helper to check if a string is an emoji or emoji descriptor
export const isEmojiAvatar = (str) => {
  if (!str || typeof str !== 'string') return false;
  if (str.startsWith('emoji:')) return true;
  // If it starts with http, https, /api, /, blob:, data:image, it's an image URL
  if (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('/api') ||
    str.startsWith('/') ||
    str.startsWith('blob:') ||
    str.startsWith('data:image')
  ) {
    return false;
  }
  // Check if string contains emoji characters
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  return emojiRegex.test(str);
};

// Parse emoji and optional background from string like "emoji:🎮:gradient-violet" or plain "🎮"
export const parseEmojiAvatar = (str) => {
  if (!str) return { emoji: '🎮', bgClass: 'from-violet-600/30 to-indigo-600/30 border-violet-500/40 text-violet-300' };
  if (str.startsWith('emoji:')) {
    const parts = str.split(':');
    return {
      emoji: parts[1] || '🎮',
      bgClass: parts[2] || 'from-violet-600/30 to-indigo-600/30 border-violet-500/40 text-violet-300'
    };
  }
  return {
    emoji: str,
    bgClass: 'from-violet-600/30 to-indigo-600/30 border-violet-500/40 text-violet-300'
  };
};

const SIZE_MAP = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-16 h-16 text-2xl',
  '2xl': 'w-24 h-24 text-4xl',
  '3xl': 'w-28 h-28 text-5xl',
  '4xl': 'w-36 h-36 text-6xl'
};

const ICON_SIZE_MAP = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-7 h-7',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
  '4xl': 'w-16 h-16'
};

export default function Avatar({
  src,
  alt = 'Avatar',
  name = '',
  size = 'md',
  className = '',
  iconClassName = '',
  interactive = false,
  onClick,
  dataTestId,
  ...props
}) {
  const [imageError, setImageError] = useState(false);

  const sizeClass = SIZE_MAP[size] || size;
  const iconSizeClass = ICON_SIZE_MAP[size] || 'w-4 h-4';

  const isEmoji = !imageError && isEmojiAvatar(src);
  const isImage = !imageError && src && !isEmoji;

  const baseClasses = `relative rounded-full flex items-center justify-center overflow-hidden shrink-0 select-none ${
    interactive ? 'hover:scale-105 transition-transform cursor-pointer' : ''
  } ${sizeClass} ${className}`;

  // 1. Emoji Avatar
  if (isEmoji) {
    const { emoji, bgClass } = parseEmojiAvatar(src);
    return (
      <div
        className={`${baseClasses} bg-gradient-to-br ${bgClass} border border-violet-500/30 shadow-inner`}
        onClick={onClick}
        data-testid={dataTestId || 'avatar-emoji'}
        aria-label={alt || `${name} avatar`}
        role="img"
        {...props}
      >
        <span className="leading-none transform transition-transform duration-200 pointer-events-none drop-shadow-sm">
          {emoji}
        </span>
      </div>
    );
  }

  // 2. Image Avatar
  if (isImage) {
    return (
      <div
        className={`${baseClasses} bg-violet-600/10 border border-violet-500/20`}
        onClick={onClick}
        data-testid={dataTestId || 'avatar-image'}
        {...props}
      >
        <img
          src={src}
          alt={alt || name || 'Profile'}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Fallback (User Initial or Lucide User Icon)
  const initial = name ? name.trim().charAt(0).toUpperCase() : null;

  return (
    <div
      className={`${baseClasses} bg-violet-600/10 border border-violet-500/20 text-violet-500 font-bold`}
      onClick={onClick}
      data-testid={dataTestId || 'avatar-fallback'}
      aria-label={alt || `${name} avatar`}
      {...props}
    >
      {initial ? (
        <span className="font-semibold">{initial}</span>
      ) : (
        <User className={`${iconSizeClass} ${iconClassName} text-violet-500`} />
      )}
    </div>
  );
}
