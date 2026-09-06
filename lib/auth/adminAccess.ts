import type { Profile } from '@/types/supabase'

type ProfileAccessFields = Pick<
  Profile,
  'admin' | 'brewery_admin' | 'staff_brewery_id'
> | null | undefined

/** Site content admin (`/admin`) — requires both admin flags. */
export function canAccessContentAdmin(profile: ProfileAccessFields): boolean {
  return Boolean(profile?.admin && profile?.brewery_admin)
}

/** Brewery staff admin (`/staff`) — assigned brewery + brewery_admin. */
export function canAccessBreweryStaffAdmin(profile: ProfileAccessFields): boolean {
  return Boolean(profile?.staff_brewery_id && profile?.brewery_admin)
}

export function isStaffBreweryManager(profile: ProfileAccessFields): boolean {
  return Boolean(profile?.staff_brewery_id)
}
