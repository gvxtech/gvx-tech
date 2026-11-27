import { useEffect, useRef, useState } from 'react';
import {
  initOceanScene,
  type OceanController,
  type ThemeMode,
} from '../webgl/oceanScene';

interface OceanBackgroundProps {
  transitionKey?: number;
}

function getCurrentTheme(): ThemeMode {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function OceanBackground({ transitionKey = 0 }: OceanBackgroundProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<OceanController | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(getCurrentTheme);
  const [fallback, setFallback] = useState(false);

  // Keep the ocean palette synchronized with the existing header theme toggle.
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(getCurrentTheme());
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    try {
      const controller = initOceanScene(container, theme, (lost) => {
        setFallback(lost);
      });
      controllerRef.current = controller;

      return () => {
        controller.dispose();
        controllerRef.current = null;
      };
    } catch {
      setFallback(true);
    }
  }, []);

  useEffect(() => {
    controllerRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (transitionKey > 0) {
      controllerRef.current?.triggerRipple();
    }
  }, [transitionKey]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white dark:bg-black transition-colors duration-300"
      aria-hidden="true"
    >
      <div ref={mountRef} className="w-full h-full" />

      {fallback && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              theme === 'dark'
                ? 'linear-gradient(180deg, #000000 0%, #041122 58%, #010409 100%)'
                : 'linear-gradient(180deg, #E6F3FF 0%, #B8DCFA 55%, #1366B8 100%)',
          }}
        />
      )}

      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-black/34 via-black/20 to-black/56'
            : 'bg-gradient-to-b from-white/52 via-white/30 to-white/52'
        }`}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            theme === 'dark'
              ? 'radial-gradient(ellipse 56% 52% at 26% 36%, rgba(0, 0, 0, 0.56) 0%, rgba(0, 0, 0, 0.22) 60%, transparent 100%)'
              : 'radial-gradient(ellipse 56% 52% at 26% 36%, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.25) 58%, transparent 100%)',
        }}
      />
    </div>
  );
}
