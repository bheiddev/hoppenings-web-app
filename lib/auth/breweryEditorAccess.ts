import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import type { Profile } from '@/types/supabase'

export type BreweryEditorAccess =
  | {
      ok: true
      userId: string
      profile: Pick<Profile, 'admin' | 'brewery_admin' | 'staff_brewery_id'>
    }
  | { ok: false; error: string }

/**
 * Verify a browser access token and confirm the user may edit `breweryId`
 * (site admin, or brewery staff with brewery_admin + matching staff_brewery_id).
 */
export async function assertCanEditBrewery(
  breweryId: string,
  accessToken: string | null | undefined
): Promise<BreweryEditorAccess> {
  const access = await getProfileFromAccessToken(accessToken)
  if (!access.ok) return access

  const { profile } = access
  const isContentAdmin = Boolean(profile.admin)
  const isStaffForBrewery =
    Boolean(profile.brewery_admin) && profile.staff_brewery_id === breweryId

  if (!isContentAdmin && !isStaffForBrewery) {
    return { ok: false, error: 'Not authorized to edit this brewery' }
  }

  return access
}

/** Resolve the signed-in profile from a browser access token (service-role lookup). */
export async function getProfileFromAccessToken(
  accessToken: string | null | undefined
): Promise<BreweryEditorAccess> {
  const token = accessToken?.trim()
  if (!token) return { ok: false, error: 'Not signed in' }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return {
      ok: false,
      error:
        'Server not configured for mutations. Add SUPABASE_SERVICE_ROLE_KEY to your environment.',
    }
  }

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token)

  if (userError || !user) {
    return { ok: false, error: 'Not signed in' }
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('admin, brewery_admin, staff_brewery_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Error loading profile from access token:', profileError)
    return { ok: false, error: 'Could not verify permissions' }
  }

  if (!profile) return { ok: false, error: 'Profile not found' }

  return {
    ok: true,
    userId: user.id,
    profile: {
      admin: profile.admin,
      brewery_admin: profile.brewery_admin,
      staff_brewery_id: profile.staff_brewery_id,
    },
  }
}
