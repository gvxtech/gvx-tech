import {
  Workflow,
  Settings,
  Clock,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

import SEO from '../../seo/SEO';

export default function BusinessAutomation() {
  const features = [
    {
      icon: Workflow,
      title: 'Workflow Automation',
      description: 'Automate repetitive processes and simplify everyday business operations.',
    },
    {
      icon: Settings,
      title: 'System Integration',
      description: 'Connect business tools and applications into unified workflows.',
    },
    {
      icon: Clock,
      title: 'Time Efficiency',
      description: 'Reduce manual work and give your team more time for important tasks.',
    },
    {
      icon: TrendingUp,
      title: 'Business Productivity',
      description: 'Improve operational efficiency with intelligent digital solutions.',
    },
  ];

  return (
    <>
      <SEO
        title="Business Automation Services | GVX TECH"
        description="GVX TECH delivers business automation solutions that streamline workflows, connect systems, reduce repetitive tasks and improve operational efficiency."
        url="https://gvxtech.com/services/business-automation/"
      />

      <section className="min-h-screen pt-32 pb-20 bg-transparent dark:bg-black">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">

          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#1677FF] mb-5">
              Service / 05
            </p>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#101114] dark:text-white">
              Business Automation
              <span className="gvx-gradient-text"> Made Intelligent.</span>
            </h1>

            <p className="mt-7 text-base md:text-lg leading-relaxed text-[#777B84] dark:text-gray-400">
              Simplify complex workflows, reduce repetitive tasks,
              and improve business productivity with intelligent
              automation solutions.
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