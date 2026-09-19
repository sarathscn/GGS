import { Link } from 'react-router-dom';

/**
 * Official GGS Gaming Logo Component
 * Uses the authentic Game Gear Swap pixel art joystick controller logo.
 * 
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 * @param {boolean} showText - Whether to render text beside logo mark
 * @param {boolean} asLink - Whether to wrap inside a Link to home
 * @param {string} className - Additional CSS classes
 * @param {string} textClassName - Custom classes for branding text
 */
export default function Logo({
  size = 'md',
  showText = true,
  asLink = true,
  className = '',
  textClassName = '',
  imgClassName = ''
}) {
  const sizeMap = {
    xs: { box: 'w-7 h-7', text: 'text-sm' },
    sm: { box: 'w-8 h-8', text: 'text-base' },
    md: { box: 'w-9 h-9 sm:w-10 sm:h-10', text: 'text-base sm:text-lg md:text-xl' },
    lg: { box: 'w-12 h-12 sm:w-14 sm:h-14', text: 'text-xl sm:text-2xl' },
    xl: { box: 'w-20 h-20 sm:w-24 sm:h-24', text: 'text-2xl sm:text-3xl' },
    '2xl': { box: 'w-32 h-32 sm:w-40 sm:h-40', text: 'text-3xl sm:text-4xl' }
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Pixel Art Logo Mark Container */}
      <div 
        className={`${selectedSize.box} rounded-xl overflow-hidden bg-white/95 dark:bg-zinc-900 border border-violet-500/20 shadow-sm flex items-center justify-center p-0.5 shrink-0 group-hover:scale-105 group-hover:border-violet-500/40 transition-all duration-300 ${imgClassName}`}
      >
        <img
          src="/ggs-logo.jpg"
          alt="GGS Game Gear Swap"
          className="w-full h-full object-contain rounded-lg"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span className={`font-black tracking-tight leading-none truncate ${selectedSize.text} ${textClassName}`}>
            <span className="rgb-gradient-text">
              GAME GEAR SWAP
            </span>
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-widest uppercase mt-0.5">
            Kerala's Gaming Marketplace
          </span>
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link to="/" className="inline-flex items-center no-underline" data-testid="ggs-main-logo">
        {content}
      </Link>
    );
  }

  return content;
}
