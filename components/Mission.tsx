'use client';

/* The line fades in word by word as the section climbs the screen. */

import { useEffect, useRef, useState } from 'react';

const WORDS = 'Every person at a conference is unsold advertising space.'.split(' ');

export default function Mission() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }
    let raf: number | null = null;
    const tick = () => {
      raf = null;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      setProgress(Math.max(0, Math.min(1, (vh * 0.92 - r.top) / (vh * 0.52))));
    };
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    tick();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="mission" ref={ref}>
      <h2>
        {WORDS.map((w, i) => {
          const start = i / (WORDS.length + 2);
          const o = Math.max(0, Math.min(1, (progress - start) / 0.16));
          return (
            <span key={i} style={{ opacity: 0.12 + 0.88 * o }}>
              {w}{' '}
            </span>
          );
        })}
      </h2>
      <p>
        Chest panels, tote faces, profile banners, an hour of meetings taken on your behalf, someone credible to speak
        for you at an event you are missing. The list gets longer every month.
      </p>
    </section>
  );
}
