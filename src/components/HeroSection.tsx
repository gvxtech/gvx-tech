import { useRef, type MouseEvent } from 'react';
import { ArrowRight, ArrowUpRight,Globe,
  Layers,
  Smartphone,
  TrendingUp,
  Workflow,Sparkles, Building2, Handshake  } from 'lucide-react';
  import type { LucideIcon } from 'lucide-react';

import { PROJECTS } from '../data/agencyData';
import type { PageId } from '../types/navigation';
import { MagneticButton } from './MagneticButton';
import FloatingTechIcons from './FloatingTechIcons';
import SEO from '../seo/SEO';

interface HeroSectionProps {
  onNavigate: (page: PageId, topic?: string) => void;
}

const HOME_INDEX_CARDS: {
  icon: LucideIcon;
  title: string;
  summary: string;
  cta: string;
  target: PageId;
}[] = [
  {
    icon: Sparkles,
    title: 'What We Create',
    summary: 'Websites, web applications, mobile platforms, SEO, and business automation.',
    cta: 'Explore Services',
    target: 'services',
  },
  {
    icon: Building2,
    title: 'Industry Solutions',
    summary: 'Tailored software architecture for healthcare, hospitality, retail, and SMBs.',
    cta: 'View Solutions',
    target: 'solutions',
  },
  {
    icon: Handshake,
    title: 'Let’s Build Together',
    summary: 'Have an idea, challenge, or business goal? Let’s turn it into a digital solution.',
    cta: 'Start a Project',
    target: 'contact',
  },
];

function updateSpotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const featuredWorks = PROJECTS.slice(0, 2);

  return (
    <>
    <SEO
  title="GVX TECH | Web Development & Digital Solutions"
  description="GVX TECH delivers innovative web development, custom software, mobile apps, digital marketing and business automation solutions for businesses worldwide."
  url="https://gvxtech.com/"
/>
    
    <section
      ref={heroRef}
      className="relative pt-28 pb-0 lg:pt-36 lg:pb-0 bg-transparent dark:bg-transparent overflow-hidden transition-colors duration-300"
    >
      <div className="relative z-10 mx-auto max-w-[1240px] px-6 lg:px-10">

        {/* Expressive Typographic Statement */}
        <div className="max-w-[1020px]">
          <p
            className="stagger-item font-mono text-xs uppercase tracking-[0.18em] text-[#777B84] dark:text-gray-400 mb-6"
            style={{ animationDelay: '30ms' }}
          >
            Digital Technology · Creative Engineering
          </p>

          <h1
            className="stagger-item font-display font-bold tracking-[-0.045em] text-[#101114] dark:text-white leading-[0.95]"
            style={{
              fontSize: 'clamp(3.25rem, 7.2vw, 6.4rem)',
              textWrap: 'balance',
              animationDelay: '80ms',
            }}
          >
            Your Business {' '}
            <span className="gvx-gradient-text dark:text-white dark:bg-none">
                Reimagined for the Digital World
              </span>
            {/* <span className="gvx-gradient-text italic font-semibold tracking-[-0.035em] pr-1 dark:bg-none dark:text-white dark:[-webkit-text-fill-color:white]">
              
            </span> */}
          </h1>

          <div
            className="stagger-item mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end"
            style={{ animationDelay: '140ms' }}
          >
            <p className="lg:col-span-7 text-lg sm:text-xl text-[#777B84] dark:text-gray-400 leading-[1.6] max-w-[46ch]">
              We design powerful websites, intelligent web applications and digital solutions that help businesses operate smarter,
               connect better and grow faster.
            </p>

            <div className="lg:col-span-5 flex flex-wrap items-center lg:justify-end gap-4">
              <MagneticButton onClick={() => onNavigate('services')} variant="primary" size="md">
                Explore Our services
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </MagneticButton>

              <MagneticButton onClick={() => onNavigate('contact')} variant="secondary" size="md">
                 Let's Build Together
              </MagneticButton>
            </div>
          </div>
        </div>

       {/* Hairline Editorial Index Strip */}
<div
  className="stagger-item mt-20 pt-12 border-t border-[#E8EBF0] dark:border-[#262626] grid grid-cols-1 md:grid-cols-3 gap-6"
  style={{ animationDelay: '200ms' }}
>
  {HOME_INDEX_CARDS.map((item) => (
    <button
      key={item.title}
      type="button"
      onClick={() => onNavigate(item.target)}
      onMouseMove={updateSpotlight}
      className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white dark:bg-[#111111] dark:border-[#262626] hover:border-[#1677FF]/45 dark:hover:border-[#404040] p-7 flex flex-col justify-between transition-[border-color,transform,box-shadow,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,17,20,0.04)] dark:hover:bg-[#1A1A1A] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
    >
      <div>
        {/* Icon */}
        <item.icon
          className="w-7 h-7 text-[#1677FF] transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6"
          strokeWidth={1.6}
        />

        {/* Title */}
        <h2 className="mt-5 font-display text-xl font-semibold tracking-tight text-[#101114] dark:text-white group-hover:text-[#1677FF] transition-colors duration-200">
          {item.title}
        </h2>

        {/* Description */}
        <p className="mt-3 text-sm font-normal text-[#777B84] dark:text-gray-400 leading-6">
          {item.summary}
        </p>
      </div>

      {/* CTA */}
      <span className="mt-6 pt-4 border-t border-[#E8EBF0] dark:border-[#262626] inline-flex items-center justify-between text-xs font-medium text-[#101114] dark:text-white group-hover:text-[#1677FF] transition-colors">
        <span>{item.cta}</span>

        <ArrowUpRight
          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
          strokeWidth={1.75}
        />
      </span>
    </button>
  ))}
</div>

        {/* Curated Expertise Preview */}
        <div
          className="stagger-item mt-20 pt-14 border-t border-[#E8EBF0] dark:border-[#262626]"
          style={{ animationDelay: '260ms' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#777B84] dark:text-gray-400 mb-2">
                Our Expertise
              </p>

              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#101114] dark:text-white">
                Technology That Moves Your Business Forward
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

  {/* 01 - Website Development */}
  <div className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white dark:bg-[#111111] dark:border-[#262626] hover:border-[#1677FF]/45 dark:hover:border-[#404040] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] dark:hover:bg-[#1A1A1A] p-6">

    <Globe className="w-7 h-7 text-[#1677FF] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" strokeWidth={1.6} />

    <h3 className="mt-5 text-base font-semibold tracking-tight text-[#101114] dark:text-white">
      Website Development
    </h3>

    <p className="mt-3 text-sm font-normal leading-6 text-[#777B84] dark:text-gray-400">
      Beautiful, high-performance websites.
    </p>

    <p className="mt-4 text-xs font-medium leading-6 tracking-wide text-[#101114]/80 dark:text-gray-300">
      Editorial architecture · Sub-second edge delivery · Accessibility
    </p>
  </div>

  {/* 02 - Web Applications */}
  <div className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white dark:bg-[#111111] dark:border-[#262626] hover:border-[#1677FF]/45 dark:hover:border-[#404040] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] dark:hover:bg-[#1A1A1A] p-6">

    <Layers className="w-7 h-7 text-[#1677FF] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" strokeWidth={1.6} />

    <h3 className="mt-5 text-base font-semibold tracking-tight text-[#101114] dark:text-white">
      Web Applications
    </h3>

    <p className="mt-3 text-sm font-normal leading-6 text-[#777B84] dark:text-gray-400">
      Intelligent digital platforms for businesses.
    </p>

    <p className="mt-4 text-xs font-medium leading-6 tracking-wide text-[#101114]/80 dark:text-gray-300">
      Real-time dashboards · Role-based portals · API orchestration
    </p>
  </div>

  {/* 03 - Mobile Applications */}
  <div className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white dark:bg-[#111111] dark:border-[#262626] hover:border-[#1677FF]/45 dark:hover:border-[#404040] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] dark:hover:bg-[#1A1A1A] p-6">

    <Smartphone className="w-7 h-7 text-[#1677FF] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" strokeWidth={1.6} />

    <h3 className="mt-5 text-base font-semibold tracking-tight text-[#101114] dark:text-white">
      Mobile Applications
    </h3>

    <p className="mt-3 text-sm font-normal leading-6 text-[#777B84] dark:text-gray-400">
      Powerful mobile experiences.
    </p>

    <p className="mt-4 text-xs font-medium leading-6 tracking-wide text-[#101114]/80 dark:text-gray-300">
      iOS & Android · Gesture-first UI · Offline synchronization
    </p>
  </div>

  {/* 04 - Digital Marketing & SEO */}
  <div className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white dark:bg-[#111111] dark:border-[#262626] hover:border-[#1677FF]/45 dark:hover:border-[#404040] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] dark:hover:bg-[#1A1A1A] p-6">

    <TrendingUp className="w-7 h-7 text-[#1677FF] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" strokeWidth={1.6} />

    <h3 className="mt-5 text-base font-semibold tracking-tight text-[#101114] dark:text-white">
      Digital Marketing & SEO
    </h3>

    <p className="mt-3 text-sm font-normal leading-6 text-[#777B84] dark:text-gray-400">
      Grow your digital presence.
    </p>

    <p className="mt-4 text-xs font-medium leading-6 tracking-wide text-[#101114]/80 dark:text-gray-300">
      Technical SEO · Conversion funnels · Search visibility
    </p>
  </div>

  {/* 05 - Business Automation */}
  <div className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white dark:bg-[#111111] dark:border-[#262626] hover:border-[#1677FF]/45 dark:hover:border-[#404040] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] dark:hover:bg-[#1A1A1A] p-6">

    <Workflow className="w-7 h-7 text-[#1677FF] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" strokeWidth={1.6} />

    <h3 className="mt-5 text-base font-semibold tracking-tight text-[#101114] dark:text-white">
      Business Automation
    </h3>

    <p className="mt-3 text-sm font-normal leading-6 text-[#777B84] dark:text-gray-400">
      Smart systems that simplify operations.
    </p>

    <p className="mt-4 text-xs font-medium leading-6 tracking-wide text-[#101114]/80 dark:text-gray-300">
      CRM pipelines · Automated intake · Billing & reports
    </p>
  </div>

</div>
          
        </div>
        
      </div>
      
      <div className="mt-12 mb-0">
  <FloatingTechIcons />
</div>
    </section>
    </>
  );
}