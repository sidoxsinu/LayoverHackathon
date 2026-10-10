-- 0001_init.sql
-- Initial schema for GATE app

-- Profiles table: automatically created via trigger when a new user signs up
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Layovers table: tracks each layover session
-- id is a UUID generated on the client (so upserts are idempotent if offline save retries)
create table public.layovers (
  id uuid primary key,
  user_id uuid not null references auth.users default auth.uid(),
  location text not null,
  gate text,
  departure_at timestamptz not null,
  return_by_at timestamptz not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  survived_seconds integer not null default 0,
  xp integer not null default 0,
  missions_done integer not null default 0,
  missions_skipped integer not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz default now()
);

-- Mission Log table: tracks individual missions within a layover
create table public.mission_log (
  id uuid primary key default gen_random_uuid(),
  layover_id uuid not null references public.layovers on delete cascade,
  user_id uuid not null references auth.users default auth.uid(),
  mission_code text not null,
  title text not null,
  status text not null check (status in ('done', 'completed', 'skipped')),
  xp integer not null default 0,
  created_at timestamptz default now()
);

-- Indexes for performance
create index layovers_user_id_idx on public.layovers(user_id);
create index mission_log_user_id_idx on public.mission_log(user_id);
create index mission_log_layover_id_idx on public.mission_log(layover_id);

-- --------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.layovers enable row level security;
alter table public.mission_log enable row level security;

-- Profiles: Users can read and update only their own profile
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Layovers: Users can insert, read, update, delete only their own layovers
create policy "Users can read own layovers" on public.layovers
  for select using (auth.uid() = user_id);

create policy "Users can insert own layovers" on public.layovers
  for insert with check (auth.uid() = user_id);

create policy "Users can update own layovers" on public.layovers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own layovers" on public.layovers
  for delete using (auth.uid() = user_id);

-- Mission Log: Users can insert, read, update, delete only their own mission logs
create policy "Users can read own mission_log" on public.mission_log
  for select using (auth.uid() = user_id);

create policy "Users can insert own mission_log" on public.mission_log
  for insert with check (auth.uid() = user_id);

create policy "Users can update own mission_log" on public.mission_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own mission_log" on public.mission_log
  for delete using (auth.uid() = user_id);

-- --------------------------------------------------------
-- TRIGGERS
-- --------------------------------------------------------

-- Trigger to create a profile automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
