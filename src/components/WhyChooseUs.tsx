import { type MouseEvent } from 'react';
import {
  Target,
  Palette,
  Smartphone,
  Layers3,
  Wallet,
  Headset,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Target,
    title: 'Tailored to Your Business',
    description:
      'Every business is different. We develop digital solutions around your specific goals, requirements, and workflows.',
  },
  {
    icon: Palette,
    title: 'Modern & User-Friendly Design',
    description:
      'We create clean, modern, and intuitive interfaces that make your digital presence memorable and easy to use.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Development',
    description:
      'Responsive experiences designed to work seamlessly across smartphones, tablets, laptops, and desktops.',
  },
  {
    icon: Layers3,
    title: 'Scalable Technology',
    description:
      'Future-ready solutions built with flexibility and performance, allowing your business to grow without limits.',
  },
  {
    icon: Wallet,
    title: 'Affordable Solutions',
    description:
      'Practical, high-quality digital solutions that deliver value while keeping your business budget in mind.',
  },
  {
    icon: Headset,
    title: 'Ongoing Technical Support',
    description:
      'We stay with you beyond launch, providing reliable technical support and assistance whenever you need it.',
  },
];

function updateSpotlight(e: MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();

  e.currentTarget.style.setProperty(
    '--mouse-x',
    `${e.clientX - rect.left}px`
  );

  e.currentTarget.style.setProperty(
    '--mouse-y',
    `${e.clientY - rect.top}px`
  );
}

export default function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden bg-transparent pt-12 pb-[38px] sm:pt-16 sm:pb-[38px] transition-colors duration-300">

      <div className="relative z-10 mx-auto max-w-[1240px] px-6 lg:px-10">

        {/* Section Heading */}
        <div className="mb-16 max-w-3xl">

          <div className="mb-5 flex items-center gap-2">
            <Sparkles
              className="h-4 w-4 text-[#1677FF]"
              strokeWidth={1.7}
            />

            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#777B84] dark:text-gray-400">
              The GVX Advantage
            </span>
          </div>

          <h2 className="font-display text-4xl font-bold tracking-[-0.04em] text-[#101114] dark:text-white sm:text-5xl lg:text-6xl">
            Why Choose{' '}
            <span className="gvx-gradient-text dark:bg-none dark:text-white dark:[-webkit-text-fill-color:white]">
              GVX TECH?
            </span>
          </h2>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">

            <p className="text-lg font-semibold text-[#101114] dark:text-white sm:text-xl">
              More Than Just Development.
            </p>

            <span className="hidden h-5 w-px bg-[#DADDE3] dark:bg-[#333333] sm:block" />

            <p className="text-lg text-[#777B84] dark:text-gray-400 sm:text-xl">
              We Build Solutions.
            </p>

          </div>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#777B84] dark:text-gray-400">
            We combine technology, creativity, and business understanding
            to create digital solutions that solve real problems and help
            businesses move forward.
          </p>

        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-x-14 md:grid-cols-2 lg:grid-cols-3">

          {FEATURES.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                onMouseMove={updateSpotlight}
                className="group relative border-t border-[#E8EBF0] py-9 dark:border-[#262626]"
              >

                <div className="flex items-start gap-5">

                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1677FF]/[0.07] text-[#1677FF] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#1677FF]/15 dark:bg-[#1677FF]/10 dark:group-hover:bg-[#1677FF]/20">

                    <Icon
                      className="h-6 w-6"
                      strokeWidth={1.6}
                    />

                  </div>

                  {/* Text */}
                  <div className="flex-1">

                    <h3 className="text-lg font-semibold tracking-tight text-[#101114] transition-colors duration-300 group-hover:text-[#1677FF] dark:text-white dark:group-hover:text-[#1677FF]">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[#777B84] dark:text-gray-400">
                      {feature.description}
                    </p>

                  </div>

                </div>

                {/* Hover Accent */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#1677FF] transition-all duration-500 group-hover:w-full" />

              </div>
            );
          })}

        </div>

        {/* Bottom Statement */}
        <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-[#E8EBF0] pt-4 dark:border-[#262626] sm:flex-row sm:items-center">

          <p className="text-sm text-[#777B84] dark:text-gray-400">
            Your Vision. Our Technology.{' '}
            <span className="font-semibold text-[#101114] dark:text-white">
              Limitless Possibilities.
            </span>
          </p>

          <span className="font-mono text-xs uppercase tracking-widest text-[#A0A4AD] dark:text-gray-500">
            Built for Growth · Designed for Impact
          </span>

        </div>

      </div>
    </section>
  );
}