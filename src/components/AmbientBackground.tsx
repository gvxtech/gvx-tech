import { OceanBackground } from './OceanBackground';

export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Original Three.js Ocean */}
      <OceanBackground />

      {/* Ambient Glow Effects */}
      <div className="absolute inset-0 overflow-hidden">

        {/* Glow 1 */}
        <div
          className="ambient-glow absolute rounded-full"
          style={{
            width: '500px',
            height: '500px',
            top: '-15%',
            left: '-10%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.10), transparent 70%)',
          }}
        />

        {/* Glow 2 */}
        <div
          className="ambient-glow ambient-glow-delay absolute rounded-full"
          style={{
            width: '600px',
            height: '600px',
            bottom: '-20%',
            right: '-15%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)',
          }}
        />

        {/* Glow 3 */}
        <div
          className="ambient-glow ambient-glow-slow absolute rounded-full"
          style={{
            width: '400px',
            height: '400px',
            top: '35%',
            left: '45%',
            background:
              'radial-gradient(circle, rgba(6,182,212,0.07), transparent 70%)',
          }}
        />

      </div>

      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(128,128,128,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(128,128,128,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

    </div>
  );
}