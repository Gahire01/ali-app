-- 0003_storage.sql
-- Storage buckets + policies for ALI Boxing Club.

-- Public buckets so uploaded images/videos load without auth headers.
insert into storage.buckets (id, name, public) values
  ('club-media', 'club-media', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ── avatars bucket ───────────────────────────────────────────────────────
-- Anyone authenticated may manage their own avatar file at avatars/{uid}.jpg.
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'avatars'
    and storage.filename(name) = (auth.uid()::text || '.jpg')
    and coalesce(new.metadata ->> 'mimetype', '') in ('image/jpeg', 'image/png', 'image/webp')
  );

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'avatars'
    and storage.filename(name) = (auth.uid()::text || '.jpg')
  ) with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'avatars'
    and storage.filename(name) = (auth.uid()::text || '.jpg')
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'avatars'
    and storage.filename(name) = (auth.uid()::text || '.jpg')
  );

-- ── club-media bucket ────────────────────────────────────────────────────
-- Approved members + staff can read. Staff can write everything (posts,
-- session media). Any authenticated member may also write their own avatar
-- at club-media/avatars/{uid}.jpg (matches the app upload path).
create policy "club_media_select_approved" on storage.objects
  for select using (
    bucket_id = 'club-media'
    and (public.is_approved_player() or public.is_staff())
  );

create policy "club_media_insert" on storage.objects
  for insert with check (
    bucket_id = 'club-media'
    and (
      public.is_staff()
      or (
        (storage.foldername(name))[1] = 'avatars'
        and storage.filename(name) = (auth.uid()::text || '.jpg')
        and coalesce(new.metadata ->> 'mimetype', '') in ('image/jpeg', 'image/png', 'image/webp')
      )
    )
  );

create policy "club_media_update" on storage.objects
  for update using (
    bucket_id = 'club-media'
    and (
      public.is_staff()
      or (
        (storage.foldername(name))[1] = 'avatars'
        and storage.filename(name) = (auth.uid()::text || '.jpg')
      )
    )
  ) with check (
    bucket_id = 'club-media'
    and (
      public.is_staff()
      or (
        (storage.foldername(name))[1] = 'avatars'
        and storage.filename(name) = (auth.uid()::text || '.jpg')
      )
    )
  );

create policy "club_media_delete" on storage.objects
  for delete using (
    bucket_id = 'club-media'
    and (
      public.is_staff()
      or (
        (storage.foldername(name))[1] = 'avatars'
        and storage.filename(name) = (auth.uid()::text || '.jpg')
      )
    )
  );