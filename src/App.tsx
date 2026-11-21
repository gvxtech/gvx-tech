import { useCallback, useEffect, useRef, useState } from 'react';
import { NAV_PAGES, type PageId } from './types/navigation';
import { AmbientBackground } from './components/AmbientBackground';
import { CustomCursor } from './components/CustomCursor';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { IndustriesSection } from './components/IndustriesSection';
import { ProjectsSection } from './components/ProjectsSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';

const VALID_PAGES = new Set<PageId>(NAV_PAGES.map((p) => p.id));

function getInitialPage(): PageId {
  const hash = window.location.hash.replace('#', '') as PageId;
  return VALID_PAGES.has(hash) ? hash : 'home';
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>(getInitialPage);
  const [isLeaving, setIsLeaving] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);
  const [prefillSubject, setPrefillSubject] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const navigateTo = useCallback(
    (nextPage: PageId, topic?: string) => {
      if (topic) {
        setPrefillSubject(topic);
      }

      if (nextPage === activePage) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setActivePage(nextPage);
        setTransitionKey((k) => k + 1);
        window.history.pushState(null, '', `#${nextPage}`);
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      setIsLeaving(true);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        setActivePage(nextPage);
        setTransitionKey((k) => k + 1);
        setIsLeaving(false);
        window.history.pushState(null, '', `#${nextPage}`);
        window.scrollTo({ top: 0, behavior: 'auto' });
      }, 170);
    },
    [activePage]
  );

  useEffect(() => {
    const onHashChange = () => {
      const target = window.location.hash.replace('#', '') as PageId;
      if (VALID_PAGES.has(target) && target !== activePage) {
        setActivePage(target);
        setTransitionKey((k) => k + 1);
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [activePage]);

  return (
    <div className="relative min-h-screen flex flex-col bg-white text-[#101114]">
      <AmbientBackground />
      <CustomCursor />

      {/* Subtle 2px page-transition progress bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-[60] h-[2px] bg-gradient-to-r from-[#041436] via-[#1677FF] to-[#00B8FF] origin-left transition-transform duration-200 ease-out pointer-events-none ${
          isLeaving ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
        }`}
        aria-hidden="true"
      />

      <Header activePage={activePage} onNavigate={(page) => navigateTo(page)} />

      <main
        key={transitionKey}
        className={`relative z-20 flex-1 transition-[opacity,transform] duration-[170ms] ease-out ${
          isLeaving ? 'opacity-0 -translate-y-2' : 'page-enter opacity-100 translate-y-0'
        }`}
      >
        {activePage === 'home' && (
          <HeroSection onNavigate={(page, topic) => navigateTo(page, topic)} />
        )}
        {activePage === 'services' && (
          <ServicesSection onSelectService={(serviceTitle) => navigateTo('contact', serviceTitle)} />
        )}
        {activePage === 'solutions' && (
          <IndustriesSection onExploreContact={(sector) => navigateTo('contact', sector)} />
        )}
        {activePage === 'projects' && (
          <ProjectsSection onInquireProject={(projectTitle) => navigateTo('contact', projectTitle)} />
        )}
        {activePage === 'about' && (
          <AboutSection onStartProject={() => navigateTo('contact')} />
        )}
        {activePage === 'contact' && (
          <ContactSection
            prefillSubject={prefillSubject}
            onClearPrefill={() => setPrefillSubject(null)}
          />
        )}
      </main>

      <Footer onNavigate={(page) => navigateTo(page)} />
    </div>
  );
}
