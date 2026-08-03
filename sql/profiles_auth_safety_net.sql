-- Shared Hoppenings project safety net: profiles trigger + case-insensitive display_name uniqueness.
-- Paste into Supabase SQL Editor. Safe to re-run (idempotent checks).
-- Does NOT drop existing objects unless you explicitly uncomment the recreate sections.

-- =============================================================================
-- 1) VERIFY what already exists
-- =============================================================================

-- Case-insensitive unique index / constraint on display_name?
select
  i.relname as index_name,
  pg_get_indexdef(i.oid) as index_def
from pg_class t
join pg_index x on x.indrelid = t.oid
join pg_class i on i.oid = x.indexrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'profiles'
  and x.indisunique
  and pg_get_indexdef(i.oid) ilike '%display_name%';

-- handle_new_user function + trigger on auth.users?
select p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'handle_new_user';

select
  tg.tgname as trigger_name,
  pg_get_triggerdef(tg.oid) as trigger_def
from pg_trigger tg
join pg_class c on c.oid = tg.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth'
  and c.relname = 'users'
  and not tg.tgisinternal
  and (
    tg.tgname ilike '%new_user%'
    or pg_get_triggerdef(tg.oid) ilike '%handle_new_user%'
    or pg_get_triggerdef(tg.oid) ilike '%profiles%'
  );

-- Duplicate display names that would block creating the unique index
select lower(display_name) as name_key, count(*) as n, array_agg(id) as user_ids
from public.profiles
where display_name is not null
  and btrim(display_name) <> ''
group by lower(display_name)
having count(*) > 1;

-- =============================================================================
-- 2) UNIQUE INDEX on lower(display_name)
--    Multiple NULLs/empty remain allowed; only non-null names are unique CI.
--    Skip this block if step 1 already shows an equivalent unique index.
-- =============================================================================

-- Uncomment after confirming no duplicate rows above:
-- create unique index if not exists profiles_display_name_lower_uidx
--   on public.profiles (lower(display_name))
--   where display_name is not null and btrim(display_name) <> '';

-- =============================================================================
-- 3) handle_new_user trigger (only if missing)
--    Populates id, email, provider from auth.users. Never set display_name here
--    — both web and mobile force the display-name gate when it's null.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_val text;
begin
  provider_val := coalesce(
    nullif(new.raw_app_meta_data->>'provider', ''),
    nullif(new.raw_app_meta_data->'providers'->>0, ''),
    'email'
  );

  insert into public.profiles (id, email, provider, created_at, updated_at)
  values (
    new.id,
    new.email,
    provider_val,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update
    set
      email = coalesce(excluded.email, public.profiles.email),
      provider = coalesce(excluded.provider, public.profiles.provider),
      updated_at = timezone('utc', now());

  return new;
end;
$$;

-- Create the trigger only if none already call handle_new_user
do $$
begin
  if not exists (
    select 1
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and not tg.tgisinternal
      and pg_get_triggerdef(tg.oid) ilike '%handle_new_user%'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.handle_new_user();
  end if;
end;
$$;

-- =============================================================================
-- 4) Quick post-check
-- =============================================================================

select
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'handle_new_user') as has_handle_new_user_fn,
  (select count(*) from pg_trigger tg
     join pg_class c on c.oid = tg.tgrelid
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'auth' and c.relname = 'users'
       and not tg.tgisinternal
       and pg_get_triggerdef(tg.oid) ilike '%handle_new_user%') as has_handle_new_user_trigger,
  (select count(*) from pg_class t
     join pg_index x on x.indrelid = t.oid
     join pg_class i on i.oid = x.indexrelid
     join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public' and t.relname = 'profiles'
       and x.indisunique
       and pg_get_indexdef(i.oid) ilike '%display_name%') as has_display_name_unique;
