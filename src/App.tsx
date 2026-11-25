import { useCallback, useEffect, useRef, useState } from 'react';

import { NAV_PAGES, type PageId } from './types/navigation';

import { AmbientBackground } from './components/AmbientBackground';
import { CustomCursor } from './components/CustomCursor';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { IndustriesSection } from './components/IndustriesSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';

import FloatingContact from './components/FloatingContact';
import { Footer } from './components/Footer';

// Service Detail Components
import WebsiteDevelopment from './components/services/WebsiteDevelopment';
import WebApplicationDevelopment from './components/services/WebApplicationDevelopment';
import MobileApplicationDevelopment from './components/services/MobileApplicationDevelopment';
import SEODigitalMarketing from './components/services/SEODigitalMarketing';
import BusinessAutomation from './components/services/BusinessAutomation';

// --------------------------------------------------
// PAGE TYPES
// --------------------------------------------------

const SERVICE_PAGES = [
  'website-development',
  'web-application-development',
  'mobile-application-development',
  'seo-digital-marketing',
  'business-automation',
] as const;

type ServicePageId = (typeof SERVICE_PAGES)[number];

type AppPage = PageId | ServicePageId;

// --------------------------------------------------
// VALID PAGES
// --------------------------------------------------

const VALID_PAGES = new Set<string>([
  ...NAV_PAGES.map((page) => page.id),
  ...SERVICE_PAGES,
]);

function getInitialPage(): AppPage {
  const hash = window.location.hash.replace('#', '');

  return VALID_PAGES.has(hash) ? (hash as AppPage) : 'home';
}

// --------------------------------------------------
// APPLICATION
// --------------------------------------------------

export default function App() {

  const [activePage, setActivePage] = useState<AppPage>(getInitialPage);

  const [isLeaving, setIsLeaving] = useState(false);

  const [transitionKey, setTransitionKey] = useState(0);

  const [prefillSubject, setPrefillSubject] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  // --------------------------------------------------
  // NAVIGATION FUNCTION
  // --------------------------------------------------

  const navigateTo = useCallback(
    (nextPage: AppPage, topic?: string) => {

      if (topic) {
        setPrefillSubject(topic);
      }

      if (nextPage === activePage) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        return;
      }

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (prefersReduced) {

        setActivePage(nextPage);

        setTransitionKey((k) => k + 1);

        window.history.pushState(null, '', `#${nextPage}`);

        window.scrollTo({
          top: 0,
          behavior: 'auto',
        });

        return;
      }

      setIsLeaving(true);

      timerRef.current = window.setTimeout(() => {

        timerRef.current = null;

        setActivePage(nextPage);

        setTransitionKey((k) => k + 1);

        setIsLeaving(false);

        window.history.pushState(null, '', `#${nextPage}`);

        window.scrollTo({
          top: 0,
          behavior: 'auto',
        });

      }, 170);

    },
    [activePage]
  );

  // --------------------------------------------------
  // HASH CHANGE LISTENER
  // --------------------------------------------------

  useEffect(() => {

    const onHashChange = () => {

      const target = window.location.hash.replace('#', '');

      if (VALID_PAGES.has(target) && target !== activePage) {

        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        setIsLeaving(false);

        setActivePage(target as AppPage);

        setTransitionKey((k) => k + 1);

        window.scrollTo({
          top: 0,
          behavior: 'auto',
        });

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

  // --------------------------------------------------
  // HEADER ACTIVE PAGE
  // --------------------------------------------------

  const headerPage: PageId = SERVICE_PAGES.includes(
    activePage as ServicePageId
  )
    ? 'services'
    : (activePage as PageId);

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (

    <div className="relative min-h-screen flex flex-col bg-white text-[#101114]">

      <AmbientBackground />

      <CustomCursor />

      {/* Page Transition Progress Bar */}

      <div
        className={`fixed top-0 left-0 right-0 z-[60] h-[2px] bg-gradient-to-r from-[#041436] via-[#1677FF] to-[#00B8FF] origin-left transition-transform duration-200 ease-out pointer-events-none ${
          isLeaving
            ? 'scale-x-100 opacity-100'
            : 'scale-x-0 opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Header */}

      <Header
        activePage={headerPage}
        onNavigate={(page) => navigateTo(page)}
      />

      {/* Main Content */}

      <main
        key={transitionKey}
        className={`relative z-20 flex-1 transition-[opacity,transform] duration-[170ms] ease-out ${
          isLeaving
            ? 'opacity-0 -translate-y-2'
            : 'page-enter opacity-100 translate-y-0'
        }`}
      >

        {/* HOME */}

        {activePage === 'home' && (

          <HeroSection
            onNavigate={(page, topic) => navigateTo(page, topic)}
          />

        )}

        {/* SERVICES */}

       {activePage === 'services' && (
  <ServicesSection
    onSelectService={(servicePage) =>
      navigateTo(servicePage as AppPage)
    }
  />
)}

        {/* SERVICE DETAILS */}

        {activePage === 'website-development' && (

          <WebsiteDevelopment />

        )}

        {activePage === 'web-application-development' && (

          <WebApplicationDevelopment />

        )}

        {activePage === 'mobile-application-development' && (

          <MobileApplicationDevelopment />

        )}

        {activePage === 'seo-digital-marketing' && (

          <SEODigitalMarketing />

        )}

        {activePage === 'business-automation' && (

          <BusinessAutomation />

        )}

        {/* SOLUTIONS */}

        {activePage === 'solutions' && (

          <IndustriesSection
            onExploreContact={(sector) => navigateTo('contact', sector)}
          />

        )}

        {/* ABOUT */}

        {activePage === 'about' && (

          <AboutSection
            onStartProject={() => navigateTo('contact')}
          />

        )}

        {/* CONTACT */}

        {activePage === 'contact' && (

          <ContactSection
            prefillSubject={prefillSubject}
            onClearPrefill={() => setPrefillSubject(null)}
          />

        )}

      </main>

      {/* Footer */}

      <Footer
        onNavigate={(page) => navigateTo(page)}
      />

      {/* Floating Contact */}

      <FloatingContact />

    </div>

  );
}