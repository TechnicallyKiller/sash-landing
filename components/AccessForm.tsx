'use client';

import { useState } from 'react';
import { useAsking } from './AskingContext';

type Fields = { name: string; email: string; role: string; handle: string; event: string };
type Errors = Partial<Record<keyof Fields | 'form', string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HANDLE = /^@?[A-Za-z0-9_]{1,15}$/;

export default function AccessForm() {
  const { asking } = useAsking();
  const [f, setF] = useState<Fields>({ name: '', email: '', role: '', handle: '', event: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const validate = (): Errors => {
    const e: Errors = {};
    if (!f.name.trim()) e.name = 'Enter the name we should write to.';
    if (!f.email.trim()) e.email = 'Enter an email address.';
    else if (!EMAIL.test(f.email.trim())) e.email = 'That address is missing an @ or a domain. Check it and try again.';
    if (!f.role) e.role = 'Pick one so we send you the right list.';
    if (f.handle.trim() && !HANDLE.test(f.handle.trim()))
      e.handle = 'That is not a handle. Letters, numbers and underscores, up to 15.';
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...f, asking }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrors(data.errors ?? { form: 'We could not save that. Try again in a moment.' });
        return;
      }
      const handle = f.handle.trim();
      setSummary(
        [
          f.role,
          f.email.trim(),
          handle ? (handle.startsWith('@') ? handle : '@' + handle) : null,
          f.event.trim() ? `watching ${f.event.trim()}` : 'no event named yet',
        ]
          .filter(Boolean)
          .join(', ') + (asking ? `. Asking about ${asking}.` : ''),
      );
    } catch {
      setErrors({ form: 'The network dropped that. Try again in a moment.' });
    } finally {
      setBusy(false);
    }
  };

  if (summary !== null) {
    return (
      <section id="access" className="access">
        <div className="card">
          <div className="card-h">You are on the list.</div>
          <p>We will write once, when the first event opens, and tell you what is in it. Nothing else.</p>
          <div className="sent-summary">{summary}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="access" className="access">
      <div className="card">
        <form onSubmit={submit} noValidate>
          <div>
            <div className="card-h">Get early access.</div>
            <p className="lede">
              The first event is small on purpose. Tell us what you want and we will say whether it is in there.
            </p>
          </div>

          {asking && (
            <div className="asking">
              <span className="fine">You are asking about</span>
              <span>{asking}</span>
            </div>
          )}

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
            <span>You are</span>
            <select value={f.role} onChange={set('role')} aria-invalid={!!errors.role}>
              <option value="">Choose one</option>
              <option value="Brand">Brand</option>
              <option value="Creator">Creator</option>
              <option value="Agency">Agency</option>
            </select>
            {errors.role && <span className="err">{errors.role}</span>}
          </label>

          <label>
            <span>Your X handle</span>
            <input type="text" autoComplete="off" value={f.handle} onChange={set('handle')} aria-invalid={!!errors.handle} />
            {errors.handle && <span className="err">{errors.handle}</span>}
          </label>

          <label>
            <span>Event you care about</span>
            <input type="text" autoComplete="off" value={f.event} onChange={set('event')} />
          </label>

          <button className="btn btn-solid btn-lg" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Get early access'}
          </button>
        </form>
      </div>
    </section>
  );
}
