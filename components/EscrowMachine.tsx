'use client';

/* "Money moves last", made literal. The payment block physically travels from
   the buyer into escrow and only reaches the seller once proof lands — and you
   can drive it, including down the refund branch. Advances on its own until
   someone takes hold of it. */

import { useEffect, useRef, useState } from 'react';

type Stage = 0 | 1 | 2 | 3;

const STAGES: { n: string; head: string; body: string; note: string }[] = [
  {
    n: '1',
    head: 'Take the slot.',
    body: 'You pick the surface. We agree what a run is and what counts as proof before anyone prints anything.',
    note: 'Nothing has moved yet.',
  },
  {
    n: '2',
    head: 'Escrow holds it.',
    body: 'Your payment locks before the garments are made. Neither side can touch it while it sits there.',
    note: 'Your money is out of your hands and out of ours.',
  },
  {
    n: '3',
    head: 'Proof releases it.',
    body: 'Photos of the run, and of the garment worn at the event. You look at them. Then the money moves.',
    note: 'Paid, on evidence.',
  },
  {
    n: '—',
    head: 'Or it comes back.',
    body: 'No proof, no payment. The garments do not ship, the event passes, and the refund is automatic.',
    note: 'The only two endings there are.',
  },
];

export default function EscrowMachine() {
  const [stage, setStage] = useState<Stage>(0);
  const [live, setLive] = useState(false);
  const [held, setHeld] = useState(false);
  const ref = useRef<HTMLElement>(null);

  /* Only run once it is on screen, and stop the moment someone interacts. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live || held) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setStage((s) => ((s + 1) % 3) as Stage), 2600);
    return () => clearInterval(id);
  }, [live, held]);

  const take = (s: Stage) => {
    setHeld(true);
    setStage(s);
  };

  const refund = stage === 3;

  return (
    <section className="esc" ref={ref} onMouseEnter={() => setHeld(true)} onFocusCapture={() => setHeld(true)}>
      <div className="esc-head">
        <h2>Money moves last.</h2>
        <p>
          Follow it. The payment leaves the buyer, sits where neither side can reach it, and only
          lands when the proof does.
        </p>
      </div>

      {/* ---- the track ---- */}
      <div className={`esc-track${refund ? ' is-refund' : ''}`} data-stage={stage}>
        <div className="esc-node esc-node-buyer">
          <span className="esc-node-label">BUYER</span>
          <span className="esc-node-sub">you</span>
        </div>

        <div className="esc-wire">
          <div className="esc-money" aria-hidden="true">
            <span>◼</span>
          </div>
        </div>

        <div className={`esc-node esc-node-vault${stage >= 1 && stage <= 2 ? ' is-holding' : ''}`}>
          <span className="esc-node-label">ESCROW</span>
          <span className="esc-node-sub">{stage >= 1 && stage < 2 ? 'holding' : stage >= 2 && !refund ? 'released' : refund ? 'returned' : 'empty'}</span>
        </div>

        <div className="esc-wire esc-wire-out">
          <div className="esc-money esc-money-out" aria-hidden="true">
            <span>◼</span>
          </div>
        </div>

        <div className="esc-node esc-node-seller">
          <span className="esc-node-label">{refund ? 'REFUND' : 'SELLER'}</span>
          <span className="esc-node-sub">{refund ? 'back to you' : 'the person wearing it'}</span>
        </div>
      </div>

      {/* ---- the controls, which are also the copy ---- */}
      <div className="esc-stages" role="tablist" aria-label="How the money moves">
        {STAGES.map((s, i) => {
          const on = stage === i;
          return (
            <button
              key={s.head}
              type="button"
              role="tab"
              aria-selected={on}
              className={`esc-stage${on ? ' is-on' : ''}${i === 3 ? ' is-branch' : ''}`}
              onClick={() => take(i as Stage)}
              onMouseEnter={() => take(i as Stage)}
            >
              <span className="esc-stage-n">{s.n}</span>
              <span className="esc-stage-head">{s.head}</span>
              <span className="esc-stage-body">{s.body}</span>
              <span className="esc-stage-note">{s.note}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
