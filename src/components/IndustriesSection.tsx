import { useState, type MouseEvent } from 'react';
import { ArrowUpRight, Building2 } from 'lucide-react';
import { INDUSTRIES } from '../data/agencyData';

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
    <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 bg-transparent">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="stagger-item flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 pb-10 border-b border-[#E8EBF0]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#777B84] mb-4">
              Solutions · Sectors
            </p>
            <h1
              className="font-display font-bold tracking-[-0.04em] text-[#101114] leading-[1.02]"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', textWrap: 'balance' }}
            >
              Technology For <span className="gvx-gradient-text">Every Business.</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base text-[#777B84] max-w-[42ch] leading-relaxed">
            Beyond digital templates—tailored platforms adapted to the workflows, compliance
            standards, and customer expectations of your industry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INDUSTRIES.map((industry, idx) => {
            const hasFailed = Boolean(failedImages[industry.id]);
            return (
              <article
                key={industry.id}
                onMouseMove={updateSpotlight}
                style={{ animationDelay: `${60 + idx * 60}ms` }}
                className="stagger-item spotlight-card group flex flex-col rounded-xl border border-[#E8EBF0] bg-white overflow-hidden transition-[border-color,transform,box-shadow] duration-200 ease-out hover:border-[#1677FF]/45 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(16,17,20,0.045)]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F7FA]">
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
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F5F7FA] to-[#E8EBF0] p-6 text-center">
                      <Building2 className="w-7 h-7 text-[#1677FF]" strokeWidth={1.4} />
                      <span className="mt-2 text-xs font-medium text-[#777B84]">
                        {industry.title}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#1677FF] mb-2">
                      {industry.capability}
                    </p>
                    <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-[#101114]">
                      {industry.title}
                    </h2>
                    <p className="mt-2 text-sm text-[#777B84] leading-relaxed">
                      {industry.summary}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E8EBF0]">
                    <button
                      type="button"
                      onClick={() => onExploreContact(industry.title)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#101114] hover:text-[#1677FF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Discuss {industry.title.split(' ')[0]} Solution
                      <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
