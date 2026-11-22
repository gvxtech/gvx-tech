import { type MouseEvent } from 'react';
import {
  ArrowUpRight,
  Globe,
  Layers,
  Smartphone,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import { SERVICES, type ServiceItem } from '../data/agencyData';

interface ServicesSectionProps {
  onSelectService: (serviceTitle: string) => void;
}

function ServiceIcon({ name }: { name: ServiceItem['iconName'] }) {
  const props = {
    className: 'w-5 h-5 text-[#1677FF]',
    strokeWidth: 1.4,
  };

  switch (name) {
    case 'globe':
      return <Globe {...props} />;
    case 'layers':
      return <Layers {...props} />;
    case 'smartphone':
      return <Smartphone {...props} />;
    case 'trending':
      return <TrendingUp {...props} />;
    case 'workflow':
      return <Workflow {...props} />;
  }
}

function updateSpotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
}

export function ServicesSection({ onSelectService }: ServicesSectionProps) {
  return (
    <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 bg-transparent dark:bg-black transition-colors duration-300">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">

        {/* Section Heading */}
        <div className="stagger-item flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 pb-10 border-b border-[#E8EBF0] dark:border-[#262626]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#777B84] dark:text-gray-400 mb-4">
              Capabilities
            </p>

            <h1
              className="font-display font-bold tracking-[-0.04em] text-[#101114] dark:text-white leading-[1.02]"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
                textWrap: 'balance',
              }}
            >
              What We{' '}
              <span className="gvx-gradient-text dark:bg-none dark:text-white dark:[-webkit-text-fill-color:white]">
                Create
              </span>
            </h1>
          </div>

          <p className="text-sm sm:text-base text-[#777B84] dark:text-gray-400 max-w-[40ch] leading-relaxed">
            Focused digital disciplines engineered with clean architecture,
            refined interfaces, and measurable business outcomes.
          </p>
        </div>

        {/* Asymmetric 5-card bento grid with cursor-tracking spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          {SERVICES.map((service, idx) => {
            const spanClass =
              idx < 2 ? 'md:col-span-3' : 'md:col-span-2';

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onSelectService(service.title)}
                onMouseMove={updateSpotlight}
                style={{ animationDelay: `${60 + idx * 55}ms` }}
                className={`${spanClass} stagger-item spotlight-card group text-left rounded-xl border border-[#E8EBF0] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] hover:border-[#1677FF]/45 dark:hover:border-[#404040] p-7 sm:p-8 transition-[border-color,transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(16,17,20,0.045)] dark:hover:bg-[#1A1A1A] flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]`}
              >
                <div>
                  {/* Icon and Index */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-10 h-10 rounded-lg border border-[#E8EBF0] dark:border-[#262626] bg-[#F5F7FA] dark:bg-[#0A0A0A] group-hover:bg-[#1677FF]/8 group-hover:border-[#1677FF]/30 flex items-center justify-center transition-colors duration-200">
                      <ServiceIcon name={service.iconName} />
                    </div>

                    <span className="font-mono text-xs text-[#777B84] dark:text-gray-400 tabular-nums">
                      {service.index}
                    </span>
                  </div>

                  {/* Service Title */}
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#101114] dark:text-white group-hover:text-[#1677FF] transition-colors duration-150">
                    {service.title}
                  </h2>

                  {/* Description */}
                  <p className="mt-2.5 text-sm sm:text-[15px] text-[#777B84] dark:text-gray-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Deliverables and Arrow */}
                <div className="mt-8 pt-4 border-t border-[#E8EBF0] dark:border-[#262626] flex items-center justify-between gap-3">
                  <span className="text-xs text-[#777B84] dark:text-gray-400 truncate">
                    {service.deliverables}
                  </span>

                  <ArrowUpRight
                    className="w-4 h-4 text-[#777B84] dark:text-gray-400 group-hover:text-[#1677FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150 shrink-0"
                    strokeWidth={1.6}
                  />
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}