import { useRef, type ReactNode, type MouseEvent } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function MagneticButton({
  children,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ariaLabel,
}: MagneticButtonProps) {
  const elRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = elRef.current;
    if (!el || disabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.16;
    el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
  };

  const handleMouseLeave = () => {
    const el = elRef.current;
    if (!el) return;
    el.style.transform = 'translate3d(0px, 0px, 0)';
  };

  const baseStyles =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 font-medium rounded-lg transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2';

  const variantStyles =
    variant === 'primary'
      ? 'bg-[#1677FF] text-white hover:bg-[#0958D9] shadow-[0_1px_2px_rgba(16,17,20,0.08)]'
      : 'bg-white text-[#101114] border border-[#E8EBF0] hover:border-[#101114]/30 hover:bg-[#F5F7FA]';

  const sizeStyles =
    size === 'sm' ? 'px-4 py-2 text-xs min-h-[38px]' : 'px-6 py-3 text-sm min-h-[44px]';

  const combined = `${baseStyles} ${variantStyles} ${sizeStyles} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`;

  if (href) {
    return (
      <a
        ref={elRef}
        href={href}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel}
        className={combined}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={elRef}
      type={type}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      aria-label={ariaLabel}
      className={combined}
    >
      {children}
    </button>
  );
}
