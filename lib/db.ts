/* Waitlist storage.

   Uses Postgres when DATABASE_URL is set (Vercel Postgres, Neon, Supabase,
   anything that speaks the wire protocol). Without it the app still runs:
   signups are kept in memory for the life of the process so local dev and
   preview deploys work before a database is attached. */

import postgres from 'postgres';

export type Signup = {
  name: string;
  email: string;
  role: string;
  handle?: string | null;
  event?: string | null;
  asking?: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __sashSql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __sashMemory: Signup[] | undefined;
}

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const hasDatabase = Boolean(url);

function client() {
  if (!url) return null;
  if (!global.__sashSql) {
    global.__sashSql = postgres(url, {
      ssl: url.includes('sslmode=disable') ? false : 'require',
      max: 1, // serverless: one connection per lambda
      idle_timeout: 20,
      connect_timeout: 10,
      // Supabase's transaction pooler (and PgBouncer generally) cannot hold
      // prepared statements across a pooled connection. Costs nothing here.
      prepare: false,
    });
  }
  return global.__sashSql;
}

/** Creates the table if it is missing. Safe to call on every write. */
async function ensure(sql: NonNullable<ReturnType<typeof client>>) {
  await sql`
    create table if not exists signups (
      id          bigserial primary key,
      name        text        not null,
      email       text        not null,
      role        text        not null,
      handle      text,
      event       text,
      asking      text,
      created_at  timestamptz not null default now()
    )
  `;
  await sql`create unique index if not exists signups_email_key on signups (lower(email))`;
}

/** Returns 'new' for a fresh signup, 'repeat' when that email is already listed. */
export async function saveSignup(s: Signup): Promise<'new' | 'repeat'> {
  const sql = client();

  if (!sql) {
    global.__sashMemory = global.__sashMemory || [];
    const seen = global.__sashMemory.some((r) => r.email.toLowerCase() === s.email.toLowerCase());
    global.__sashMemory.push(s);
    console.warn('[sash] DATABASE_URL is not set — signup kept in memory only:', s.email);
    return seen ? 'repeat' : 'new';
  }

  await ensure(sql);
  const rows = await sql<{ inserted: boolean }[]>`
    insert into signups (name, email, role, handle, event, asking)
    values (${s.name}, ${s.email}, ${s.role}, ${s.handle ?? null}, ${s.event ?? null}, ${s.asking ?? null})
    on conflict (lower(email)) do update
      set name = excluded.name,
          role = excluded.role,
          handle = coalesce(excluded.handle, signups.handle),
          event = coalesce(excluded.event, signups.event),
          asking = coalesce(excluded.asking, signups.asking)
    returning (xmax = 0) as inserted
  `;
  return rows[0]?.inserted ? 'new' : 'repeat';
}

export async function countSignups(): Promise<number | null> {
  const sql = client();
  if (!sql) return global.__sashMemory ? global.__sashMemory.length : 0;
  await ensure(sql);
  const rows = await sql<{ n: string }[]>`select count(*)::text as n from signups`;
  return Number(rows[0].n);
}
