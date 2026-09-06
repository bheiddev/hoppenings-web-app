import type { Profile } from '@/types/supabase'
import {
  canAccessBreweryStaffAdmin,
  canAccessContentAdmin,
} from '@/lib/auth/adminAccess'

/** Where to send a user after successful auth. */
export function getPostAuthPath(profile: Profile | null | undefined, next?: string | null): string {
  if (canAccessContentAdmin(profile)) return '/admin'
  if (canAccessBreweryStaffAdmin(profile)) return '/staff'

  if (next && next.startsWith('/') && !next.startsWith('//')) {
    // Users without content-admin access should not land on the full admin.
    if (next === '/admin' || next.startsWith('/admin/')) {
      return canAccessBreweryStaffAdmin(profile) ? '/staff' : '/profile'
    }
    if (next === '/staff' || next.startsWith('/staff/')) {
      return canAccessBreweryStaffAdmin(profile) ? next : '/profile'
    }
    return next
  }

  return '/profile'
}

export { canAccessBreweryStaffAdmin, canAccessContentAdmin, isStaffBreweryManager } from '@/lib/auth/adminAccess'
