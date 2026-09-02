import { FoodTruck } from '@/types/supabase'
import { getTodayMountainDateString, normalizeEventDateToMountainTime } from '@/lib/utils'

export function isPermanentFoodTruck(truck: FoodTruck): boolean {
  return truck.permanent === true
}

export function isDateSpecificFoodTruck(truck: FoodTruck): boolean {
  return !isPermanentFoodTruck(truck)
}

export function getFoodTruckMountainDate(truck: FoodTruck): string | null {
  if (!truck.date?.trim()) return null
  return normalizeEventDateToMountainTime(truck.date)
}

/** Mountain Time weekday index matching JS Date#getDay (0=Sun … 6=Sat). */
export function getMountainWeekdayIndex(ymd: string): number {
  // UTC noon is always the same calendar day in America/Denver (UTC−7/−6).
  const probe = new Date(`${ymd}T12:00:00.000Z`)
  const weekday = probe.toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    weekday: 'short',
  })
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[weekday] ?? 0
}

/**
 * `closed` is a list of weekday numbers (0–6, Sun–Sat) when a permanent truck is off.
 * Empty/null means never closed by weekday.
 */
export function isFoodTruckClosedOnDate(truck: FoodTruck, ymd: string): boolean {
  if (!Array.isArray(truck.closed) || truck.closed.length === 0) return false
  const day = getMountainWeekdayIndex(ymd)
  return truck.closed.includes(day)
}

export function isUpcomingFoodTruck(truck: FoodTruck): boolean {
  if (!isDateSpecificFoodTruck(truck)) return false
  const date = getFoodTruckMountainDate(truck)
  if (!date) return false
  return date >= getTodayMountainDateString()
}

export function sortFoodTrucksChronologically(a: FoodTruck, b: FoodTruck): number {
  const dateA = getFoodTruckMountainDate(a) ?? ''
  const dateB = getFoodTruckMountainDate(b) ?? ''
  if (dateA !== dateB) return dateA.localeCompare(dateB)
  return (a.name ?? '').localeCompare(b.name ?? '')
}

export function filterUpcomingFoodTrucks(trucks: FoodTruck[]): FoodTruck[] {
  return trucks.filter(isUpcomingFoodTruck).sort(sortFoodTrucksChronologically)
}

/** Permanent trucks first (by name), then upcoming date-specific trucks. */
export function filterBreweryFoodTrucksForDisplay(trucks: FoodTruck[]): FoodTruck[] {
  const permanent = trucks
    .filter(isPermanentFoodTruck)
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  const upcoming = filterUpcomingFoodTrucks(trucks)
  return [...permanent, ...upcoming]
}

/**
 * Whether this truck should appear for a given Mountain calendar day.
 * Permanent trucks show every day except weekday `closed` entries.
 */
export function foodTruckShowsOnDate(truck: FoodTruck, ymd: string): boolean {
  if (isPermanentFoodTruck(truck)) {
    return !isFoodTruckClosedOnDate(truck, ymd)
  }
  if (isFoodTruckClosedOnDate(truck, ymd)) return false
  return getFoodTruckMountainDate(truck) === ymd
}

const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export type FoodTruckDisplayItem = {
  key: string
  badge: string
  title: string
  detail: string | null
}

function formatClosedWeekdays(closed: number[] | null | undefined): string | null {
  if (!Array.isArray(closed) || closed.length === 0) return null
  const labels = [...new Set(closed)]
    .filter((day) => day >= 0 && day <= 6)
    .sort((a, b) => a - b)
    .map((day) => WEEKDAY_ABBR[day])
  if (labels.length === 0) return null
  return `Closed ${labels.join(', ')}`
}

/** Display rows for brewery landing: permanent trucks, then upcoming dated trucks. */
export function foodTrucksForDisplay(trucks: FoodTruck[]): FoodTruckDisplayItem[] {
  return filterBreweryFoodTrucksForDisplay(trucks).map((truck) => {
    if (isPermanentFoodTruck(truck)) {
      const closedLabel = formatClosedWeekdays(truck.closed)
      return {
        key: `permanent-${truck.id}`,
        badge: closedLabel ? `On site · ${closedLabel}` : 'On site',
        title: truck.name?.trim() || 'Food available',
        detail: null,
      }
    }

    const ymd = getFoodTruckMountainDate(truck)
    return {
      key: `dated-${truck.id}-${ymd ?? truck.id}`,
      badge: ymd ? formatFoodTruckDateBadge(ymd) : 'Upcoming',
      title: truck.name?.trim() || 'Food truck',
      detail: null,
    }
  })
}

function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0))
  return date.toISOString().slice(0, 10)
}

function formatFoodTruckDateBadge(ymd: string): string {
  const today = getTodayMountainDateString()
  if (ymd === today) return 'Today'
  if (ymd === addDaysYmd(today, 1)) return 'Tomorrow'

  const [year, month, day] = ymd.split('-').map(Number)
  const date = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`)
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
