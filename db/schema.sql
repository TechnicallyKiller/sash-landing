create table if not exists signups (
  id          bigserial primary key,
  name        text        not null,
  email       text        not null,
  role        text        not null,
  handle      text,
  event       text,
  asking      text,
  created_at  timestamptz not null default now()
);

create unique index if not exists signups_email_key on signups (lower(email));

create table if not exists slot_enquiries (
  id          bigserial primary key,
  name        text        not null,
  email       text        not null,
  org         text        not null,
  slot        text,
  handle      text,
  note        text,
  created_at  timestamptz not null default now()
);
