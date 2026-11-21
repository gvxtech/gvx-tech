import { useState } from 'react';

interface LogoMarkProps {
  size?: 'header' | 'footer';
  className?: string;
}

export function LogoMark({ size = 'header', className = '' }: LogoMarkProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <span className={`font-display text-lg font-bold tracking-[-0.03em] text-[#101114] whitespace-nowrap shrink-0 ${className}`}>
        GVX <span className="text-[#1677FF]">TECH</span>
      </span>
    );
  }

  const heightClass = size === 'footer' ? 'h-12 sm:h-14' : 'h-9 sm:h-10';

  return (
    <img
      src="/assets/gvx-logo-transparent.png"
      alt="GVX TECH — Build, Automate, Scale"
      onError={() => setImgError(true)}
      className={`${heightClass} w-auto object-contain bg-transparent select-none shrink-0 ${className}`}
      draggable={false}
    />
  );
}
