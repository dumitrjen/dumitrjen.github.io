create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text,
  global_grams integer not null default 0,
  shopping_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table events
  add column if not exists shopping_state jsonb not null default '{}'::jsonb;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  category text not null,
  price numeric not null default 0,
  pack_grams integer not null default 100,
  link text,
  created_at timestamptz not null default now()
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  person_name text not null,
  grams integer not null default 0,
  ratings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(event_id, person_name)
);

create index if not exists products_event_id_idx on products(event_id);
create index if not exists ratings_event_id_idx on ratings(event_id);

-- No-auth frontend version:
-- The GitHub Pages app uses the public Supabase anon key. These policies allow
-- that frontend to create/load/save events. Anyone with the event link can edit
-- the event. This is convenient, not private.
alter table events enable row level security;
alter table products enable row level security;
alter table ratings enable row level security;

drop policy if exists "events anon select" on events;
drop policy if exists "events anon insert" on events;
drop policy if exists "events anon update" on events;
drop policy if exists "events anon delete" on events;
drop policy if exists "products anon select" on products;
drop policy if exists "products anon insert" on products;
drop policy if exists "products anon update" on products;
drop policy if exists "products anon delete" on products;
drop policy if exists "ratings anon select" on ratings;
drop policy if exists "ratings anon insert" on ratings;
drop policy if exists "ratings anon update" on ratings;
drop policy if exists "ratings anon delete" on ratings;

create policy "events anon select" on events for select to anon using (true);
create policy "events anon insert" on events for insert to anon with check (true);
create policy "events anon update" on events for update to anon using (true) with check (true);
create policy "events anon delete" on events for delete to anon using (true);

create policy "products anon select" on products for select to anon using (true);
create policy "products anon insert" on products for insert to anon with check (true);
create policy "products anon update" on products for update to anon using (true) with check (true);
create policy "products anon delete" on products for delete to anon using (true);

create policy "ratings anon select" on ratings for select to anon using (true);
create policy "ratings anon insert" on ratings for insert to anon with check (true);
create policy "ratings anon update" on ratings for update to anon using (true) with check (true);
create policy "ratings anon delete" on ratings for delete to anon using (true);
