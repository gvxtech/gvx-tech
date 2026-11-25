import { useState } from 'react';
import logo from '../../public/assets/gvx-logo-transparent.png';

interface LogoMarkProps {
  size?: 'header' | 'footer';
  className?: string;
}

export function LogoMark({ size = 'header', className = '' }: LogoMarkProps) {
  const [imgError, setImgError] = useState(false);

  const heightClass = size === 'footer' ? 'h-12 sm:h-14' : 'h-9 sm:h-10';

  if (imgError) {
    return (
      <span className={`font-display text-lg font-bold tracking-[-0.03em] text-white whitespace-nowrap shrink-0 ${className}`}>
        GVX <span className="text-[#1677FF]">TECH</span>
      </span>
    );
  }

  return (
    <img
      src={logo}
      alt="GVX TECH — Build, Automate, Scale"
      onError={() => setImgError(true)}
      className={`h-10 md:h-12 lg:h-16 w-auto object-contain bg-transparent select-none shrink-0 ${className}`}
      draggable={false}
    />
  );
}