# Sash

Landing page for Sash — buy a slot on a person who is already going.

Next.js 15 (App Router) + React 19 + TypeScript. The hero is a live 3D garment: the
`.glb` models and their `*-slots.json` slot maps ship from `/public`, and every slot in
the map is drawn as a dashed, clickable rectangle you can stamp with your initials and
send straight into the early-access form.

## Run it

```bash
npm install
cp .env.example .env.local     # optional for local dev, see below
npm run dev                    # http://localhost:3000
```

```bash
npm run build && npm run start # production build
```

## Layout

```
app/
  layout.tsx            fonts, metadata, OG tags
  page.tsx              page composition (server component)
  globals.css           the whole design system, ~200 lines
  api/access/route.ts   POST /api/access — waitlist endpoint
components/
  GarmentViewer.tsx     three.js viewer: loads .glb, draws slots, handles picking
  Hero.tsx              hero copy + viewer (viewer is dynamic, ssr:false)
  Mission.tsx           word-by-word scroll reveal
  InventoryRail.tsx     the sideways inventory rail
  AccessForm.tsx        early-access form, validates then POSTs
  AskingContext.tsx     shared "which slot are you asking about" state
lib/
  inventory.ts          rail copy, garment manifest, per-slot pricing
  db.ts                 Postgres storage with an in-memory fallback
db/
  schema.sql            signups table
  init.mjs              `npm run db:init`
public/                 *.glb, *-slots.json, sash-logo.png
```

Adding a slot to a garment means adding it to its `public/*-slots.json` **and** giving it
a price in `LISTINGS` in `lib/inventory.ts`. Slots without a listing still render, priced
"Ask".

## Environment variables

Set these in Vercel under **Project → Settings → Environment Variables** (and in
`.env.local` for local dev). Only `DATABASE_URL` matters for the waitlist to persist.

| Variable | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | for persistence | Postgres connection string. Without it the app still builds and runs, but signups are kept in memory for the life of the serverless instance and a warning is logged. |
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical origin for `metadataBase` and OG tags, e.g. `https://sash.com`. If unset, Vercel's own `VERCEL_PROJECT_PRODUCTION_URL` is used on Vercel and `http://localhost:3000` locally — so you only need this once you have a custom domain. The `NEXT_PUBLIC_` prefix means the value is inlined into the browser bundle: never put a secret behind that prefix. |
| `RESEND_API_KEY` | no | Reserved for signup notification emails (not wired up yet). |
| `SIGNUP_NOTIFY_TO` | no | Address those notifications would go to. |

`POSTGRES_URL` is also read as a fallback, so a Vercel Postgres integration works without
renaming anything.

### Getting a database

Easiest path on Vercel: **Storage → Create Database → Neon (Postgres)**. Vercel injects
`DATABASE_URL`/`POSTGRES_URL` into every environment automatically; pull them locally with
`vercel env pull .env.local`.

### Supabase

Supabase works — it is plain Postgres, and nothing about the schema or queries is
Supabase-specific. Two things matter:

1. **Use a pooler connection string, not the direct one.** In the dashboard:
   **Project Settings → Database → Connection string → Transaction pooler**. It looks like
   `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`.
   The direct `db.<ref>.supabase.co:5432` host is IPv6-only, which Vercel's functions cannot
   reach without the IPv4 add-on.
2. **Prepared statements are off** (`prepare: false` in `lib/db.ts`), which is what the
   transaction pooler requires. Already handled — just do not remove it.

Paste that string as `DATABASE_URL`. The session pooler (port 5432) works too if you prefer
it. Row Level Security does not apply here: the route connects as the `postgres` role from
the server only, and nothing in the browser ever touches the database. If you later want
Supabase Auth or Storage, add `@supabase/supabase-js` alongside this — they do not conflict.

Neon, Railway and RDS work the same way. The connection string needs `?sslmode=require`
unless the host is local.

Create the table once:

```bash
npm run db:init      # reads DATABASE_URL from .env.local
```

or run `db/schema.sql` by hand. The API route also creates the table if it is missing, so a
fresh database heals itself on the first signup.

Table:

```sql
signups(id, name, email, role, handle, event, asking, created_at)
```

`email` is unique (case-insensitive); a repeat signup updates the row instead of erroring,
and the API returns `{ ok: true, status: "new" | "repeat" }`.

## Deploying to Vercel

```bash
npx vercel            # preview
npx vercel --prod     # production
```

Or push to GitHub and import the repo — Vercel detects Next.js, no build settings needed.
Set the environment variables above before the first production deploy. The `.glb` files
(~750 KB total) are served as static assets from `/public`, well inside Vercel's limits.

## Notes

- The viewer is loaded with `next/dynamic({ ssr: false })`, so three.js stays out of the
  server bundle and out of the initial payload (page JS is ~11 KB; three loads after).
- Orbit zoom is disabled on purpose so the mouse wheel still scrolls the page.
- Everything respects `prefers-reduced-motion`: no auto-rotate, no scroll reveal, no smooth
  scrolling.
