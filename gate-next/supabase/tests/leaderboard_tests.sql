-- supabase/tests/leaderboard_tests.sql
-- Security, RLS, and Anti-Farming Unit Checks for GATE Leaderboard
-- Run in Supabase SQL Editor to verify security invariant and math guarantees.

-- Status: NOT RUN (Requires active Supabase database / psql connection)
-- Follow the step-by-step instructions below in the Supabase SQL editor.

/*
================================================================================
MANUAL TEST VERIFICATION SUITE:
================================================================================
1. TEST: Case-insensitive handle uniqueness & validation
   -- Attempt to join with valid handle
   select public.join_leaderboard('TRAVELER_ONE'); -- Expect 'OK' (when authenticated)

   -- Attempt to join with duplicate handle in different casing
   -- User B invokes:
   select public.join_leaderboard('traveler_one'); -- Expect 'HANDLE TAKEN'

   -- Attempt invalid handle syntax
   select public.join_leaderboard('hi');           -- Expect 'HANDLE INVALID' (<3 chars)
   select public.join_leaderboard('bad-char!');    -- Expect 'HANDLE INVALID' (invalid char)

2. TEST: Reserved system handles & blocklist rejection
   select public.join_leaderboard('GATE');         -- Expect 'HANDLE NOT ALLOWED'
   select public.join_leaderboard('ADMIN');        -- Expect 'HANDLE NOT ALLOWED'
   select public.join_leaderboard('YOU');          -- Expect 'HANDLE NOT ALLOWED'
   select public.join_leaderboard('MOD');          -- Expect 'HANDLE NOT ALLOWED'
   select public.join_leaderboard('SUPPORT');      -- Expect 'HANDLE NOT ALLOWED'
   select public.join_leaderboard('ANONYMOUS');    -- Expect 'HANDLE NOT ALLOWED'

3. TEST: RLS Multi-Tenant Isolation
   -- Authenticated as User A (auth.uid() = '00000000-0000-0000-0000-00000000000a')
   -- User A can see their own membership
   select * from public.leaderboard_members; -- Returns User A's row only

   -- Authenticated as User B (auth.uid() = '00000000-0000-0000-0000-00000000000b')
   -- User B cannot select User A's row
   select * from public.leaderboard_members; -- Returns User B's row only, User A is invisible

   -- User B cannot update User A's membership
   update public.leaderboard_members set handle = 'HACKED'
   where user_id = '00000000-0000-0000-0000-00000000000a'; -- Affects 0 rows

   -- User B cannot delete User A's membership
   delete from public.leaderboard_members
   where user_id = '00000000-0000-0000-0000-00000000000a'; -- Affects 0 rows

4. TEST: Anonymous caller privileges
   -- As anon (no auth session):
   select * from public.leaderboard_members; -- Expect: ERROR: permission denied for table leaderboard_members
   -- But anon CAN call get_leaderboard:
   select * from public.get_leaderboard('all', null, 50); -- Returns sanitized public board rows, is_me = false

5. TEST: Zero user_id or email leakage
   -- get_leaderboard returns strictly: (position, handle, total_xp, layovers, missions, is_me)
   -- It NEVER returns user_id, email, or any UUID/identity.

6. TEST: Hidden member exclusion (Dashboard moderation)
   -- Admin sets user A to hidden via dashboard:
   update public.leaderboard_members set hidden = true
   where handle = 'TRAVELER_ONE';

   -- Query get_leaderboard:
   select * from public.get_leaderboard('all', null, 50); -- 'TRAVELER_ONE' is completely omitted

7. TEST: Anti-farming per-layover cap
   -- Given a layover with survived_seconds = 180 (3 minutes) and 5 completed missions:
   -- Duration = 3.0 minutes
   -- max_allowed_missions = ceil(3.0 / 3.0) = 1 mission
   -- Even with 5 missions logged in mission_log, only the first 1 mission counts towards total_xp!
   -- Counted XP is capped at 1 * (40 + 20) = 60 XP.

8. TEST: Handle change cooldown
   -- User A changes handle:
   select public.join_leaderboard('NEW_HANDLE'); -- Expect 'OK'
   -- User A attempts immediate change within 1 hour:
   select public.join_leaderboard('ANOTHER_HANDLE'); -- Expect 'HANDLE CHANGE TOO SOON'
================================================================================
*/
