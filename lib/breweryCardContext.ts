import { supabase } from '@/lib/supabase'
import { BreweryHours, FoodTruck } from '@/types/supabase'
import { isReleaseInIndexableWindow } from '@/lib/contentExpiry'
import { foodTruckShowsOnDate } from '@/lib/foodTrucks'
import { getTonightCarouselEvents } from '@/lib/events'
import {
  BreweryEventIcon,
  BreweryHoursStatus,
  getBreweryHoursStatus,
  matchBreweryEventIcon,
} from '@/lib/breweryCardStatus'
import { getTodayMountainDateString } from '@/lib/utils'

export type BreweryCardContext = {
  hoursStatus: BreweryHoursStatus
  hasFoodTruckToday: boolean
  todayEventIcon: BreweryEventIcon
  hasNewRelease: boolean
  releaseName: string | null
  todayEventTitle: string | null
  foodTruckName: string | null
}

export const DEFAULT_BREWERY_CARD_CONTEXT: BreweryCardContext = {
  hoursStatus: 'closed',
  hasFoodTruckToday: false,
  todayEventIcon: 'generic',
  hasNewRelease: false,
  releaseName: null,
  todayEventTitle: null,
  foodTruckName: null,
}

function breweryIdsForRelease(release: {
  brewery_id: string
  brewery_id2: string | null
  brewery_id3: string | null
}): string[] {
  return [release.brewery_id, release.brewery_id2, release.brewery_id3].filter(
    (id): id is string => Boolean(id)
  )
}

function getFoodTruckForBrewery(
  trucks: FoodTruck[],
  breweryId: string,
  today: string
): string | null {
  const breweryTrucks = trucks.filter((truck) => truck.brewery_id === breweryId)
  if (breweryTrucks.length === 0) return null

  const showing = breweryTrucks.find((truck) => foodTruckShowsOnDate(truck, today))
  if (showing) return showing.name?.trim() || 'Food truck'

  return null
}

async function fetchAllBreweryIds(): Promise<string[]> {
  const { data, error } = await supabase.from('breweries').select('id')
  if (error) {
    console.error('Error fetching brewery ids for cards:', error)
    return []
  }
  return (data ?? []).map((row) => row.id as string)
}

async function fetchAllBreweryHours(): Promise<Map<string, BreweryHours>> {
  const { data, error } = await supabase.from('brewery_hours').select('*')
  if (error) {
    console.error('Error fetching brewery hours for cards:', error)
    return new Map()
  }
  const map = new Map<string, BreweryHours>()
  for (const row of data ?? []) {
    map.set(row.brewery_id, row as BreweryHours)
  }
  return map
}

async function fetchAllFoodTrucks(): Promise<FoodTruck[]> {
  const { data, error } = await supabase
    .from('food_trucks')
    .select('id, created_at, brewery_id, name, permanent, date, closed')

  if (error) {
    console.error('Error fetching food trucks for cards:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    brewery_id: row.brewery_id,
    name: row.name,
    permanent: row.permanent,
    date: row.date,
    closed: row.closed,
  })) as FoodTruck[]
}

async function fetchRecentReleaseNamesByBrewery(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('beer_releases_base')
    .select('brewery_id, brewery_id2, brewery_id3, release_date, beer_name, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error fetching releases for brewery cards:', error)
    return new Map()
  }

  const map = new Map<string, string>()
  for (const row of data ?? []) {
    if (!isReleaseInIndexableWindow(row.release_date)) continue
    for (const id of breweryIdsForRelease(row)) {
      if (!map.has(id) && row.beer_name) {
        map.set(id, row.beer_name)
      }
    }
  }
  return map
}

function pickTodayEventForBrewery(
  events: Awaited<ReturnType<typeof getTonightCarouselEvents>>,
  breweryId: string
): { title: string; icon: BreweryEventIcon } | null {
  const breweryEvents = events.filter((event) => event.brewery_id === breweryId)
  if (breweryEvents.length === 0) return null

  let best: { title: string; icon: BreweryEventIcon } | null = null
  for (const event of breweryEvents) {
    const icon = matchBreweryEventIcon(event.title, event.description)
    const candidate = { title: event.title, icon }
    if (!best) {
      best = candidate
      continue
    }
    if (best.icon === 'generic' && icon !== 'generic') {
      best = candidate
    }
  }
  return best
}

export async function getBreweryCardContextMap(): Promise<Map<string, BreweryCardContext>> {
  const today = getTodayMountainDateString()
  const [hoursByBrewery, foodTrucks, todaysEvents, releaseNamesByBrewery, allBreweryIds] =
    await Promise.all([
      fetchAllBreweryHours(),
      fetchAllFoodTrucks(),
      getTonightCarouselEvents(),
      fetchRecentReleaseNamesByBrewery(),
      fetchAllBreweryIds(),
    ])

  const foodTruckNameByBrewery = new Map<string, string>()
  for (const breweryId of allBreweryIds) {
    const name = getFoodTruckForBrewery(foodTrucks, breweryId, today)
    if (name) foodTruckNameByBrewery.set(breweryId, name)
  }

  const todayEventByBrewery = new Map<string, { title: string; icon: BreweryEventIcon }>()
  for (const event of todaysEvents) {
    if (!event.brewery_id || todayEventByBrewery.has(event.brewery_id)) continue
    const picked = pickTodayEventForBrewery(todaysEvents, event.brewery_id)
    if (picked) todayEventByBrewery.set(event.brewery_id, picked)
  }

  const breweryIds = new Set<string>([
    ...allBreweryIds,
    ...hoursByBrewery.keys(),
    ...foodTruckNameByBrewery.keys(),
    ...todayEventByBrewery.keys(),
    ...releaseNamesByBrewery.keys(),
  ])

  const map = new Map<string, BreweryCardContext>()
  for (const breweryId of breweryIds) {
    const releaseName = releaseNamesByBrewery.get(breweryId) ?? null
    const todayEvent = todayEventByBrewery.get(breweryId)
    map.set(breweryId, {
      hoursStatus: getBreweryHoursStatus(hoursByBrewery.get(breweryId)),
      hasFoodTruckToday: foodTruckNameByBrewery.has(breweryId),
      todayEventIcon: todayEvent?.icon ?? 'generic',
      hasNewRelease: releaseName !== null,
      releaseName,
      todayEventTitle: todayEvent?.title ?? null,
      foodTruckName: foodTruckNameByBrewery.get(breweryId) ?? null,
    })
  }

  return map
}

export function getBreweryCardContext(
  map: Map<string, BreweryCardContext>,
  breweryId: string
): BreweryCardContext {
  return map.get(breweryId) ?? DEFAULT_BREWERY_CARD_CONTEXT
}

export function mergeBreweryCardContext(
  base: BreweryCardContext,
  overrides: Partial<BreweryCardContext>
): BreweryCardContext {
  return { ...base, ...overrides }
}
