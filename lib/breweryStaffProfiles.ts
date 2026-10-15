import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabase'

export type StaffBreweryRef = {
  id: string
  name: string
  /** From profiles.staff_brewery_id (active/default selection). */
  isActiveSelection: boolean
  /** From profile_staff_breweries membership. */
  isMembership: boolean
}

export type BreweryAdminProfileRow = {
  id: string
  email: string | null
  displayName: string | null
  breweryAdmin: boolean
  siteAdmin: boolean
  staffBreweryId: string | null
  staffBreweries: StaffBreweryRef[]
}

function getReadClient() {
  return getSupabaseAdmin() ?? supabase
}

/**
 * Profiles with brewery_admin, plus the breweries they can staff-edit
 * (profile_staff_breweries membership ∪ legacy staff_brewery_id).
 */
export async function getBreweryAdminProfiles(): Promise<{
  rows: BreweryAdminProfileRow[]
  error: string | null
}> {
  const client = getReadClient()

  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, email, display_name, admin, brewery_admin, staff_brewery_id')
    .eq('brewery_admin', true)
    .order('email', { ascending: true })

  if (profilesError) {
    console.error('Error fetching brewery admin profiles:', profilesError)
    return { rows: [], error: profilesError.message }
  }

  const list = profiles ?? []
  if (list.length === 0) return { rows: [], error: null }

  const userIds = list.map((p) => p.id as string)

  const { data: memberships, error: membershipError } = await client
    .from('profile_staff_breweries')
    .select('user_id, brewery_id')
    .in('user_id', userIds)

  if (membershipError) {
    // Table may not exist in older envs — fall back to staff_brewery_id only.
    console.warn('profile_staff_breweries read failed; using staff_brewery_id only:', membershipError.message)
  }

  const breweryIds = new Set<string>()
  for (const p of list) {
    if (p.staff_brewery_id) breweryIds.add(p.staff_brewery_id as string)
  }
  for (const row of memberships ?? []) {
    if (row.brewery_id) breweryIds.add(row.brewery_id as string)
  }

  const breweryNameById = new Map<string, string>()
  if (breweryIds.size > 0) {
    const { data: breweries, error: breweryError } = await client
      .from('breweries')
      .select('id, name')
      .in('id', [...breweryIds])

    if (breweryError) {
      console.error('Error fetching staff brewery names:', breweryError)
    } else {
      for (const b of breweries ?? []) {
        breweryNameById.set(b.id as string, (b.name as string) || 'Unknown brewery')
      }
    }
  }

  const membershipByUser = new Map<string, Set<string>>()
  for (const row of memberships ?? []) {
    const uid = row.user_id as string
    const bid = row.brewery_id as string
    if (!uid || !bid) continue
    const set = membershipByUser.get(uid) ?? new Set<string>()
    set.add(bid)
    membershipByUser.set(uid, set)
  }

  const rows: BreweryAdminProfileRow[] = list.map((p) => {
    const uid = p.id as string
    const activeId = (p.staff_brewery_id as string | null) ?? null
    const memberIds = membershipByUser.get(uid) ?? new Set<string>()
    const allIds = new Set<string>([...memberIds])
    if (activeId) allIds.add(activeId)

    const staffBreweries: StaffBreweryRef[] = [...allIds]
      .map((id) => ({
        id,
        name: breweryNameById.get(id) ?? id,
        isActiveSelection: activeId === id,
        isMembership: memberIds.has(id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      id: uid,
      email: (p.email as string | null) ?? null,
      displayName: (p.display_name as string | null) ?? null,
      breweryAdmin: Boolean(p.brewery_admin),
      siteAdmin: Boolean(p.admin),
      staffBreweryId: activeId,
      staffBreweries,
    }
  })

  rows.sort((a, b) => {
    const aKey = (a.email || a.displayName || a.id).toLowerCase()
    const bKey = (b.email || b.displayName || b.id).toLowerCase()
    return aKey.localeCompare(bKey)
  })

  return { rows, error: null }
}
