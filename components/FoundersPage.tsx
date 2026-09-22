'use client';

/* The founders page. Same tokens as the landing page, different temperament:
   an inverted black hero, a running ticker, oversized numerals, and a slot
   ledger instead of a price rail. Nothing here prints a price. */

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GARMENTS, type GarmentId, type Listing } from '@/lib/inventory';
import {
  FOUNDERS_FACTS,
  FOUNDERS_GARMENTS,
  FOUNDERS_SLOT_SOURCES,
  MARQUEE,
  TAKEN,
  listingsFrom,
  type FoundersSlotDoc,
} from '@/lib/founders';

const GarmentViewer = dynamic(() => import('./GarmentViewer'), {
  ssr: false,
  loading: () => (
    <div className="viewer">
      <div className="viewer-load">Loading the hoodie…</div>
    </div>
  ),
});

type Docs = Partial<Record<GarmentId, FoundersSlotDoc>>;

export default function FoundersPage() {
  const [docs, setDocs] = useState<Docs>({});
  const [listings, setListings] = useState<Partial<Record<GarmentId, Record<string, Listing>>>>({});
  const [tab, setTab] = useState<GarmentId>('hoodie');
  const [asking, setAsking] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  /* The slot maps are the source of truth for both the ledger and the counts,
     so the page reads the same JSON the 3D viewer does. */
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      FOUNDERS_GARMENTS.map(async (id) => {
        const res = await fetch(FOUNDERS_SLOT_SOURCES[id]!);
        return [id, (await res.json()) as FoundersSlotDoc] as const;
      }),
    ).then((pairs) => {
      if (cancelled) return;
      const nextDocs: Docs = {};
      const nextListings: Partial<Record<GarmentId, Record<string, Listing>>> = {};
      for (const [id, doc] of pairs) {
        nextDocs[id] = doc;
        nextListings[id] = listingsFrom(id, doc);
      }
      setDocs(nextDocs);
      setListings(nextListings);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ask = useCallback((garment: GarmentId, label: string) => {
    setAsking(`${GARMENTS[garment].label}, ${label.toLowerCase()}`);
    const el = formRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: el.offsetTop - 40, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  const total = FOUNDERS_GARMENTS.reduce((n, id) => n + (docs[id]?.slots.length ?? 0), 0);
  const taken = Object.keys(TAKEN).length;
  const slots = docs[tab]?.slots ?? [];

  return (
    <div className="founders">
      {/* ---- inverted hero ------------------------------------------------ */}
      <header className="fx-hero">
        <div className="fx-corner fx-tl">
          A MARKETPLACE
          <br />
          FOR PHYSICAL
          <br />
          ATTENTION
        </div>
        <div className="fx-corner fx-tr">FOUNDERS EDITION</div>

        <div className="fx-hero-inner">
          <div className="fx-hero-copy">
            <h1>
              Every surface,
              <br />
              once, forever.
            </h1>
            <p>
              The founders hoodie and tee are what Sash puts on people at every event it runs. Buy a
              position on them once and it prints on every unit of every run, for as long as the line
              exists.
            </p>
            <div className="fx-hero-actions">
              <button type="button" className="btn btn-invert btn-lg" onClick={() => ask('hoodie', 'not sure yet')}>
                Ask for the price
              </button>
              <a className="btn btn-outline btn-lg" href="#ledger">
                See every surface
              </a>
            </div>
          </div>

          <div className="fx-hero-viewer">
            <GarmentViewer
              garments={FOUNDERS_GARMENTS}
              slotSources={FOUNDERS_SLOT_SOURCES}
              listings={listings}
              priceMode="ask"
              ctaLabel="Ask for this slot"
              onTake={({ garment, label }) => ask(garment, label)}
            />
          </div>
        </div>

        <div className="fx-corner fx-bl">buysash.fun</div>
        <div className="fx-corner fx-br">@buysashdot</div>
      </header>

      {/* ---- ticker -------------------------------------------------------- */}
      <div className="fx-ticker" aria-hidden="true">
        <div className="fx-ticker-track">
          {[0, 1].map((copy) => (
            <span className="fx-ticker-run" key={copy}>
              {MARQUEE.map((word, i) => (
                <span key={i}>
                  {word}
                  <i className="fx-dot" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ---- the count ----------------------------------------------------- */}
      <section className="fx-count">
        <div className="fx-count-figure">
          <span className="fx-big">{total || '—'}</span>
          <span className="fx-count-label">surfaces on the two garments</span>
        </div>
        <div className="fx-count-figure">
          <span className="fx-big">{taken}</span>
          <span className="fx-count-label">already taken</span>
        </div>
        <div className="fx-count-figure">
          <span className="fx-big">∞</span>
          <span className="fx-count-label">runs your slot prints on</span>
        </div>
      </section>

      {/* ---- what you are buying ------------------------------------------- */}
      <section className="fx-facts">
        {FOUNDERS_FACTS.map((f) => (
          <div className="fx-fact" key={f.n}>
            <div className="fx-fact-n">{f.n}</div>
            <div className="fx-fact-head">{f.head}</div>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      {/* ---- the ledger ---------------------------------------------------- */}
      <section id="ledger" className="fx-ledger">
        <div className="fx-ledger-head">
          <h2>Every surface on the garment.</h2>
          <p>
            Turn the garment above to find one, or take it from the list. Nothing here has a public
            price — the number depends on the surface and the run.
          </p>
        </div>

        <div className="fx-tabs" role="tablist" aria-label="Garment">
          {FOUNDERS_GARMENTS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`fx-tab${tab === id ? ' is-on' : ''}`}
              onClick={() => setTab(id)}
            >
              {GARMENTS[id].label}
              <span className="fx-tab-n">{docs[id]?.slots.length ?? '—'}</span>
            </button>
          ))}
        </div>

        <ol className="fx-rows">
          {slots.map((slot, i) => {
            const holder = TAKEN[`${tab}:${slot.id}`];
            return (
              <li className={`fx-row${holder ? ' is-taken' : ''}`} key={slot.id}>
                <span className="fx-row-i">{String(i + 1).padStart(2, '0')}</span>
                <span className="fx-row-mark" aria-hidden="true">
                  {holder ? <span className="fx-block">{holder.charAt(0)}</span> : <span className="fx-open" />}
                </span>
                <span className="fx-row-name">{slot.label}</span>
                <span className="fx-row-why">{slot.why}</span>
                <span className="fx-row-act">
                  {holder ? (
                    <span className="fx-row-taken">Taken by {holder}</span>
                  ) : (
                    <button type="button" className="fx-row-btn" onClick={() => ask(tab, slot.label)}>
                      Ask
                    </button>
                  )}
                </span>
              </li>
            );
          })}
          {!slots.length && <li className="fx-row fx-row-empty">Loading the slot map…</li>}
        </ol>
      </section>

      {/* ---- the thesis ---------------------------------------------------- */}
      <section className="fx-thesis">
        <h2>Every person at a conference is unsold advertising space.</h2>
        <p>
          The rest of the market sells you a stand and a hope. This sells you a surface on a person
          who is already in the room, and proof that it was worn.
        </p>
      </section>

      {/* ---- how the money moves ------------------------------------------- */}
      <section className="fx-steps">
        <h2>Money moves last.</h2>
        <div className="fx-steps-grid">
          <div className="fx-step">
            <div className="fx-step-n">1</div>
            <div className="fx-step-h">Take the slot.</div>
            <p>You pick the surface. We agree what a run is and what counts as proof before anyone prints anything.</p>
          </div>
          <div className="fx-step">
            <div className="fx-step-n">2</div>
            <div className="fx-step-h">Escrow holds it.</div>
            <p>Your payment locks before the garments are made. Neither side can move it while it sits there.</p>
          </div>
          <div className="fx-step">
            <div className="fx-step-n">3</div>
            <div className="fx-step-h">Proof releases it.</div>
            <p>Photos of the run and of the garment worn at the event. Nothing arrives, nothing is paid.</p>
          </div>
        </div>
      </section>

      <div ref={formRef}>
        <EnquiryForm asking={asking} slots={docs} onClear={() => setAsking('')} />
      </div>

      <footer className="fx-foot">
        <span>buysash.fun</span>
        <span>The slot in our own logo is for sale too.</span>
        <span>@buysashdot</span>
      </footer>
    </div>
  );
}

/* ---------------- enquiry form ---------------- */

type Fields = { name: string; email: string; org: string; slot: string; handle: string };
type Errors = Partial<Record<keyof Fields | 'form', string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HANDLE = /^@?[A-Za-z0-9_]{1,15}$/;

function EnquiryForm({
  asking,
  slots,
  onClear,
}: {
  asking: string;
  slots: Docs;
  onClear: () => void;
}) {
  const [f, setF] = useState<Fields>({ name: '', email: '', org: '', slot: '', handle: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (asking) setF((prev) => ({ ...prev, slot: asking }));
  }, [asking]);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const options = FOUNDERS_GARMENTS.flatMap((id) =>
    (slots[id]?.slots ?? []).map((s) => `${GARMENTS[id].label}, ${s.label.toLowerCase()}`),
  );

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Errors = {};
    if (!f.name.trim()) e.name = 'Enter the name we should write to.';
    if (!f.email.trim()) e.email = 'Enter an email address.';
    else if (!EMAIL.test(f.email.trim())) e.email = 'That address is missing an @ or a domain. Check it and try again.';
    if (!f.org.trim()) e.org = 'Tell us who this is for.';
    if (f.handle.trim() && !HANDLE.test(f.handle.trim()))
      e.handle = 'That is not a handle. Letters, numbers and underscores, up to 15.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const res = await fetch('/api/slot-enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrors(data.errors ?? { form: 'We could not save that. Try again in a moment.' });
        return;
      }
      setDone(f.slot ? f.slot : 'a slot we will help you pick');
      onClear();
    } catch {
      setErrors({ form: 'The network dropped that. Try again in a moment.' });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section id="ask" className="fx-ask">
        <div className="fx-ask-card">
          <div className="card-h">We have it.</div>
          <p>
            We will come back with the number for <strong>{done}</strong>, what a run covers, and when
            the next one prints.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="ask" className="fx-ask">
      <div className="fx-ask-card">
        <form onSubmit={submit} noValidate>
          <div>
            <div className="card-h">Ask for the price.</div>
            <p className="lede">
              There is no list price. The number depends on the surface and the size of the run, so
              tell us which one you want and we will come back with it.
            </p>
          </div>

          {errors.form && <div className="form-note">{errors.form}</div>}

          <label>
            <span>Name</span>
            <input type="text" autoComplete="name" value={f.name} onChange={set('name')} aria-invalid={!!errors.name} />
            {errors.name && <span className="err">{errors.name}</span>}
          </label>

          <label>
            <span>Email</span>
            <input type="email" autoComplete="email" value={f.email} onChange={set('email')} aria-invalid={!!errors.email} />
            {errors.email && <span className="err">{errors.email}</span>}
          </label>

          <label>
            <span>Brand or fund</span>
            <input type="text" autoComplete="organization" value={f.org} onChange={set('org')} aria-invalid={!!errors.org} />
            {errors.org && <span className="err">{errors.org}</span>}
          </label>

          <label>
            <span>Which surface</span>
            <select value={f.slot} onChange={set('slot')}>
              <option value="">Not sure yet</option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Your X handle</span>
            <input type="text" autoComplete="off" value={f.handle} onChange={set('handle')} aria-invalid={!!errors.handle} />
            {errors.handle && <span className="err">{errors.handle}</span>}
          </label>

          <button className="btn btn-solid btn-lg" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Ask for the price'}
          </button>
        </form>
      </div>
    </section>
  );
}
