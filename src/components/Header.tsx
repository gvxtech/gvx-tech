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

        {/* Zone 2: Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7"
        >
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

        {/* Zone 3: CTA + Social Icons + Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Let's Talk */}
          <MagneticButton
            onClick={() => handleLinkClick('contact')}
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Let’s Talk
          </MagneticButton>

          {/* Social Icons */}
          <div className="hidden lg:flex items-center gap-2 text-[#777B84]">

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GVX TECH on LinkedIn"
              className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#0A66C2] hover:bg-[#E8F4FF] hover:shadow-md"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>

            {/* X */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GVX TECH on X"
              className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-black hover:bg-gray-100 hover:shadow-md"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l16 16" />
                <path d="M20 4L4 20" />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GVX TECH on Facebook"
              className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#1877F2] hover:bg-[#EAF3FF] hover:shadow-md"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V5c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H8v3h2.1v8h3.4z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GVX TECH on Instagram"
              className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#E1306C] hover:bg-[#FFF0F5] hover:shadow-md"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GVX TECH on YouTube"
              className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#FF0000] hover:bg-[#FFF0F0] hover:shadow-md"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12a31 31 0 0 0-.5-4.8zM9.5 15.5v-7l6 3.5-6 3.5z" />
              </svg>
            </a>

          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden items-center justify-center w-10 h-10 rounded-lg border border-[#E8EBF0] bg-white text-[#101114] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            )}
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
                    isActive
                      ? 'text-[#1677FF]'
                      : 'text-[#101114] hover:text-[#1677FF]'
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