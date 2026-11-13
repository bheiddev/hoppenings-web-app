/**
 * Admin overview: brewery_visits by user, brewery, and day.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabase'
import {
  formatEventDateShort,
  getTodayMountainDateString,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'

function getReadClient() {
  return getSupabaseAdmin() ?? supabase
}

export type BreweryVisitPersonRow = {
  userId: string
  displayName: string | null
  email: string | null
  totalVisits: number
  confirmedVisits: number
  uniqueBreweries: number
  breweryBreakdown: { breweryId: string; breweryName: string; count: number }[]
  lastVisitedAt: string | null
}

export type BreweryVisitDayRow = {
  ymd: string
  dateLabel: string
  totalVisits: number
  confirmedVisits: number
  uniqueUsers: number
  uniqueBreweries: number
}

export type BreweryVisitBreweryRow = {
  breweryId: string
  breweryName: string
  totalVisits: number
  confirmedVisits: number
  uniqueUsers: number
}

export type BreweryVisitRecentRow = {
  id: string
  userId: string
  displayName: string | null
  email: string | null
  breweryId: string
  breweryName: string
  visitedAt: string
  confirmed: boolean
  source: string | null
}

export type BreweryVisitsSummary = {
  totalVisits: number
  confirmedVisits: number
  uniqueUsers: number
  uniqueBreweries: number
  visitsToday: number
  confirmedToday: number
}

export type BreweryVisitsResult = {
  summary: BreweryVisitsSummary
  people: BreweryVisitPersonRow[]
  byDay: BreweryVisitDayRow[]
  byBrewery: BreweryVisitBreweryRow[]
  recent: BreweryVisitRecentRow[]
  error: string | null
}

const emptySummary = (): BreweryVisitsSummary => ({
  totalVisits: 0,
  confirmedVisits: 0,
  uniqueUsers: 0,
  uniqueBreweries: 0,
  visitsToday: 0,
  confirmedToday: 0,
})

type ProfileLite = { display_name: string | null; email: string | null }

async function fetchProfilesByIds(
  client: ReturnType<typeof getReadClient>,
  userIds: string[]
): Promise<Map<string, ProfileLite>> {
  const map = new Map<string, ProfileLite>()
  const unique = [...new Set(userIds.filter(Boolean))]
  if (unique.length === 0) return map

  const chunkSize = 200
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize)
    const { data, error } = await client
      .from('profiles')
      .select('id, display_name, email')
      .in('id', chunk)

    if (error) {
      console.error('Error fetching profiles for visits admin:', error)
      continue
    }
    for (const p of data ?? []) {
      map.set(p.id as string, {
        display_name: (p.display_name as string | null) ?? null,
        email: (p.email as string | null) ?? null,
      })
    }
  }
  return map
}

async function fetchBreweryNames(
  client: ReturnType<typeof getReadClient>,
  breweryIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const unique = [...new Set(breweryIds.filter(Boolean))]
  if (unique.length === 0) return map

  const chunkSize = 200
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize)
    const { data, error } = await client.from('breweries').select('id, name').in('id', chunk)
    if (error) {
      console.error('Error fetching brewery names for visits admin:', error)
      continue
    }
    for (const b of data ?? []) {
      map.set(b.id as string, (b.name as string) || 'Unknown brewery')
    }
  }
  return map
}

type VisitRow = {
  id: string
  user_id: string
  brewery_id: string
  visited_at: string
  is_visit_confirmed: boolean | null
  source: string | null
}

/**
 * PostgREST often caps a single response at 1000 rows even when `.limit()` is higher.
 * Page with `.range()` until exhausted so tallies keep growing.
 */
async function fetchAllBreweryVisits(
  client: ReturnType<typeof getReadClient>
): Promise<{ visits: VisitRow[]; error: string | null }> {
  const pageSize = 1000
  const maxRows = 50000
  const visits: VisitRow[] = []

  for (let from = 0; from < maxRows; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await client
      .from('brewery_visits')
      .select('id, user_id, brewery_id, visited_at, is_visit_confirmed, source')
      .order('visited_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching brewery_visits page:', error)
      return { visits, error: error.message }
    }

    const page = (data ?? []) as VisitRow[]
    visits.push(...page)
    if (page.length < pageSize) break
  }

  return { visits, error: null }
}

/**
 * Load brewery visits for admin: people leaderboard, daily counts, brewery totals.
 */
