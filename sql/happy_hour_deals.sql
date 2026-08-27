-- Happy hour / deals & specials — recurring weekly offers per brewery.
-- Apply in Supabase SQL Editor.
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- Schema notes:
--   day_of_week  — 'Sunday' … 'Saturday'
--   time_start   — local hour 0–23 (24h), or NULL for all-day / from open
--   time_end     — local hour 0–23 (24h), or NULL for through close / all day
--                  (e.g. start=16, end=NULL → “after 4 PM”; 14–17 → “2–5 PM”)
--
-- Hoppenings Content Admin mutations may use the service_role key (bypasses RLS).
-- Policies still allow:
--   • public / anon SELECT (brewery + region pages)
--   • authenticated admins (profiles.admin = true) full write via user clients

-- =============================================================================
-- 0) Quick fix if an earlier seed stored afternoon hours as 2/5/4 (AM)
-- =============================================================================

update public.happy_hour_deals
set time_start = 14, time_end = 17
where title = 'Happy Hour'
  and time_start = 2
  and time_end = 5;

update public.happy_hour_deals
set time_start = 16, time_end = null
where title = 'Teacher Thursdays'
  and time_start = 4
  and time_end is null;
-- =============================================================================
-- 1) Table
-- =============================================================================

create table if not exists public.happy_hour_deals (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  brewery_id uuid not null,
  day_of_week text not null,
  time_start smallint null,
  time_end smallint null,
  title text not null,
  description text null,
  constraint happy_hour_deals_pkey primary key (id),
  constraint happy_hour_deals_brewery_id_fkey
    foreign key (brewery_id) references public.breweries (id) on delete cascade,
  constraint happy_hour_deals_day_of_week_check
    check (
      day_of_week in (
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      )
    ),
  constraint happy_hour_deals_time_start_check
    check (time_start is null or (time_start >= 0 and time_start <= 23)),
  constraint happy_hour_deals_time_end_check
    check (time_end is null or (time_end >= 0 and time_end <= 23))
) tablespace pg_default;

create index if not exists happy_hour_deals_brewery_id_idx
  on public.happy_hour_deals using btree (brewery_id) tablespace pg_default;

create index if not exists happy_hour_deals_day_of_week_idx
  on public.happy_hour_deals using btree (day_of_week) tablespace pg_default;

create index if not exists happy_hour_deals_brewery_day_idx
  on public.happy_hour_deals using btree (brewery_id, day_of_week) tablespace pg_default;

comment on table public.happy_hour_deals is
  'Recurring weekly happy hour / deals & specials per brewery (day + optional hour window).';

comment on column public.happy_hour_deals.time_start is
  'Local start hour (0–23). NULL = all day or from open.';

comment on column public.happy_hour_deals.time_end is
  'Local end hour (0–23). NULL = through close / all day (e.g. after time_start).';

-- Keep updated_at fresh on row changes
create or replace function public.set_happy_hour_deals_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists happy_hour_deals_set_updated_at on public.happy_hour_deals;
create trigger happy_hour_deals_set_updated_at
  before update on public.happy_hour_deals
  for each row
  execute function public.set_happy_hour_deals_updated_at();

-- =============================================================================
-- 2) Grants
-- =============================================================================

grant select on table public.happy_hour_deals to anon;
grant select, insert, update, delete on table public.happy_hour_deals to authenticated;
grant all on table public.happy_hour_deals to service_role;

-- =============================================================================
-- 3) RLS
-- =============================================================================

alter table public.happy_hour_deals enable row level security;

drop policy if exists "Anyone can select happy hour deals"
  on public.happy_hour_deals;
drop policy if exists "Admins can insert happy hour deals"
  on public.happy_hour_deals;
drop policy if exists "Admins can update happy hour deals"
  on public.happy_hour_deals;
drop policy if exists "Admins can delete happy hour deals"
  on public.happy_hour_deals;

-- Public read (site brewery pages, region forecast, etc.)
create policy "Anyone can select happy hour deals"
  on public.happy_hour_deals
  for select
  to anon, authenticated
  using (true);

create policy "Admins can insert happy hour deals"
  on public.happy_hour_deals
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.admin is true
    )
  );

create policy "Admins can update happy hour deals"
  on public.happy_hour_deals
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.admin is true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.admin is true
    )
  );

create policy "Admins can delete happy hour deals"
  on public.happy_hour_deals
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.admin is true
    )
  );

-- =============================================================================
-- 4) Optional seed — Urban Animal + Cerberus (resolves brewery by name)
--    Skips rows if the brewery name is not found. Safe to re-run: deletes
--    prior seed rows for these titles at those breweries first.
-- =============================================================================

do $$
declare
  urban_id uuid;
  cerberus_id uuid;
begin
  select id into urban_id
  from public.breweries
  where name ilike 'Urban Animal%'
  order by name
  limit 1;

  select id into cerberus_id
  from public.breweries
  where name ilike 'Cerberus%'
  order by name
  limit 1;

  if urban_id is not null then
    delete from public.happy_hour_deals
    where brewery_id = urban_id
      and title in ('Happy Hour', 'Hangover Specials');

    insert into public.happy_hour_deals
      (brewery_id, day_of_week, time_start, time_end, title, description)
    values
      (urban_id, 'Monday',    14, 17,   'Happy Hour',         '$6 Pints at Both Locations'),
      (urban_id, 'Tuesday',   14, 17,   'Happy Hour',         '$6 Pints at Both Locations'),
      (urban_id, 'Wednesday', 14, 17,   'Happy Hour',         '$6 Pints at Both Locations'),
      (urban_id, 'Thursday',  14, 17,   'Happy Hour',         '$6 Pints at Both Locations'),
      (urban_id, 'Sunday',    null, null, 'Hangover Specials', 'Beermosas & Micheladas All Day! $6');
  else
    raise notice 'Seed skipped: no brewery matching Urban Animal%%';
  end if;

  if cerberus_id is not null then
    delete from public.happy_hour_deals
    where brewery_id = cerberus_id
      and title in ('Teacher Thursdays', 'Military Mondays');

    insert into public.happy_hour_deals
      (brewery_id, day_of_week, time_start, time_end, title, description)
    values
      (
        cerberus_id,
        'Thursday',
        16,
        null,
        'Teacher Thursdays',
        'Every Thursday after 4PM teachers get a free beer with a food purchase, Teacher ID Required.'
      ),
      (
        cerberus_id,
        'Monday',
        null,
        null,
        'Military Mondays',
        'Active Duty & Retired Military, your first beer is free.'
      );
  else
    raise notice 'Seed skipped: no brewery matching Cerberus%%';
  end if;
end;
$$;
