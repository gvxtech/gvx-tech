import { useState, type MouseEvent } from 'react';
import { ArrowUpRight, Building2 } from 'lucide-react';
import { INDUSTRIES } from '../data/agencyData';
import SEO from '../seo/SEO';

interface IndustriesSectionProps {
  onExploreContact: (sector: string) => void;
}

function updateSpotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
}

export function IndustriesSection({ onExploreContact }: IndustriesSectionProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <>
    <SEO
  title="Digital Solutions for Businesses | GVX TECH"
  description="Discover innovative digital solutions from GVX TECH, helping businesses streamline operations, improve customer experiences and grow through modern technology."
  url="https://gvxtech.com/solutions/"
/>

    <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 bg-transparent dark:bg-transparent transition-colors duration-300">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">

        {/* Section Heading */}
        <div className="stagger-item flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 pb-10 border-b border-[#E8EBF0] dark:border-[#262626]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#777B84] dark:text-gray-400 mb-4">
              Solutions · Sectors
            </p>

            <h1
              className="font-display font-bold tracking-[-0.04em] text-[#101114] dark:text-white leading-[1.02]"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', textWrap: 'balance' }}
            >
              Technology For{' '}
              <span className="gvx-gradient-text dark:bg-none dark:text-white dark:[-webkit-text-fill-color:white]">
                Every Business.
              </span>
            </h1>
          </div>

          <p className="text-sm sm:text-base text-[#777B84] dark:text-gray-400 max-w-[42ch] leading-relaxed">
            Beyond digital templates—tailored platforms adapted to the workflows, compliance
            standards, and customer expectations of your industry.
          </p>
        </div>

        {/* Industry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INDUSTRIES.map((industry, idx) => {
            const hasFailed = Boolean(failedImages[industry.id]);

            return (
              <article
                key={industry.id}
                onMouseMove={updateSpotlight}
                style={{ animationDelay: `${60 + idx * 60}ms` }}
                className="stagger-item spotlight-card group flex flex-col rounded-xl border border-[#E8EBF0] dark:border-[#262626] bg-white dark:bg-[#111111] overflow-hidden transition-all duration-200 ease-out hover:border-[#1677FF]/45 dark:hover:border-[#404040] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(16,17,20,0.045)] dark:hover:bg-[#1A1A1A]"
              >
                {/* Industry Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F7FA] dark:bg-[#0A0A0A]">
                  {!hasFailed ? (
                    <img
                      src={industry.image}
                      alt={industry.alt}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [industry.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5F7FA] dark:bg-black p-6 text-center">
                      <Building2
                        className="w-7 h-7 text-[#1677FF]"
                        strokeWidth={1.4}
                      />

                      <span className="mt-2 text-xs font-medium text-[#777B84] dark:text-gray-400">
                        {industry.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Industry Content */}
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#1677FF] mb-2">
                      {industry.capability}
                    </p>

                    <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-[#101114] dark:text-white transition-colors duration-300">
                      {industry.title}
                    </h2>

                    <p className="mt-2 text-sm text-[#777B84] dark:text-gray-400 leading-relaxed">
                      {industry.summary}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-6 pt-4 border-t border-[#E8EBF0] dark:border-[#262626]">
                    <button
                      type="button"
                      onClick={() => onExploreContact(industry.title)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#101114] dark:text-white hover:text-[#1677FF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Discuss {industry.title.split(' ')[0]} Solution

                      <ArrowUpRight
                        className="w-3.5 h-3.5"
                        strokeWidth={1.75}
                      />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
        </>
  );
}