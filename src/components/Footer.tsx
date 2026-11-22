import { NAV_PAGES, type PageId } from '../types/navigation';
import { LogoMark } from './LogoMark';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="relative z-20 bg-white dark:bg-black border-t border-[#E8EBF0] dark:border-white/10 py-14 transition-colors duration-300">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">

        {/* Top Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-[#E8EBF0] dark:border-white/10">

          {/* Logo & Description */}
          <div>
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
              }}
              aria-label="GVX TECH Home"
              className="inline-block"
            >
              <LogoMark size="footer" />
            </a>

            <p className="mt-3 text-sm text-[#777B84] dark:text-gray-400 transition-colors duration-300">
              Transforming Ideas Into Digital Experiences.
            </p>
          </div>

          {/* Footer Navigation */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-7 gap-y-3"
          >
            {NAV_PAGES.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.id);
                }}
                className="text-sm text-[#777B84] dark:text-gray-400 hover:text-[#101114] dark:hover:text-white transition-colors duration-300 whitespace-nowrap shrink-0"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* Copyright */}
          <p className="text-xs text-[#777B84] dark:text-gray-500 transition-colors duration-300">
            © 2026 GVX TECH. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-2 text-[#777B84] dark:text-gray-400">

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GVX TECH on LinkedIn"
              className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#0A66C2] hover:bg-[#E8F4FF] dark:hover:bg-white/10 hover:shadow-md"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
              className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:shadow-md"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
              className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#1877F2] hover:bg-[#EAF3FF] dark:hover:bg-white/10 hover:shadow-md"
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
              className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#E1306C] hover:bg-[#FFF0F5] dark:hover:bg-white/10 hover:shadow-md"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
              className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#FF0000] hover:bg-[#FFF0F0] dark:hover:bg-white/10 hover:shadow-md"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12a31 31 0 0 0-.5-4.8zM9.5 15.5v-7l6 3.5-6 3.5z" />
              </svg>
            </a>

          </div>
        </div>
      </div>
    </footer>
  );
}