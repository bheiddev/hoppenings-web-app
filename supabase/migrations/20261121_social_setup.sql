-- =============================================================================
-- Hoppenings social posting: ONE setup script. Run once in the Supabase SQL editor.
-- =============================================================================
-- Before running: edit step 1 so it uses the site's EXISTING admin check.
-- Nothing else needs editing.

-- -----------------------------------------------------------------------------
-- 1. Admin check: REUSE the site's existing admin logic (no new admin list).
--    The Edge Functions call this, and the policies below use it, so the Social
--    tab follows exactly the same "who is an admin" rule as the rest of the admin.
--
--    Replace the `select false` line with the site's existing check, e.g.:
--      select public.is_admin()
--      select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
--      select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
--    Until it's replaced, everything fails closed with "Admins only".
-- -----------------------------------------------------------------------------
create or replace function public.is_social_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Same rule as site content admin (`profiles.admin` / canAccessContentAdmin).
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.admin is true
  )
$$;
grant execute on function public.is_social_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Brand settings (one row: colors, fonts, logos, handle, end-slide button)
-- -----------------------------------------------------------------------------
create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  colors jsonb not null default '{
    "primary": "#5D2525",
    "primary_dark": "#3A1515",
    "accent": "#F8C701",
    "cream": "#F9F7F2",
    "charcoal": "#1A1A1A",
    "text_primary": "#2D2926",
    "text_secondary": "#665E5A",
    "border": "#E5DFD6"
  }'::jsonb,
  fonts jsonb not null default '{}'::jsonb, -- { display, body_400, body_600, body_700 } URLs (.ttf/.otf/.woff); empty = defaults
  logo_url text,                            -- logo on maroon slides; empty = text wordmark
  logo_light_url text,                      -- logo on the cream end slide
  handle text not null default '@hoppenings',
  cta_text text not null default 'Get the app · Link in bio',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.brand_profiles (slug, name, is_default)
values ('hoppenings', 'Hoppenings', true)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- 3. Posts and the events in each post
-- -----------------------------------------------------------------------------
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  format text not null default 'daily_events',
  city text,
  post_date date not null,
  status text not null default 'draft'
    check (status in ('draft','rendering','pending_review','approved',
                      'publishing','published','failed','skipped')),
  caption text,
  cover_line text,
  highlight_event_ids uuid[] not null default '{}',  -- the (max 2) featured events
  image_urls text[] not null default '{}',           -- rendered slides, in order
  slide_count int not null default 0,
  brand_profile_id uuid references public.brand_profiles (id),
  used_llm boolean not null default false,
  ig_container_id text,
  ig_media_id text,
  permalink text,
  error text,
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  published_at timestamptz
);
create index if not exists social_posts_date_idx on public.social_posts (post_date desc);
create index if not exists social_posts_status_idx on public.social_posts (status);

create table if not exists public.social_post_items (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts (id) on delete cascade,
  event_id uuid not null references public.events_base (id) on delete cascade,
  position int not null default 0,
  included boolean not null default true,
  title_override text,
  time_override text,          -- e.g. "6–9 PM"
  brewery_override text,       -- e.g. "JAKs · Falcon"
  description_override text,   -- featured slides only
  image_override_url text,     -- featured slides only: URL or storage path
  created_at timestamptz not null default now(),
  unique (post_id, event_id)
);
create index if not exists social_post_items_post_idx on public.social_post_items (post_id, position);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists social_posts_touch on public.social_posts;
create trigger social_posts_touch before update on public.social_posts
  for each row execute function public.touch_updated_at();

drop trigger if exists brand_profiles_touch on public.brand_profiles;
create trigger brand_profiles_touch before update on public.brand_profiles
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Access: the admin page reads/writes these tables directly, so they use the
--    same admin check. Edge Functions use the service role and aren't affected.
-- -----------------------------------------------------------------------------
alter table public.social_posts enable row level security;
alter table public.social_post_items enable row level security;
alter table public.brand_profiles enable row level security;

drop policy if exists social_posts_admin on public.social_posts;
create policy social_posts_admin on public.social_posts for all to authenticated
  using (public.is_social_admin()) with check (public.is_social_admin());

drop policy if exists social_post_items_admin on public.social_post_items;
create policy social_post_items_admin on public.social_post_items for all to authenticated
  using (public.is_social_admin()) with check (public.is_social_admin());

drop policy if exists brand_profiles_admin on public.brand_profiles;
create policy brand_profiles_admin on public.brand_profiles for all to authenticated
  using (public.is_social_admin()) with check (public.is_social_admin());

-- -----------------------------------------------------------------------------
-- 5. Storage
--    social        rendered slides. Public because Instagram downloads them by URL.
--                  Only Edge Functions write here.
--    brand-assets  fonts + logos. Public so the renderer can fetch them; admins upload.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('social', 'social', true), ('brand-assets', 'brand-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists brand_assets_admin_write on storage.objects;
create policy brand_assets_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'brand-assets' and public.is_social_admin());

drop policy if exists brand_assets_admin_update on storage.objects;
create policy brand_assets_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'brand-assets' and public.is_social_admin());

drop policy if exists brand_assets_admin_delete on storage.objects;
create policy brand_assets_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'brand-assets' and public.is_social_admin());
