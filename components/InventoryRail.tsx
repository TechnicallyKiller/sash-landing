'use client';

import { useRef, useState } from 'react';
import { RAIL, type RailRow } from '@/lib/inventory';
import { useAsking } from './AskingContext';

export default function InventoryRail() {
  const { setAsking, goToAccess } = useAsking();
  const [custom, setCustom] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const railRef = useRef<HTMLDivElement>(null);

  const rows: RailRow[] = [...RAIL];
  if (custom.length) {
    rows.push({ kind: 'group', label: 'YOURS' });
    for (const t of custom) {
      rows.push({
        kind: 'card',
        cat: 'Your idea',
        slot: t,
        price: 'No price',
        why: 'Not priced yet. Tell us what it is worth and we will list it.',
      });
    }
  }

  const add = (ev: React.FormEvent) => {
    ev.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setCustom((c) => [...c, t].slice(-6));
    setDraft('');
    requestAnimationFrame(() => {
      const el = railRef.current;
      if (el) el.scrollLeft = el.scrollWidth;
    });
  };

  return (
    <section id="inventory" className="inventory">
      <div className="inventory-head">
        <h2>What a person can sell.</h2>
        <p>A slot is any defined thing, for a defined window, with defined proof. Scroll the rail sideways.</p>
      </div>

      <div className="rail" role="region" aria-label="Inventory" tabIndex={0} ref={railRef}>
        {rows.map((r, i) =>
          r.kind === 'group' ? (
            <div className="rail-group" key={`g-${i}`}>
              <span>{r.label}</span>
            </div>
          ) : (
            <div className="rail-card" key={`c-${i}`}>
              <div className="rail-cat">{r.cat}</div>
              <div className="rail-slot">{r.slot}</div>
              <div className="rail-mark">
                {r.buyer ? <div className="rail-sold">{r.buyer.charAt(0)}</div> : <div className="rail-open" />}
              </div>
              <div className="rail-price">{r.price}</div>
              <div className="rail-status">{r.buyer ? `Sold to ${r.buyer}` : 'Open'}</div>
              {!r.buyer && (
                <button
                  type="button"
                  className="rail-take"
                  onClick={() => {
                    setAsking(`${r.slot.toLowerCase()}, ${r.price}`);
                    goToAccess();
                  }}
                >
                  Ask for this slot
                </button>
              )}
              <p className="rail-why">{r.why}</p>
            </div>
          ),
        )}

        <div className="rail-last">
          <div className="rail-last-box" />
          <p>Whatever you can prove you did.</p>
          <form onSubmit={add}>
            <label>
              <span className="fine">Name a thing you could sell</span>
              <input
                type="text"
                placeholder="A weekly newsletter mention"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <button type="submit">Add it to the rail</button>
          </form>
        </div>
      </div>
    </section>
  );
}
