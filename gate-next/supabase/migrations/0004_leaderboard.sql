-- 0004_leaderboard.sql
-- Opt-in, handle-based, server-computed leaderboard with anti-farming protection
-- Re-runnable migration for GATE

-- ========================================================
-- 1. LEADERBOARD MEMBERS TABLE
-- ========================================================

create table if not exists public.leaderboard_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text not null check (handle ~ '^[A-Za-z0-9_]{3,16}$'),
  hidden boolean not null default false,
  joined_at timestamptz not null default now(),
  handle_changed_at timestamptz not null default now()
);

-- Case-insensitive uniqueness for handles
create unique index if not exists leaderboard_members_lower_handle_idx
  on public.leaderboard_members (lower(handle));

-- ========================================================
-- 2. HANDLE VALIDATION & PROFANITY / RESERVED BLOCKLIST
-- ========================================================

create or replace function public.is_handle_blocked(p_handle text)
returns boolean
language plpgsql
immutable
as $$
declare
  v_clean text;
begin
  if p_handle is null or char_length(trim(p_handle)) < 3 then
    return true;
  end if;

  v_clean := upper(trim(p_handle));

  -- Reserved system identifiers
  if v_clean in ('GATE', 'ADMIN', 'MOD', 'SUPPORT', 'STAFF', 'ANONYMOUS', 'YOU', 'SYSTEM', 'ROOT', 'OFFICIAL', 'MODERATOR') then
    return true;
  end if;

  -- Normalize string: remove underscores and substitute digits-as-letters
  v_clean := replace(v_clean, '_', '');
  v_clean := replace(v_clean, '0', 'O');
  v_clean := replace(v_clean, '1', 'I');
  v_clean := replace(v_clean, '3', 'E');
  v_clean := replace(v_clean, '4', 'A');
  v_clean := replace(v_clean, '5', 'S');
  v_clean := replace(v_clean, '7', 'T');
  v_clean := replace(v_clean, '8', 'B');

  -- Obvious slurs and profanity pattern
  if v_clean ~* '(FUCK|SHIT|BITCH|ASSHOLE|BASTARD|SLUT|WHORE|DICK|COCK|PUSSY|CUNT|NIGG|FAGG|NAZI|HITLER|KILL|RAPE)' then
    return true;
  end if;

  return false;
end;
$$;

-- Guard trigger for member table mutations
create or replace function public.handle_leaderboard_member_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Validate format: 3-16 chars, alphanumeric and underscore
  if new.handle !~ '^[A-Za-z0-9_]{3,16}$' then
    raise exception 'HANDLE_INVALID';
  end if;

  -- Validate against blocklist and reserved handles
  if public.is_handle_blocked(new.handle) then
    raise exception 'HANDLE_NOT_ALLOWED';
  end if;

  -- Cooldown guard: limit handle changes to once per hour
  if tg_op = 'UPDATE' and lower(old.handle) is distinct from lower(new.handle) then
    if now() < old.handle_changed_at + interval '1 hour' then
      raise exception 'HANDLE_CHANGE_TOO_SOON';
    end if;
    new.handle_changed_at := now();
  end if;

  -- Moderation guard: 'hidden' column is writable only by service role
  -- If invoked by an authenticated user, prevent changing hidden state
  if tg_op = 'UPDATE' and old.hidden is distinct from new.hidden then
    if auth.uid() is not null then
      new.hidden := old.hidden;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists leaderboard_members_guard_trigger on public.leaderboard_members;
create trigger leaderboard_members_guard_trigger
  before insert or update on public.leaderboard_members
  for each row
  execute function public.handle_leaderboard_member_guard();

-- ========================================================
-- 3. ROW LEVEL SECURITY ON LEADERBOARD MEMBERS
-- ========================================================

alter table public.leaderboard_members enable row level security;

drop policy if exists "Members can select own membership" on public.leaderboard_members;
create policy "Members can select own membership" on public.leaderboard_members
  for select
  using (auth.uid() = user_id);

