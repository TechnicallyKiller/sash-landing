/* One-off: create the signups table. Run with `npm run db:init`.
   Needs DATABASE_URL in .env.local (or the environment). */

import postgres from 'postgres';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local first.');
  process.exit(1);
}

const sql = postgres(url, {
  ssl: url.includes('sslmode=disable') ? false : 'require',
  max: 1,
  prepare: false, // works through PgBouncer / Supabase's transaction pooler
});

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

const [{ n }] = await sql`select count(*)::text as n from signups`;
console.log(`signups table ready. ${n} row(s).`);
await sql.end();
