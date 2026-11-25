import {
  TrendingUp,
  Search,
  BarChart3,
  Target,
  ArrowUpRight,
} from 'lucide-react';

import SEO from '../../seo/SEO';

export default function SEODigitalMarketing() {
  const features = [
    {
      icon: Search,
      title: 'Search Engine Optimization',
      description: 'Improve search visibility through technical, on-page and off-page SEO.',
    },
    {
      icon: TrendingUp,
      title: 'Organic Growth',
      description: 'Build sustainable online visibility and attract relevant audiences.',
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Understand website performance through meaningful data and insights.',
    },
    {
      icon: Target,
      title: 'Digital Strategy',
      description: 'Develop focused digital strategies aligned with business objectives.',
    },
  ];

  return (
    <>
      <SEO
        title="SEO & Digital Marketing Services | GVX TECH"
        description="Improve your online visibility with GVX TECH SEO and digital marketing services, including technical SEO, search optimization and performance analytics."
        url="https://gvxtech.com/services/seo-digital-marketing/"
      />

      <section className="min-h-screen pt-32 pb-20 bg-transparent dark:bg-black">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">

          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#1677FF] mb-5">
              Service / 04
            </p>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#101114] dark:text-white">
              SEO & Digital Marketing
              <span className="gvx-gradient-text"> That Gets Results.</span>
            </h1>

            <p className="mt-7 text-base md:text-lg leading-relaxed text-[#777B84] dark:text-gray-400">
              Strengthen your digital presence, improve search engine
              visibility, and connect your business with the right
              audience through strategic digital solutions.
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