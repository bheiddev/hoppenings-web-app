-- Permanent redirects for event/release public URLs after delete or rename.
-- Apply in Supabase SQL Editor. Safe to re-run.
--
-- Why: public slugs are computed from live title/name fields. Deletes and
-- renames would otherwise 404 URLs Google already indexed. Admin mutations
-- write rows here; detail pages 301 before calling notFound().
--
-- Writes: service_role (admin actions) bypasses RLS.
-- Reads: anon/authenticated SELECT so public pages can resolve redirects.

create table if not exists public.slug_redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null,
  to_path text not null,
  source_type text not null check (source_type in ('event', 'release')),
  source_id text,
  reason text not null check (reason in ('deleted', 'renamed')),
  created_at timestamptz not null default now(),
  constraint slug_redirects_from_path_key unique (from_path),
  constraint slug_redirects_paths_distinct check (from_path <> to_path)
);

create index if not exists slug_redirects_source_idx
  on public.slug_redirects (source_type, source_id);

create index if not exists slug_redirects_from_path_idx
  on public.slug_redirects (from_path);

alter table public.slug_redirects enable row level security;

drop policy if exists "Public read slug redirects" on public.slug_redirects;
create policy "Public read slug redirects"
  on public.slug_redirects
  for select
  to anon, authenticated
  using (true);

comment on table public.slug_redirects is
  'SEO tombstones: formerly valid /events/* and /releases/* paths → 301 targets';
