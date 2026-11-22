const techIcons = [
  { name: 'React', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'Laravel', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg' },
  { name: 'PHP', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
  { name: 'HTML5', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
  { name: 'CSS3', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
  { name: 'Bootstrap', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg' },
  { name: 'Tailwind CSS', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg' },
  { name: 'JavaScript', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { name: 'MySQL', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
];

export default function FloatingTechIcons() {
  return (
    <section className="relative w-full overflow-hidden border-y border-[#E8EBF0] dark:border-[#262626] bg-white dark:bg-black py-8 transition-colors duration-300">

      {/* Left Fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent dark:from-black" />

      {/* Right Fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent dark:from-black" />

      <div className="tech-marquee flex w-max">
        {[0, 1, 2, 3].map((group) => (
          <div
            key={group}
            className="flex shrink-0 items-center gap-16 px-8"
            aria-hidden={group !== 0}
          >
            {techIcons.map((tech) => (
              <div
                key={`${group}-${tech.name}`}
                className="flex items-center gap-4 opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
              >
                <img
                  src={tech.src}
                  alt={group === 0 ? tech.name : ''}
                  className="h-10 w-10 object-contain"
                  loading="lazy"
                />

                <span className="whitespace-nowrap text-sm font-medium text-[#777B84] dark:text-gray-400">
                  {tech.name}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}