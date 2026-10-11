import React from 'react';

interface NigerianFlagProps {
  className?: string;
  variant?: 'hero' | 'banner' | 'card' | 'badge';
  interactive?: boolean;
}

/**
 * High-quality Nigerian National Flag Component
 * Proportions: Official 1:2 ratio (width is twice the height)
 * Colors: Nigerian Green (#008751), Pure White (#FFFFFF), Nigerian Green (#008751)
 * Three equal vertical sections with smooth animation, rounded edges, and ambient emerald glow.
 */
export const NigerianFlag: React.FC<NigerianFlagProps> = ({
  className = '',
  variant = 'hero',
  interactive = false
}) => {
  if (variant === 'hero') {
    return (
      <div className={`relative mx-auto w-full max-w-2xl group animate-flag-float ${className}`}>
        {/* Ambient Emerald Glow Backdrop */}
        <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-[#008751]/25 via-[#008751]/15 to-[#008751]/25 rounded-3xl blur-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* Flag Card Container with Official 1:2 / 2:1 Proportions */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white ring-1 ring-slate-900/10 aspect-[2/1] flex transition-transform duration-500 group-hover:scale-[1.01]">
          {/* Section 1: Nigerian Green (Left 1/3) */}
          <div className="w-1/3 h-full bg-[#008751] relative overflow-hidden">
            {/* Subtle fabric depth shading */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-white/10 opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20" />
          </div>

          {/* Section 2: Pure White (Center 1/3) */}
          <div className="w-1/3 h-full bg-[#FFFFFF] relative overflow-hidden flex flex-col items-center justify-center">
            {/* Subtle depth gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-200/50 via-white to-slate-200/50" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-100/40 via-transparent to-slate-200/40" />

            {/* Tasteful subtle watermark crest */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-2 select-none pointer-events-none opacity-85">
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#008751] uppercase">
                NIGERIA
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Unity & Faith
              </span>
            </div>
          </div>

          {/* Section 3: Nigerian Green (Right 1/3) */}
          <div className="w-1/3 h-full bg-[#008751] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/20 opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20" />
          </div>

          {/* Flowing Silk Ripple & Shimmer Wave Animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-flag-shimmer opacity-80 mix-blend-overlay" />
          </div>

          {/* Top Silk Sheen */}
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`relative w-full rounded-2xl overflow-hidden shadow-md border-2 border-white aspect-[21/9] sm:aspect-[2/1] flex ${className}`}>
        {/* Left Green */}
        <div className="w-1/3 h-full bg-[#008751] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-black/15" />
        </div>
        {/* Center White */}
        <div className="w-1/3 h-full bg-[#FFFFFF] relative flex flex-col items-center justify-center select-none">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-white to-slate-100" />
          <span className="relative z-10 text-[10px] font-black tracking-widest text-[#008751] uppercase">
            NAIJA
          </span>
        </div>
        {/* Right Green */}
        <div className="w-1/3 h-full bg-[#008751] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-black/15" />
        </div>
        {/* Subtle Silk Sheen */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent animate-flag-shimmer opacity-70" />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`relative rounded-xl overflow-hidden shadow-sm border border-slate-200 aspect-[2/1] flex ${className}`}>
        <div className="w-1/3 h-full bg-[#008751]" />
        <div className="w-1/3 h-full bg-[#FFFFFF]" />
        <div className="w-1/3 h-full bg-[#008751]" />
      </div>
    );
  }

  // Badge variant
  return (
    <div className={`inline-flex rounded-md overflow-hidden border border-slate-200 shadow-2xs h-5 w-8 shrink-0 ${className}`}>
      <div className="w-1/3 h-full bg-[#008751]" />
      <div className="w-1/3 h-full bg-[#FFFFFF]" />
      <div className="w-1/3 h-full bg-[#008751]" />
    </div>
  );
};
