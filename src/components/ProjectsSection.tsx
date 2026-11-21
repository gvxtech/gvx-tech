import { useEffect, useState, type MouseEvent } from 'react';
import { ArrowRight, ArrowUpRight, Layers, X } from 'lucide-react';
import { PROJECTS, type ProjectItem } from '../data/agencyData';
import { MagneticButton } from './MagneticButton';

interface ProjectsSectionProps {
  onInquireProject: (projectTitle: string) => void;
}

function updateSpotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
}

export function ProjectsSection({ onInquireProject }: ProjectsSectionProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
      }
    };
    if (selectedProject) {
      window.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedProject]);

  return (
    <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 bg-transparent">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="stagger-item flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 pb-10 border-b border-[#E8EBF0]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#777B84] mb-4">
              Portfolio
            </p>
            <h1
              className="font-display font-bold tracking-[-0.04em] text-[#101114] leading-[1.02]"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', textWrap: 'balance' }}
            >
              Selected <span className="gvx-gradient-text">Works</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base text-[#777B84] max-w-[42ch] leading-relaxed">
            Production platforms, web applications, and automation pipelines engineered for
            clarity, speed, and measurable return.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {PROJECTS.map((project, idx) => {
            const hasFailed = Boolean(failedImages[project.id]);
            return (
              <article
                key={project.id}
                data-cursor="view"
                onClick={() => setSelectedProject(project)}
                onMouseMove={updateSpotlight}
                style={{ animationDelay: `${60 + idx * 70}ms` }}
                className="stagger-item spotlight-card group flex flex-col rounded-xl border border-[#E8EBF0] bg-white overflow-hidden transition-[border-color,transform,box-shadow] duration-200 ease-out hover:border-[#1677FF]/45 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(16,17,20,0.055)] cursor-pointer"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F7FA] border-b border-[#E8EBF0]">
                  {!hasFailed ? (
                    <img
                      src={project.image}
                      alt={project.alt}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [project.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5F7FA] p-6 text-center">
                      <Layers className="w-7 h-7 text-[#1677FF]" strokeWidth={1.4} />
                      <span className="mt-2 text-xs font-medium text-[#777B84]">
                        {project.client}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-7 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#777B84]">
                      <span>{project.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{project.year}</span>
                    </div>

                    <h2 className="mt-3 font-display text-xl font-semibold tracking-[-0.02em] text-[#101114] group-hover:text-[#1677FF] transition-colors leading-snug">
                      {project.title}
                    </h2>

                    <p className="mt-2.5 text-sm text-[#777B84] leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#E8EBF0]">
                    <p className="font-mono text-xs font-medium text-[#101114] tabular-nums mb-4">
                      {project.impactMetric}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1677FF] hover:text-[#0958D9] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] rounded-sm"
                    >
                      View Project
                      <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Case Study Inspection Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#101114]/45 p-4 sm:p-6"
          onClick={() => setSelectedProject(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-study-title"
        >
          <div
            className="page-enter relative w-full max-w-3xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#E8EBF0] bg-white shadow-[0_24px_64px_rgba(16,17,20,0.16)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E8EBF0] bg-white/95 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center gap-2 text-xs text-[#777B84]">
                <span className="font-medium text-[#101114]">{selectedProject.client}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedProject.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{selectedProject.year}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#E8EBF0] bg-white text-[#101114] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
                aria-label="Close case study"
              >
                <X className="w-4 h-4" strokeWidth={1.6} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <div>
                <h2
                  id="case-study-title"
                  className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#101114]"
                >
                  {selectedProject.title}
                </h2>
                <p className="mt-3 text-base text-[#777B84] leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#E8EBF0] bg-[#F5F7FA]">
                <img
                  src={selectedProject.image}
                  alt={selectedProject.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-[#E8EBF0] py-6">
                {selectedProject.outcomes.map((item) => (
                  <div key={item.label}>
                    <p className="font-mono text-2xl font-bold text-[#101114] tabular-nums">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-[#777B84]">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-display text-sm font-semibold text-[#101114] mb-2">
                    The Challenge
                  </h3>
                  <p className="text-sm text-[#777B84] leading-relaxed">
                    {selectedProject.challenge}
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-[#101114] mb-2">
                    Engineering Solution
                  </h3>
                  <p className="text-sm text-[#777B84] leading-relaxed">
                    {selectedProject.solution}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E8EBF0]">
                <p className="text-xs text-[#777B84]">
                  Stack: <span className="text-[#101114]">{selectedProject.stack.join(' · ')}</span>
                </p>
                <MagneticButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const title = selectedProject.title;
                    setSelectedProject(null);
                    onInquireProject(title);
                  }}
                >
                  Build Something Similar
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
