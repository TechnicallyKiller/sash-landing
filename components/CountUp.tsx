'use client';

/* A numeral that counts itself up the first time it is seen. */

import { useEffect, useRef, useState } from 'react';

export default function CountUp({ to, className }: { to: number; className?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !to) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(to);
      return;
    }

    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || ran.current) return;
      ran.current = true;
      const start = performance.now();
      const ms = 900;
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / ms);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setN(Math.round(to * eased));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });

    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <span className={className} ref={ref}>
      {n}
    </span>
  );
}
