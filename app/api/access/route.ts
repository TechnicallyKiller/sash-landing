import { NextResponse } from 'next/server';
import { saveSignup, hasDatabase } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HANDLE = /^@?[A-Za-z0-9_]{1,15}$/;

type Body = Partial<Record<'name' | 'email' | 'role' | 'handle' | 'event' | 'asking', string>>;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: { form: 'Send JSON.' } }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const role = (body.role || '').trim();
  const handle = (body.handle || '').trim();
  const event = (body.event || '').trim();
  const asking = (body.asking || '').trim();

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Enter the name we should write to.';
  if (!email) errors.email = 'Enter an email address.';
  else if (!EMAIL.test(email)) errors.email = 'That address is missing an @ or a domain. Check it and try again.';
  if (!['Brand', 'Creator', 'Agency'].includes(role)) errors.role = 'Pick one so we send you the right list.';
  if (handle && !HANDLE.test(handle)) errors.handle = 'That is not a handle. Letters, numbers and underscores, up to 15.';

  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  try {
    const result = await saveSignup({
      name,
      email,
      role,
      handle: handle ? (handle.startsWith('@') ? handle : '@' + handle) : null,
      event: event || null,
      asking: asking || null,
    });
    return NextResponse.json({ ok: true, status: result, stored: hasDatabase ? 'database' : 'memory' });
  } catch (err) {
    console.error('[sash] signup failed', err);
    return NextResponse.json(
      { ok: false, errors: { form: 'We could not save that. Try again in a moment.' } },
      { status: 500 },
    );
  }
}
