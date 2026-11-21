export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white select-none"
      aria-hidden="true"
    >
      {/* Subtle architectural hairline grid with radial edge fade on pure white */}
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(16, 17, 20, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 17, 20, 0.03) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%, #000 35%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 35%, #000 35%, transparent 100%)',
        }}
      />

      {/* Whisper-quiet slowly undulating architectural contour hairlines */}
      <svg
        className="ambient-contour-float absolute inset-x-0 top-0 h-[820px] w-full opacity-[0.045]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <g fill="none" stroke="#101114" strokeWidth="1">
          <path d="M-120 720 C 240 580, 520 790, 920 620 C 1200 500, 1380 560, 1560 440" />
          <path d="M-120 640 C 260 490, 540 700, 930 530 C 1210 410, 1390 470, 1560 350" />
          <path d="M-120 560 C 280 400, 560 610, 940 440 C 1220 320, 1400 380, 1560 260" />
          <path d="M-120 480 C 300 310, 580 520, 950 350 C 1230 230, 1410 290, 1560 170" />
          <path d="M-120 400 C 320 220, 600 430, 960 260 C 1240 140, 1420 200, 1560 80" />
        </g>
      </svg>

      {/* Minimal gliding hairline streaks along grid tracks */}
      <div className="ambient-beam-h absolute left-0 top-[216px] h-[1px] w-48 bg-gradient-to-r from-transparent via-[#101114]/15 to-transparent" />
      <div className="ambient-beam-v absolute top-0 left-[288px] h-44 w-[1px] bg-gradient-to-b from-transparent via-[#101114]/15 to-transparent" />
    </div>
  );
}
