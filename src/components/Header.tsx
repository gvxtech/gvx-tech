import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NAV_PAGES, type PageId } from '../types/navigation';
import { LogoMark } from './LogoMark';
import { MagneticButton } from './MagneticButton';

interface HeaderProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Header({ activePage, onNavigate }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLinkClick = (page: PageId) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-[background-color,border-color] duration-200 ${
        scrolled || mobileOpen
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E8EBF0]'
          : 'bg-white/80 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between gap-8 px-6 lg:px-10">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home');
          }}
          className="whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] rounded-md"
          aria-label="GVX TECH Home"
        >
          <LogoMark />
        </a>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {NAV_PAGES.map((item) => {
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 after:absolute after:left-0 after:bottom-0 after:h-[1.5px] after:bg-[#1677FF] after:transition-[width] after:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] rounded-sm ${
                  isActive
                    ? 'text-[#101114] after:w-full'
                    : 'text-[#777B84] hover:text-[#101114] after:w-0 hover:after:w-full'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Primary CTA + Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <MagneticButton
            onClick={() => handleLinkClick('contact')}
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Let’s Talk
          </MagneticButton>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden items-center justify-center w-10 h-10 rounded-lg border border-[#E8EBF0] bg-white text-[#101114] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#E8EBF0] px-6 py-5">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
            {NAV_PAGES.map((item) => {
              const isActive = activePage === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-2.5 text-base font-medium transition-colors border-b border-[#E8EBF0]/60 last:border-b-0 ${
                    isActive ? 'text-[#1677FF]' : 'text-[#101114] hover:text-[#1677FF]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-3">
              <MagneticButton
                onClick={() => handleLinkClick('contact')}
                variant="primary"
                size="md"
                className="w-full"
              >
                Let’s Talk
              </MagneticButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
