-- Hoppenings social reels: columns + Storage policies for Remotion MP4 pipeline.
-- Run in the Supabase SQL editor. Safe to re-run.

-- =============================================================================
-- 1) Columns (separate statements so a partial earlier run still completes)
-- =============================================================================

alter table public.social_posts add column if not exists slide_specs jsonb;
alter table public.social_posts add column if not exists reel_url text;
alter table public.social_posts add column if not exists reel_status text;
alter table public.social_posts add column if not exists reel_error text;
alter table public.social_posts add column if not exists reel_rendered_at timestamptz;
alter table public.social_posts add column if not exists reel_media_id text;
alter table public.social_posts add column if not exists reel_permalink text;

-- Status constraint (add only if missing)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'social_posts_reel_status_check'
      and conrelid = 'public.social_posts'::regclass
  ) then
    alter table public.social_posts
      add constraint social_posts_reel_status_check
      check (reel_status is null or reel_status in ('rendering','ready','failed','published'));
  end if;
end $$;

alter table public.brand_profiles add column if not exists reel_audio_url text;

-- Refresh PostgREST schema cache (fixes "column … not in the schema cache")
notify pgrst, 'reload schema';

-- =============================================================================
-- 2) Storage bucket `social`
--    Client-side "Build reel" uploads MP4s here as an authenticated admin.
--    Edge Functions (render-post) already write slide JPEGs via service_role.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social',
  'social',
  true,
  104857600, -- 100 MB
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Drop + recreate so re-runs stay idempotent
drop policy if exists "Public read social storage" on storage.objects;
drop policy if exists "Admins can upload social storage" on storage.objects;
drop policy if exists "Admins can update social storage" on storage.objects;
drop policy if exists "Admins can delete social storage" on storage.objects;

create policy "Public read social storage"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'social');

create policy "Admins can upload social storage"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'social'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.admin is true
    )
  );

create policy "Admins can update social storage"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'social'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.admin is true
    )
  )
  with check (
    bucket_id = 'social'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.admin is true
    )
  );

create policy "Admins can delete social storage"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'social'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.admin is true
    )
  );
