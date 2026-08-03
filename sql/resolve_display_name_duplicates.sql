-- Resolve the one known duplicate before creating profiles_display_name_lower_uidx.
-- Duplicate: lower(display_name) = 'bobby vigars'

-- =============================================================================
-- 1) Inspect both profiles (pick which keeps the name)
-- =============================================================================
select
  p.id,
  p.email,
  p.display_name,
  p.provider,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  u.raw_app_meta_data->>'provider' as auth_provider
from public.profiles p
left join auth.users u on u.id = p.id
where p.id in (
  '4f331059-d939-4eba-8dae-9bb8cf7b3bb6',
  '3f944daa-7ae2-44ed-93d4-40aafa9f034d'
)
order by p.created_at asc;

-- Optional signal: which account has more activity?
select 'favorites' as kind, user_id, count(*) as n
from public.user_favorite_breweries
where user_id in (
  '4f331059-d939-4eba-8dae-9bb8cf7b3bb6',
  '3f944daa-7ae2-44ed-93d4-40aafa9f034d'
)
group by user_id
union all
select 'visits', user_id, count(*)
from public.brewery_visits
where user_id in (
  '4f331059-d939-4eba-8dae-9bb8cf7b3bb6',
  '3f944daa-7ae2-44ed-93d4-40aafa9f034d'
)
group by user_id;

-- =============================================================================
-- 2) Resolve — choose ONE of these after inspecting step 1
-- =============================================================================

-- Option A (recommended): clear the secondary name so that user hits the
-- display-name gate on next login. Keep the name on the primary account.
-- Replace SECONDARY_USER_ID with the id that should lose the name.
--
-- update public.profiles
-- set display_name = null,
--     updated_at = timezone('utc', now())
-- where id = 'SECONDARY_USER_ID';

-- Option B: rename the secondary instead of clearing
--
-- update public.profiles
-- set display_name = 'Bobby Vigars 2',
--     updated_at = timezone('utc', now())
-- where id = 'SECONDARY_USER_ID';

-- =============================================================================
-- 3) Confirm no duplicates remain, then create the index
-- =============================================================================
-- select lower(display_name) as name_key, count(*) as n
-- from public.profiles
-- where display_name is not null and btrim(display_name) <> ''
-- group by lower(display_name)
-- having count(*) > 1;

-- create unique index if not exists profiles_display_name_lower_uidx
--   on public.profiles (lower(display_name))
--   where display_name is not null and btrim(display_name) <> '';
