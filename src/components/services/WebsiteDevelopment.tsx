import {
  Code2,
  Monitor,
  Smartphone,
  Zap,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

import SEO from '../../seo/SEO';

export default function WebsiteDevelopment() {
  const features = [
    {
      icon: Monitor,
      title: 'Responsive Design',
      description:
        'Modern websites that deliver seamless experiences across desktops, tablets, and mobile devices.',
    },
    {
      icon: Zap,
      title: 'High Performance',
      description:
        'Optimized website architecture for faster loading speeds and smooth user experiences.',
    },
    {
      icon: Code2,
      title: 'Modern Technologies',
      description:
        'Built using modern frameworks and development technologies.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Development',
      description:
        'Security-focused development practices to protect your website and business.',
    },
  ];

  return (
    <>
      <SEO
        title="Website Development Services | GVX TECH"
        description="GVX TECH provides professional website development services, creating responsive, modern, SEO-friendly and high-performance websites for businesses."
        url="https://gvxtech.com/services/website-development/"
      />

      <section className="min-h-screen pt-32 pb-20 bg-transparent dark:bg-black">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">

          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#1677FF] mb-5">
              Service / 01
            </p>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#101114] dark:text-white">
              Website Development
              <span className="gvx-gradient-text"> That Drives Growth.</span>
            </h1>

            <p className="mt-7 text-base md:text-lg leading-relaxed text-[#777B84] dark:text-gray-400">
              We create modern, responsive, and high-performance websites
              that strengthen your digital presence, communicate your brand,
              and turn visitors into customers.
            </p>

            <a
              href="#contact"
              className="inline-flex items-center gap-3 mt-9 px-7 py-4 rounded-lg bg-[#1677FF] text-white font-medium hover:bg-blue-600 transition"
            >
              Discuss Your Project
              <ArrowUpRight size={18} />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-24">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="p-7 rounded-xl border border-[#E8EBF0] dark:border-[#262626] bg-white dark:bg-[#111111]"
                >
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