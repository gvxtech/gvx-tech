import { ArrowRight } from 'lucide-react';
import { AGENCY_PILLARS } from '../data/agencyData';
import { MagneticButton } from './MagneticButton';
import WhyChooseUs from './WhyChooseUs';
import SEO from '../seo/SEO';
interface AboutSectionProps {
  onStartProject: () => void;
}

export function AboutSection({ onStartProject }: AboutSectionProps) {
  return (
    <>
    <SEO
        title="About GVX TECH | Global Digital Technology Company"
        description="Discover GVX TECH, a digital technology company creating innovative websites, custom software and intelligent digital solutions for businesses worldwide."
        url="https://gvxtech.com/about/"
      />

    <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 bg-transparent dark:bg-black transition-colors duration-300">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left Narrative */}
          <div className="lg:col-span-6 stagger-item">

            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#777B84] dark:text-gray-400 mb-4">
              About GVX TECH
            </p>

            <h1
              className="font-display font-bold tracking-[-0.04em] text-[#101114] dark:text-white leading-[1.04] transition-colors duration-300"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.15rem)', textWrap: 'balance' }}
            >
              A Technology Partner for {' '}
              <span className="gvx-gradient-text dark:text-white dark:bg-none">
                Ambitious Businesses.
              </span>
            </h1>

            <p className="mt-7 text-base sm:text-lg text-[#777B84] dark:text-gray-400 leading-[1.7] max-w-[52ch] transition-colors duration-300">
              At GVX TECH, we believe every business deserves technology that works smarter.
            </p>

            <p className="mt-4 text-base text-[#777B84] dark:text-gray-400 leading-[1.7] max-w-[52ch] transition-colors duration-300">
              We combine creative design, modern development and intelligent automation to build digital solutions that solve real business challenges.
From your first website to a complete business management platform, we turn ideas into meaningful digital experiences.
            </p>

            <div className="mt-9">
              <MagneticButton onClick={onStartProject} variant="primary" size="md">
                Work With Us
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </MagneticButton>
            </div>
          </div>

          {/* Right Architectural Pillars */}
          <div className="lg:col-span-6 border-t border-[#E8EBF0] dark:border-white/10 transition-colors duration-300">

            {AGENCY_PILLARS.map((pillar, idx) => (
              <div
                key={pillar.label}
                className="py-7 border-b border-[#E8EBF0] dark:border-white/10 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8 transition-colors duration-300"
              >
                <span className="font-mono text-xs text-[#1677FF] tabular-nums shrink-0 w-10">
                  0{idx + 1}
                </span>

                <div className="flex-1">
                  <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-[#101114] dark:text-white transition-colors duration-300">
                    {pillar.label}
                  </h2>

                  <p className="mt-2 text-sm text-[#777B84] dark:text-gray-400 leading-relaxed transition-colors duration-300">
                    {pillar.detail}
                  </p>
                </div>
              </div>
            ))}

          </div>

        </div>

        <WhyChooseUs />
      </div>
    </section>
    </>
  );
}