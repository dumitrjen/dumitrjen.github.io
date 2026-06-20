create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text,
  global_grams integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- For the no-auth first version of this app, keep RLS disabled on these tables.
-- If you enable RLS later, you must add policies for select/insert/update/delete.
alter table events disable row level security;
alter table products disable row level security;
alter table ratings disable row level security;
