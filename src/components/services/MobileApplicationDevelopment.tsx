import {
  Smartphone,
  Tablet,
  Gauge,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

import SEO from '../../seo/SEO';

export default function MobileApplicationDevelopment() {
  const features = [
    {
      icon: Smartphone,
      title: 'Android Applications',
      description: 'Mobile applications designed for Android devices and business requirements.',
    },
    {
      icon: Tablet,
      title: 'Cross-Platform Experience',
      description: 'Consistent application experiences across different screen sizes and devices.',
    },
    {
      icon: Gauge,
      title: 'Optimized Performance',
      description: 'Fast, responsive and efficient mobile application experiences.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Applications',
      description: 'Security-focused application architecture and data protection.',
    },
  ];

  return (
    <>
      <SEO
        title="Mobile App Development Services | GVX TECH"
        description="GVX TECH creates modern mobile applications with intuitive interfaces, optimized performance and secure architecture to support business growth."
        url="https://gvxtech.com/services/mobile-application-development/"
      />

      <section className="min-h-screen pt-32 pb-20 bg-transparent dark:bg-black">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">

          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#1677FF] mb-5">
              Service / 03
            </p>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#101114] dark:text-white">
              Mobile Applications
              <span className="gvx-gradient-text"> Made for Everyone.</span>
            </h1>

            <p className="mt-7 text-base md:text-lg leading-relaxed text-[#777B84] dark:text-gray-400">
              Transform your business ideas into powerful mobile
              experiences with applications designed around usability,
              performance, and scalability.
            </p>

            <a href="#contact" className="inline-flex items-center gap-3 mt-9 px-7 py-4 rounded-lg bg-[#1677FF] text-white font-medium hover:bg-blue-600 transition">
              Discuss Your Project
              <ArrowUpRight size={18} />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-24">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="p-7 rounded-xl border border-[#E8EBF0] dark:border-[#262626] bg-white dark:bg-[#111111]">
                  <Icon className="w-7 h-7 text-[#1677FF] mb-6" />

                  <h2 className="text-lg font-semibold text-[#101114] dark:text-white">
                    {feature.title}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-[#777B84] dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </>
  );
}