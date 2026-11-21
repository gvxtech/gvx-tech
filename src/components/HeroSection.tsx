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
    num: '03',
    title: 'Selected Works',
    summary: 'Production platforms engineered for clarity, speed, and measurable return.',
    cta: 'Browse Portfolio',
    target: 'projects',
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
              <MagneticButton onClick={() => onNavigate('projects')} variant="primary" size="md">
                Explore Our Work
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
                Featured Case Studies
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#101114]">
                Crafted for High-Growth Teams
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1677FF] hover:text-[#0958D9] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              View All Selected Works
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredWorks.map((project) => (
              <button
                key={project.id}
                type="button"
                data-cursor="view"
                onClick={() => onNavigate('projects')}
                onMouseMove={updateSpotlight}
                className="spotlight-card group text-left rounded-xl border border-[#E8EBF0] bg-white hover:border-[#1677FF]/45 overflow-hidden transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(16,17,20,0.05)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
              >
                <div className="aspect-[16/10] w-full overflow-hidden border-b border-[#E8EBF0] bg-[#F5F7FA]">
                  <img
                    src={project.image}
                    alt={project.alt}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-6 sm:p-7 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#777B84]">
                      {project.category} · <span className="font-mono tabular-nums">{project.year}</span>
                    </p>
                    <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-[#101114] group-hover:text-[#1677FF] transition-colors">
                      {project.title}
                    </h3>
                    <p className="mt-2 font-mono text-xs text-[#101114] tabular-nums">
                      {project.impactMetric}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="w-5 h-5 text-[#777B84] group-hover:text-[#1677FF] shrink-0 mt-1 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={1.6}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
