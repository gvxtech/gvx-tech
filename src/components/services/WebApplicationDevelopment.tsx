import {
  Layers,
  Database,
  Workflow,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

import SEO from '../../seo/SEO';

export default function WebApplicationDevelopment() {
  const features = [
    {
      icon: Layers,
      title: 'Custom Applications',
      description: 'Business applications designed around your unique workflows and requirements.',
    },
    {
      icon: Database,
      title: 'Database Integration',
      description: 'Reliable database architecture and seamless data management.',
    },
    {
      icon: Workflow,
      title: 'Process Integration',
      description: 'Connect systems and simplify complex business operations.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Architecture',
      description: 'Build scalable applications with security and reliability in mind.',
    },
  ];

  return (
    <>
      <SEO
        title="Web Application Development Services | GVX TECH"
        description="GVX TECH develops custom web applications, business management systems, dashboards and scalable digital platforms tailored to business requirements."
        url="https://gvxtech.com/services/web-application-development/"
      />

      <section className="min-h-screen pt-32 pb-20 bg-transparent dark:bg-transparent">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">

          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#1677FF] mb-5">
              Service / 02
            </p>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#101114] dark:text-white">
              Web Applications
              <span className="gvx-gradient-text"> Built for Business.</span>
            </h1>

            <p className="mt-7 text-base md:text-lg leading-relaxed text-[#777B84] dark:text-gray-400">
              We develop powerful, scalable web applications that help
              businesses manage operations, improve productivity, and
              deliver better digital experiences.
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