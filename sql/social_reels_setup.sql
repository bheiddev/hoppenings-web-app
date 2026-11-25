-- Hoppenings social reels: columns for Remotion MP4 pipeline.
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table public.social_posts
  add column if not exists slide_specs jsonb,
  add column if not exists reel_url text,
  add column if not exists reel_status text
    check (reel_status is null or reel_status in ('rendering','ready','failed','published')),
  add column if not exists reel_error text,
  add column if not exists reel_rendered_at timestamptz,
  add column if not exists reel_media_id text,
  add column if not exists reel_permalink text;

alter table public.brand_profiles
  add column if not exists reel_audio_url text;
