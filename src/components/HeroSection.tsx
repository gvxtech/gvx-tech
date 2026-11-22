import { useRef, type MouseEvent } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PROJECTS } from '../data/agencyData';
import type { PageId } from '../types/navigation';
import { MagneticButton } from './MagneticButton';

interface HeroSectionProps {
  onNavigate: (page: PageId, topic?: string) => void;
}

const HOME_INDEX_CARDS: {
  num: string;
  title: string;
  summary: string;
  cta: string;
  target: PageId;
}[] = [
  {
    num: '01',
    title: 'What We Create',
    summary: 'Websites, web applications, mobile platforms, SEO, and business automation.',
    cta: 'Explore Services',
    target: 'services',
  },
  {
    num: '02',
    title: 'Industry Solutions',
    summary: 'Tailored software architecture for healthcare, hospitality, retail, and SMBs.',
    cta: 'View Solutions',
    target: 'solutions',
  },
  {
  num: '05',
  title: 'Let’s Build Together',
  summary: 'Have an idea, challenge, or business goal? Let’s turn it into a digital solution.',
  cta: 'Start a Project',
  target: 'contact',
},
  // {
  //   num: '03',
  //   title: 'Selected Works',
  //   summary: 'Production platforms engineered for clarity, speed, and measurable return.',
  //   cta: 'Browse Portfolio',
  //   target: 'projects',
  // },
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
    <section
      ref={heroRef}
      className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 bg-transparent overflow-hidden"
    >
      <div className="relative z-10 mx-auto max-w-[1240px] px-6 lg:px-10">
        {/* Expressive Typographic Statement */}
        <div className="max-w-[1020px]">
          <p
            className="stagger-item font-mono text-xs uppercase tracking-[0.18em] text-[#777B84] mb-6"
            style={{ animationDelay: '30ms' }}
          >
            Digital Technology · Creative Engineering
          </p>

          <h1
            className="stagger-item font-display font-bold tracking-[-0.045em] text-[#101114] leading-[0.95]"
            style={{
              fontSize: 'clamp(3.25rem, 7.2vw, 6.4rem)',
              textWrap: 'balance',
              animationDelay: '80ms',
            }}
          >
            We build the{' '}
            <span className="gvx-gradient-text italic font-semibold tracking-[-0.035em] pr-1">
              digital future.
            </span>
          </h1>

          <div
            className="stagger-item mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end"
            style={{ animationDelay: '140ms' }}
          >
            <p className="lg:col-span-7 text-lg sm:text-xl text-[#777B84] leading-[1.6] max-w-[46ch]">
              We create intelligent digital experiences, powerful web applications and innovative
              technology solutions that help businesses grow.
            </p>

            <div className="lg:col-span-5 flex flex-wrap items-center lg:justify-end gap-4">
              <MagneticButton onClick={() => onNavigate('services')} variant="primary" size="md">
                Explore Our services
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </MagneticButton>
              <MagneticButton onClick={() => onNavigate('contact')} variant="secondary" size="md">
                Start a Project
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* Hairline Editorial Index Strip */}
        <div
          className="stagger-item mt-20 pt-12 border-t border-[#E8EBF0] grid grid-cols-1 md:grid-cols-3 gap-6"
          style={{ animationDelay: '200ms' }}
        >
          {HOME_INDEX_CARDS.map((item) => (
            <button
              key={item.num}
              type="button"
              onClick={() => onNavigate(item.target)}
              onMouseMove={updateSpotlight}
              className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white hover:border-[#1677FF]/45 p-7 flex flex-col justify-between transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,17,20,0.04)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
            >
              <div>
                <span className="font-mono text-xs text-[#1677FF] tabular-nums">{item.num}</span>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.025em] text-[#101114] group-hover:text-[#1677FF] transition-colors duration-150">
                  {item.title}
                </h2>
                <p className="mt-2.5 text-sm text-[#777B84] leading-relaxed">
                  {item.summary}
                </p>
              </div>
              <span className="mt-6 pt-4 border-t border-[#E8EBF0] inline-flex items-center justify-between text-xs font-medium text-[#101114] group-hover:text-[#1677FF] transition-colors">
                <span>{item.cta}</span>
                <ArrowUpRight
                  className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.75}
                />
              </span>
            </button>
          ))}
        </div>

        {/* Curated Featured Works Preview on Home */}
        <div
          className="stagger-item mt-20 pt-14 border-t border-[#E8EBF0]"
          style={{ animationDelay: '260ms' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#777B84] mb-2">
  Our Expertise
</p>

<h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#101114]">
  Technology That Moves Your Business Forward
</h2>
            </div>
            {/* <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1677FF] hover:text-[#0958D9] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              View All Selected Works
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </button> */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

  {/* 01 - Website Development */}
  <div className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white hover:border-[#1677FF]/45 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] p-6">
    <span className="font-mono text-xs text-[#1677FF]">01</span>

    <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-[#101114]">
      Website Development
    </h3>

    <p className="mt-3 text-sm text-[#777B84]">
      Beautiful, high-performance websites.
    </p>

    <p className="mt-4 font-mono text-xs leading-6 text-[#101114]">
      Editorial architecture · Sub-second edge delivery · Accessibility
    </p>
  </div>

  {/* 02 - Web Applications */}
  <div className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white hover:border-[#1677FF]/45 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] p-6">
    <span className="font-mono text-xs text-[#1677FF]">02</span>

    <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-[#101114]">
      Web Applications
    </h3>

    <p className="mt-3 text-sm text-[#777B84]">
      Intelligent digital platforms for businesses.
    </p>

    <p className="mt-4 font-mono text-xs leading-6 text-[#101114]">
      Real-time dashboards · Role-based portals · API orchestration
    </p>
  </div>

  {/* 03 - Mobile Applications */}
  <div className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white hover:border-[#1677FF]/45 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] p-6">
    <span className="font-mono text-xs text-[#1677FF]">03</span>

    <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-[#101114]">
      Mobile Applications
    </h3>

    <p className="mt-3 text-sm text-[#777B84]">
      Powerful mobile experiences.
    </p>

    <p className="mt-4 font-mono text-xs leading-6 text-[#101114]">
      iOS & Android · Gesture-first UI · Offline synchronization
    </p>
  </div>

  {/* 04 - Digital Marketing & SEO */}
  <div className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white hover:border-[#1677FF]/45 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] p-6">
    <span className="font-mono text-xs text-[#1677FF]">04</span>

    <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-[#101114]">
      Digital Marketing & SEO
    </h3>

    <p className="mt-3 text-sm text-[#777B84]">
      Grow your digital presence.
    </p>

    <p className="mt-4 font-mono text-xs leading-6 text-[#101114]">
      Technical SEO · Conversion funnels · Search visibility
    </p>
  </div>

  {/* 05 - Business Automation */}
  <div className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white hover:border-[#1677FF]/45 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] p-6">
    <span className="font-mono text-xs text-[#1677FF]">05</span>

    <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-[#101114]">
      Business Automation
    </h3>

    <p className="mt-3 text-sm text-[#777B84]">
      Smart systems that simplify operations.
    </p>

    <p className="mt-4 font-mono text-xs leading-6 text-[#101114]">
      CRM pipelines · Automated intake · Billing & reports
    </p>
  </div>

</div>

        </div>
      </div>
    </section>
  );
}