export async function getBreweryVisitsOverview(): Promise<BreweryVisitsResult> {
  const client = getReadClient()
  const summary = emptySummary()

  try {
    const { visits, error } = await fetchAllBreweryVisits(client)

    if (error && visits.length === 0) {
      return {
        summary,
        people: [],
        byDay: [],
        byBrewery: [],
        recent: [],
        error,
      }
    }

    const today = getTodayMountainDateString()

    summary.totalVisits = visits.length
    summary.confirmedVisits = visits.filter((v) => Boolean(v.is_visit_confirmed)).length
    summary.uniqueUsers = new Set(visits.map((v) => v.user_id).filter(Boolean)).size
    summary.uniqueBreweries = new Set(visits.map((v) => v.brewery_id).filter(Boolean)).size

    let visitsToday = 0
    let confirmedToday = 0
    for (const v of visits) {
      const ymd = normalizeEventDateToMountainTime(v.visited_at)
      if (ymd === today) {
        visitsToday += 1
        if (v.is_visit_confirmed) confirmedToday += 1
      }
    }
    summary.visitsToday = visitsToday
    summary.confirmedToday = confirmedToday

    const [profiles, breweryNames] = await Promise.all([
      fetchProfilesByIds(
        client,
        visits.map((v) => v.user_id)
      ),
      fetchBreweryNames(
        client,
        visits.map((v) => v.brewery_id)
      ),
    ])

    type PersonAgg = {
      userId: string
      totalVisits: number
      confirmedVisits: number
      breweryCounts: Map<string, number>
      lastVisitedAt: string | null
    }
    const peopleMap = new Map<string, PersonAgg>()

    type DayAgg = {
      ymd: string
      totalVisits: number
      confirmedVisits: number
      users: Set<string>
      breweries: Set<string>
    }
    const dayMap = new Map<string, DayAgg>()

    type BreweryAgg = {
      breweryId: string
      totalVisits: number
      confirmedVisits: number
      users: Set<string>
    }
    const breweryMap = new Map<string, BreweryAgg>()

    for (const v of visits) {
      const userId = v.user_id
      const breweryId = v.brewery_id
      const visitedAt = v.visited_at
      const confirmed = Boolean(v.is_visit_confirmed)
      const ymd = normalizeEventDateToMountainTime(visitedAt)

      if (userId) {
        const person = peopleMap.get(userId) ?? {
          userId,
          totalVisits: 0,
          confirmedVisits: 0,
          breweryCounts: new Map<string, number>(),
          lastVisitedAt: null,
        }
        person.totalVisits += 1
        if (confirmed) person.confirmedVisits += 1
        if (breweryId) {
          person.breweryCounts.set(breweryId, (person.breweryCounts.get(breweryId) ?? 0) + 1)
        }
        if (!person.lastVisitedAt || visitedAt > person.lastVisitedAt) {
          person.lastVisitedAt = visitedAt
        }
        peopleMap.set(userId, person)
      }

      const day = dayMap.get(ymd) ?? {
        ymd,
        totalVisits: 0,
        confirmedVisits: 0,
        users: new Set<string>(),
        breweries: new Set<string>(),
      }
      day.totalVisits += 1
      if (confirmed) day.confirmedVisits += 1
      if (userId) day.users.add(userId)
      if (breweryId) day.breweries.add(breweryId)
      dayMap.set(ymd, day)

      if (breweryId) {
        const brewery = breweryMap.get(breweryId) ?? {
          breweryId,
          totalVisits: 0,
          confirmedVisits: 0,
          users: new Set<string>(),
        }
        brewery.totalVisits += 1
        if (confirmed) brewery.confirmedVisits += 1
        if (userId) brewery.users.add(userId)
        breweryMap.set(breweryId, brewery)
      }
    }

    const people: BreweryVisitPersonRow[] = Array.from(peopleMap.values())
      .map((p) => {
        const profile = profiles.get(p.userId)
        const breweryBreakdown = [...p.breweryCounts.entries()]
          .map(([breweryId, count]) => ({
            breweryId,
            breweryName: breweryNames.get(breweryId) ?? 'Unknown brewery',
            count,
          }))
          .sort((a, b) => b.count - a.count || a.breweryName.localeCompare(b.breweryName))
        return {
          userId: p.userId,
          displayName: profile?.display_name ?? null,
          email: profile?.email ?? null,
          totalVisits: p.totalVisits,
          confirmedVisits: p.confirmedVisits,
          uniqueBreweries: breweryBreakdown.length,
          breweryBreakdown,
          lastVisitedAt: p.lastVisitedAt,
        }
      })
      .sort((a, b) => {
        if (b.totalVisits !== a.totalVisits) return b.totalVisits - a.totalVisits
        if (b.confirmedVisits !== a.confirmedVisits) return b.confirmedVisits - a.confirmedVisits
        const aKey = (a.displayName || a.email || a.userId).toLowerCase()
        const bKey = (b.displayName || b.email || b.userId).toLowerCase()
        return aKey.localeCompare(bKey)
      })

    const byDay: BreweryVisitDayRow[] = Array.from(dayMap.values())
      .map((d) => ({
        ymd: d.ymd,
        dateLabel: formatEventDateShort(d.ymd),
        totalVisits: d.totalVisits,
        confirmedVisits: d.confirmedVisits,
        uniqueUsers: d.users.size,
        uniqueBreweries: d.breweries.size,
      }))
      .sort((a, b) => b.ymd.localeCompare(a.ymd))

    const byBrewery: BreweryVisitBreweryRow[] = Array.from(breweryMap.values())
      .map((b) => ({
        breweryId: b.breweryId,
        breweryName: breweryNames.get(b.breweryId) ?? 'Unknown brewery',
        totalVisits: b.totalVisits,
        confirmedVisits: b.confirmedVisits,
        uniqueUsers: b.users.size,
      }))
      .sort(
        (a, b) =>
          b.totalVisits - a.totalVisits || a.breweryName.localeCompare(b.breweryName)
      )

    const recent: BreweryVisitRecentRow[] = visits.slice(0, 150).map((v) => {
      const userId = v.user_id
      const profile = profiles.get(userId)
      const breweryId = v.brewery_id
      return {
        id: v.id,
        userId,
        displayName: profile?.display_name ?? null,
        email: profile?.email ?? null,
        breweryId,
        breweryName: breweryNames.get(breweryId) ?? 'Unknown brewery',
        visitedAt: v.visited_at,
        confirmed: Boolean(v.is_visit_confirmed),
        source: v.source ?? null,
      }
    })

    return {
      summary,
      people,
      byDay,
      byBrewery,
      recent,
      error: error
        ? `Loaded ${visits.length.toLocaleString()} visits with a partial read error: ${error}`
        : null,
    }
  } catch (err) {
    console.error('getBreweryVisitsOverview failed:', err)
    return {
      summary,
      people: [],
      byDay: [],
      byBrewery: [],
      recent: [],
      error: err instanceof Error ? err.message : 'Failed to load brewery visits',
    }
  }
}
