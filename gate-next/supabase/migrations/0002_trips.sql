-- 0002_trips.sql
-- Trips schema, limits, RLS, and layover foreign key

-- 1. Trips table
create table if not exists public.trips (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) >= 1 and char_length(name) <= 60),
  location text check (location is null or char_length(location) <= 60),
  flight_no text check (flight_no is null or char_length(flight_no) <= 12),
  gate text check (gate is null or char_length(gate) <= 8),
  departure_at timestamptz not null,
  walk_min integer not null default 10 check (walk_min in (2, 5, 10, 15)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index on (user_id, departure_at)
create index if not exists trips_user_id_departure_at_idx on public.trips(user_id, departure_at);

-- Updated_at trigger function
create or replace function public.handle_trips_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
  before update on public.trips
  for each row
  execute procedure public.handle_trips_updated_at();

-- Max 50 trips per user trigger
create or replace function public.check_user_trip_limit()
returns trigger
language plpgsql
as $$
declare
  trip_count integer;
begin
  select count(*) into trip_count
  from public.trips
  where user_id = new.user_id;

  if trip_count >= 50 then
    raise exception 'Maximum limit of 50 trips reached per user.';
  end if;

  return new;
end;
$$;

drop trigger if exists trips_enforce_limit on public.trips;
create trigger trips_enforce_limit
  before insert on public.trips
  for each row
  execute procedure public.check_user_trip_limit();

-- 2. Row Level Security for trips
alter table public.trips enable row level security;

drop policy if exists "Users can select own trips" on public.trips;
create policy "Users can select own trips" on public.trips
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own trips" on public.trips;
create policy "Users can insert own trips" on public.trips
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own trips" on public.trips;
create policy "Users can update own trips" on public.trips
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own trips" on public.trips;
create policy "Users can delete own trips" on public.trips
  for delete using (auth.uid() = user_id);

-- 3. Modify layovers table
alter table public.layovers add column if not exists trip_id uuid null references public.trips(id) on delete set null;
alter table public.layovers add column if not exists trip_name text null;

-- Update layovers RLS policies to check trip_id ownership
drop policy if exists "Users can insert own layovers" on public.layovers;
drop policy if exists "Users can update own layovers" on public.layovers;

create policy "Users can insert own layovers" on public.layovers
  for insert with check (
    auth.uid() = user_id
    and (
      trip_id is null
      or exists (
        select 1 from public.trips t
        where t.id = trip_id and t.user_id = auth.uid()
      )
    )
  );

create policy "Users can update own layovers" on public.layovers
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      trip_id is null
      or exists (
        select 1 from public.trips t
        where t.id = trip_id and t.user_id = auth.uid()
      )
    )
  );
