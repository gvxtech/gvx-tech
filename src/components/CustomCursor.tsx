import { useEffect, useRef, useState } from 'react';

type CursorMode = 'default' | 'pointer' | 'view' | 'text';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluate = () => {
      setEnabled(finePointer.matches && !reducedMotion.matches);
    };
    evaluate();

    finePointer.addEventListener('change', evaluate);
    reducedMotion.addEventListener('change', evaluate);
    return () => {
      finePointer.removeEventListener('change', evaluate);
      reducedMotion.removeEventListener('change', evaluate);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove('has-custom-cursor');
      return;
    }

    document.documentElement.classList.add('has-custom-cursor');

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId = 0;

    const resolveMode = (target: EventTarget | null): CursorMode => {
      if (!(target instanceof Element)) return 'default';
      if (target.closest('input, textarea, select, [contenteditable="true"]')) {
        return 'text';
      }
      if (target.closest('[data-cursor="view"]')) {
        return 'view';
      }
      if (target.closest('a, button, [role="button"], [data-cursor="pointer"]')) {
        return 'pointer';
      }
      return 'default';
    };

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setVisible(true);
      setMode(resolveMode(e.target));

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      }
    };

    const onPointerDown = () => setPressed(true);
    const onPointerUp = () => setPressed(false);
    const onMouseLeave = () => setVisible(false);

    const animate = () => {
      ringX += (targetX - ringX) * 0.16;
      ringY += (targetY - ringY) * 0.16;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafId = requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const isText = mode === 'text';
  const isView = mode === 'view';
  const isPointer = mode === 'pointer';

  return (
    <>
      {/* Fluid Damped Trailing Ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-[9998] transition-opacity duration-200 ${
          visible && !isText ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`flex items-center justify-center rounded-full transition-[width,height,margin,background-color,border-color,transform] duration-200 ease-out ${
            isView
              ? '-ml-8 -mt-8 h-16 w-16 bg-[#1677FF] border border-[#1677FF] text-white shadow-[0_10px_28px_rgba(22,119,255,0.28)]'
              : isPointer
              ? '-ml-6 -mt-6 h-12 w-12 bg-[#1677FF]/10 border border-[#1677FF]/70'
              : '-ml-4 -mt-4 h-8 w-8 bg-transparent border border-[#1677FF]/45'
          } ${pressed ? 'scale-90' : 'scale-100'}`}
        >
          {isView && (
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-white">
              View
            </span>
          )}
        </div>
      </div>

      {/* Zero-Latency Precision Inner Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-[9999] transition-opacity duration-150 ${
          visible && !isText && !isView ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`-ml-1 -mt-1 h-2 w-2 rounded-full bg-[#1677FF] transition-transform duration-150 ${
            pressed ? 'scale-75' : isPointer ? 'scale-125' : 'scale-100'
          }`}
        />
      </div>
    </>
  );
}
