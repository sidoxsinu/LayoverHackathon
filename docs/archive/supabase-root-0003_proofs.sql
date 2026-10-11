-- 0003_proofs.sql
-- Mission photo proofs schema and storage bucket configuration

-- 1. Alter mission_log table with proof fields
alter table public.mission_log
  add column if not exists proof_path text,
  add column if not exists proof_status text not null default 'none' check (proof_status in ('none', 'unverified', 'pending', 'verified', 'rejected')),
  add column if not exists proof_checked_at timestamptz,
  add column if not exists proof_note text,
  add column if not exists proof_xp integer not null default 0;

-- 2. Create private storage bucket for proofs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', false, 1048576, array['image/jpeg'])
on conflict (id) do update set
  public = false,
  file_size_limit = 1048576,
  allowed_mime_types = array['image/jpeg'];

-- 3. Storage Row Level Security policies on storage.objects for bucket 'proofs'
-- Path format: {user_id}/{layover_id}/{log_id}.jpg
-- (storage.foldername(name))[1] evaluates to {user_id}

drop policy if exists "Users can read own proofs" on storage.objects;
create policy "Users can read own proofs" on storage.objects
  for select
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can upload own proofs" on storage.objects;
create policy "Users can upload own proofs" on storage.objects
  for insert
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own proofs" on storage.objects;
create policy "Users can update own proofs" on storage.objects
  for update
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own proofs" on storage.objects;
create policy "Users can delete own proofs" on storage.objects
  for delete
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
