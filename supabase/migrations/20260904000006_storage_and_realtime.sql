-- =============================================================================
-- Migration 0006: storage buckets + realtime publication
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',   'avatars',   true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('community', 'community', true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('events',    'events',    true, 5242880,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Path convention: <bucket>/<user_id>/<filename>. Users may only write inside their own folder.
create policy "public read images" on storage.objects
  for select using (bucket_id in ('avatars','community','events'));

create policy "users upload own folder" on storage.objects
  for insert with check (
    bucket_id in ('avatars','community','events')
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own folder" on storage.objects
  for update using (
    bucket_id in ('avatars','community','events')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own folder" on storage.objects
  for delete using (
    bucket_id in ('avatars','community','events')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Realtime: chat + notifications
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activities;
alter table public.messages replica identity full;
