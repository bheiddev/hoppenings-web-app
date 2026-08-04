import type { Profile } from '@/types/supabase'

/** Where to send a user after successful auth (admins → Content Admin). */
export function getPostAuthPath(profile: Profile | null | undefined, next?: string | null): string {
  if (profile?.admin) return '/admin'
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/profile'
}
