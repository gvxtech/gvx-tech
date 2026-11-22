const techIcons = [
  { name: 'React', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', x: '8%', y: '12%', size: 45, delay: '0s', duration: '18s' },
  { name: 'Laravel', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg', x: '82%', y: '15%', size: 48, delay: '2s', duration: '22s' },
  { name: 'PHP', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg', x: '22%', y: '35%', size: 42, delay: '4s', duration: '20s' },
  { name: 'HTML5', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg', x: '70%', y: '38%', size: 44, delay: '1s', duration: '19s' },
  { name: 'CSS3', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg', x: '45%', y: '18%', size: 42, delay: '3s', duration: '21s' },
  { name: 'Bootstrap', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg', x: '90%', y: '55%', size: 46, delay: '5s', duration: '24s' },
  { name: 'Tailwind', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg', x: '15%', y: '70%', size: 45, delay: '2s', duration: '17s' },
  { name: 'JavaScript', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', x: '60%', y: '75%', size: 43, delay: '6s', duration: '23s' },
  { name: 'MySQL', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg', x: '35%', y: '85%', size: 45, delay: '1s', duration: '20s' },
  { name: 'React Native', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', x: '50%', y: '55%', size: 40, delay: '4s', duration: '22s' },
  { name: 'PostgreSQL', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg', x: '5%', y: '48%', size: 43, delay: '3s', duration: '19s' },
  { name: 'Angular', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angular/angular-original.svg', x: '78%', y: '85%', size: 42, delay: '7s', duration: '25s' },
  { name: 'Node.js', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', x: '30%', y: '10%', size: 46, delay: '2s', duration: '18s' },
  { name: 'MongoDB', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg', x: '92%', y: '30%', size: 44, delay: '5s', duration: '21s' },
  { name: 'SQL', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg', x: '40%', y: '45%', size: 40, delay: '6s', duration: '20s' },
  { name: 'Flutter', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg', x: '65%', y: '12%', size: 45, delay: '3s', duration: '24s' },
];

export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white dark:bg-black select-none transition-colors duration-300"
      aria-hidden="true"
    >
      {/* Automatically Floating Technology Logos */}
      {techIcons.map((tech, index) => (
        <div
          key={`${tech.name}-${index}`}
          className="tech-float absolute"
          style={{
            left: tech.x,
            top: tech.y,
            animationDelay: tech.delay,
            animationDuration: tech.duration,
          }}
        >
          <div className="flex items-center justify-center rounded-2xl border border-[#E8EBF0]/60 dark:border-[#262626]/70 bg-white/50 dark:bg-[#111111]/50 backdrop-blur-sm p-3 shadow-sm">
            <img
              src={tech.src}
              alt=""
              width={tech.size}
              height={tech.size}
              className="object-contain opacity-20 dark:opacity-30"
              style={{
                width: `${tech.size}px`,
                height: `${tech.size}px`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}