drop policy if exists "Members can insert own membership" on public.leaderboard_members;
create policy "Members can insert own membership" on public.leaderboard_members
  for insert
  with check (auth.uid() = user_id and hidden = false);

drop policy if exists "Members can update own membership" on public.leaderboard_members;
create policy "Members can update own membership" on public.leaderboard_members
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Members can delete own membership" on public.leaderboard_members;
create policy "Members can delete own membership" on public.leaderboard_members
  for delete
  using (auth.uid() = user_id);

-- Revoke all table privileges from anon. Public read happens strictly via get_leaderboard RPC.
revoke all on public.leaderboard_members from anon;

-- ========================================================
-- 4. JOIN & LEAVE FUNCTIONS (RPC)
-- ========================================================

create or replace function public.join_leaderboard(p_handle text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.leaderboard_members%rowtype;
  v_taken boolean;
begin
  if v_user_id is null then
    return 'NOT SIGNED IN';
  end if;

  if p_handle is null or p_handle !~ '^[A-Za-z0-9_]{3,16}$' then
    return 'HANDLE INVALID';
  end if;

  if public.is_handle_blocked(p_handle) then
    return 'HANDLE NOT ALLOWED';
  end if;

  -- Check if handle is taken by another member
  select exists (
    select 1 from public.leaderboard_members
    where lower(handle) = lower(p_handle) and user_id != v_user_id
  ) into v_taken;

  if v_taken then
    return 'HANDLE TAKEN';
  end if;

  select * into v_existing
  from public.leaderboard_members
  where user_id = v_user_id;

  if found then
    if lower(v_existing.handle) = lower(p_handle) then
      update public.leaderboard_members
      set handle = p_handle
      where user_id = v_user_id;
      return 'OK';
    end if;

    if now() < v_existing.handle_changed_at + interval '1 hour' then
      return 'HANDLE CHANGE TOO SOON';
    end if;

    update public.leaderboard_members
    set handle = p_handle,
        handle_changed_at = now()
    where user_id = v_user_id;
    return 'OK';
  else
    insert into public.leaderboard_members (user_id, handle, hidden, joined_at, handle_changed_at)
    values (v_user_id, p_handle, false, now(), now());
    return 'OK';
  end if;
exception
  when others then
    return 'ERROR';
end;
$$;

create or replace function public.leave_leaderboard()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return 'NOT SIGNED IN';
  end if;

  delete from public.leaderboard_members
  where user_id = v_user_id;

  return 'OK';
end;
$$;

grant execute on function public.join_leaderboard(text) to authenticated;
grant execute on function public.leave_leaderboard() to authenticated;
revoke all on function public.join_leaderboard(text) from anon, public;
revoke all on function public.leave_leaderboard() from anon, public;
grant execute on function public.join_leaderboard(text) to authenticated;
grant execute on function public.leave_leaderboard() to authenticated;

-- ========================================================
-- 5. GET_LEADERBOARD FUNCTION (RPC)
-- ========================================================
-- ANTI-FARMING CAP CONSTANT:
-- Max 1 mission counted per 3 minutes of layover duration (minimum 1).
-- Each mission contributes max 40 mission XP + 20 proof XP.
-- Thus, counted XP per layover <= ceil(duration_minutes / 3) * 60.

drop function if exists public.get_leaderboard(text, text, int);

create or replace function public.get_leaderboard(
  p_scope text default 'all',
  p_venue text default null,
  p_limit int default 50
)
returns table (
  "position" int,
  handle text,
  total_xp int,
  layovers int,
  missions int,
  is_me boolean
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_caller_id uuid := auth.uid();
  v_limit int := greatest(1, least(100, coalesce(p_limit, 50)));
  v_scope text := lower(coalesce(p_scope, 'all'));
  v_venue text := upper(trim(coalesce(p_venue, '')));
begin
  -- For venue scope, if no venue is provided, return zero rows immediately
  if v_scope = 'venue' and (v_venue is null or v_venue = '') then
    return;
  end if;

  return query
  with active_members as (
    -- Only opted-in members who are not hidden
    select m.user_id, m.handle
    from public.leaderboard_members m
    where m.hidden = false
  ),
  filtered_layovers as (
    select
      l.id,
      l.user_id,
      l.location,
      l.survived_seconds,
      l.started_at,
      l.ended_at,
      l.created_at,
      -- Duration in minutes: use survived_seconds if available, else (ended_at - started_at), min 1 minute
      greatest(
        1.0,
        coalesce(
          nullif(l.survived_seconds, 0) / 60.0,
          extract(epoch from (coalesce(l.ended_at, l.created_at) - l.started_at)) / 60.0,
          1.0
        )
      ) as duration_minutes
    from public.layovers l
    join active_members am on am.user_id = l.user_id
    where (
      case
        when v_scope = 'week' then coalesce(l.ended_at, l.created_at) >= now() - interval '7 days'
        when v_scope = 'venue' then upper(trim(l.location)) = v_venue
        else true
      end
    )
  ),
  ranked_missions as (
    select
      ml.layover_id,
      ml.user_id,
      -- Clamp mission XP (0..40) and proof XP (0..20)
      (greatest(0, least(40, coalesce(ml.xp, 0))) + greatest(0, least(20, coalesce(ml.proof_xp, 0)))) as capped_xp,
      row_number() over (
        partition by ml.layover_id
        order by ml.created_at asc
      ) as mission_num,
      -- ANTI-FARMING CAP: Max 1 mission per 3 minutes of layover duration (min 1)
      greatest(1, ceil(fl.duration_minutes / 3.0))::int as max_allowed_missions
    from public.mission_log ml
    join filtered_layovers fl on fl.id = ml.layover_id
    where ml.status in ('done', 'completed')
  ),
  counted_missions as (
    -- Filter out missions exceeding the per-layover cap
    select
      rm.layover_id,
      rm.user_id,
      rm.capped_xp
    from ranked_missions rm
    where rm.mission_num <= rm.max_allowed_missions
  ),
  user_aggregates as (
    select
      am.user_id,
      am.handle,
      coalesce(count(distinct fl.id), 0)::int as total_layovers,
      coalesce(count(cm.capped_xp), 0)::int as total_missions,
      coalesce(sum(cm.capped_xp), 0)::int as total_xp
    from active_members am
    left join filtered_layovers fl on fl.user_id = am.user_id
    left join counted_missions cm on cm.layover_id = fl.id and cm.user_id = am.user_id
    where (
      case
        when v_scope = 'venue' then fl.id is not null
        else true
      end
    )
    group by am.user_id, am.handle
  ),
  ranked_board as (
    select
      row_number() over (order by ua.total_xp desc, ua.total_missions desc, ua.handle asc)::int as pos,
      upper(ua.handle) as formatted_handle,
      ua.total_xp,
      ua.total_layovers,
      ua.total_missions,
      (ua.user_id = v_caller_id) as caller_is_me
    from user_aggregates ua
  )
  -- Return top v_limit entries
  select
    rb.pos as "position",
    rb.formatted_handle as handle,
    rb.total_xp,
    rb.total_layovers as layovers,
    rb.total_missions as missions,
    rb.caller_is_me as is_me
  from ranked_board rb
  where rb.pos <= v_limit

  union all

  -- If authenticated caller is outside top v_limit, append their true position row
  select
    rb.pos as "position",
    rb.formatted_handle as handle,
    rb.total_xp,
    rb.total_layovers as layovers,
    rb.total_missions as missions,
    true as is_me
  from ranked_board rb
  where rb.caller_is_me = true
    and rb.pos > v_limit

  order by 1 asc;
end;
$$;

grant execute on function public.get_leaderboard(text, text, int) to anon, authenticated;
revoke all on function public.get_leaderboard(text, text, int) from public;
grant execute on function public.get_leaderboard(text, text, int) to anon, authenticated;

-- ========================================================
-- 6. PERFORMANCE INDEXES
-- ========================================================

create index if not exists layovers_location_idx on public.layovers (upper(trim(location)));
create index if not exists layovers_ended_at_idx on public.layovers (ended_at);
create index if not exists mission_log_status_idx on public.mission_log (status);
