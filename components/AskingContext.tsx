'use client';

/* One shared line of state: which slot the visitor is asking about.
   Set from the 3D viewer or the inventory rail, read by the access form. */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Ctx = {
  asking: string;
  setAsking: (value: string) => void;
  goToAccess: () => void;
};

const AskingCtx = createContext<Ctx | null>(null);

export function AskingProvider({ children }: { children: React.ReactNode }) {
  const [asking, setAsking] = useState('');

  const goToAccess = useCallback(() => {
    const el = document.getElementById('access');
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: el.offsetTop - 60, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  const value = useMemo(() => ({ asking, setAsking, goToAccess }), [asking, goToAccess]);
  return <AskingCtx.Provider value={value}>{children}</AskingCtx.Provider>;
}

export function useAsking() {
  const ctx = useContext(AskingCtx);
  if (!ctx) throw new Error('useAsking must be used inside <AskingProvider>');
  return ctx;
}
