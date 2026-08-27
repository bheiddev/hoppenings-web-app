import type { HappyHourDayOfWeek, HappyHourDeal } from '@/types/supabase'
import { getMountainWeekdayIndex } from '@/lib/foodTrucks'

export const HAPPY_HOUR_DAYS: HappyHourDayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const DAY_BY_INDEX: HappyHourDayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export function dayOfWeekFromYmd(ymd: string): HappyHourDayOfWeek {
  return DAY_BY_INDEX[getMountainWeekdayIndex(ymd)] ?? 'Sunday'
}

export function happyHourDealShowsOnDate(deal: HappyHourDeal, ymd: string): boolean {
  return deal.day_of_week === dayOfWeekFromYmd(ymd)
}

/** Format hour window for admin cards (e.g. "2–5 PM", "After 4 PM", "All day"). */
export function formatHappyHourWindow(
  timeStart: number | null,
  timeEnd: number | null
): string {
  if (timeStart == null && timeEnd == null) return 'All day'
  if (timeStart != null && timeEnd == null) return `After ${formatHourLabel(timeStart)}`
  if (timeStart == null && timeEnd != null) return `Until ${formatHourLabel(timeEnd)}`
  return `${formatHourLabel(timeStart!)} – ${formatHourLabel(timeEnd!)}`
}

function formatHourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  if (h < 12) return `${h} AM`
  return `${h - 12} PM`
}

export function sortHappyHourDeals(deals: HappyHourDeal[]): HappyHourDeal[] {
  const dayOrder = new Map(HAPPY_HOUR_DAYS.map((day, index) => [day, index]))
  return [...deals].sort((a, b) => {
    const aHappy = isHappyHourTitle(a.title) ? 0 : 1
    const bHappy = isHappyHourTitle(b.title) ? 0 : 1
    if (aHappy !== bHappy) return aHappy - bHappy
    const byDay = (dayOrder.get(a.day_of_week) ?? 0) - (dayOrder.get(b.day_of_week) ?? 0)
    if (byDay !== 0) return byDay
    const aStart = a.time_start ?? -1
    const bStart = b.time_start ?? -1
    if (aStart !== bStart) return aStart - bStart
    return a.title.localeCompare(b.title)
  })
}

function isHappyHourTitle(title: string): boolean {
  return title.trim().toLowerCase() === 'happy hour'
}

const DAY_ABBR: Record<HappyHourDayOfWeek, string> = {
  Sunday: 'Sun',
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
}

function formatDayList(days: HappyHourDayOfWeek[]): string {
  if (days.length === 0) return ''
  if (days.length === 1) return DAY_ABBR[days[0]]

  const indexes = days
    .map((day) => HAPPY_HOUR_DAYS.indexOf(day))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)

  const ranges: string[] = []
  let start = indexes[0]
  let prev = indexes[0]

  const pushRange = (from: number, to: number) => {
    if (from === to) ranges.push(DAY_ABBR[HAPPY_HOUR_DAYS[from]])
    else ranges.push(`${DAY_ABBR[HAPPY_HOUR_DAYS[from]]}–${DAY_ABBR[HAPPY_HOUR_DAYS[to]]}`)
  }

  for (let i = 1; i < indexes.length; i++) {
    const current = indexes[i]
    if (current === prev + 1) {
      prev = current
      continue
    }
    pushRange(start, prev)
    start = current
    prev = current
  }
  pushRange(start, prev)

  return ranges.join(', ')
}

export type HappyHourDealDisplayItem = {
  key: string
  badge: string
  title: string
  detail: string | null
}

/** Collapse identical deals across weekdays into one display row. */
export function groupHappyHourDealsForDisplay(deals: HappyHourDeal[]): HappyHourDealDisplayItem[] {
  const groups = new Map<
    string,
    {
      title: string
      description: string | null
      timeStart: number | null
      timeEnd: number | null
      days: HappyHourDayOfWeek[]
      ids: string[]
    }
  >()

  for (const deal of sortHappyHourDeals(deals)) {
    const key = [
      deal.title.trim().toLowerCase(),
      (deal.description ?? '').trim().toLowerCase(),
      deal.time_start ?? 'x',
      deal.time_end ?? 'x',
    ].join('|')

    const existing = groups.get(key)
    if (existing) {
      if (!existing.days.includes(deal.day_of_week)) existing.days.push(deal.day_of_week)
      existing.ids.push(deal.id)
      continue
    }

    groups.set(key, {
      title: deal.title,
      description: deal.description,
      timeStart: deal.time_start,
      timeEnd: deal.time_end,
      days: [deal.day_of_week],
      ids: [deal.id],
    })
  }

  return [...groups.values()]
    .map((group) => {
      const daysLabel = formatDayList(group.days)
      const windowLabel = formatHappyHourWindow(group.timeStart, group.timeEnd)
      return {
        key: group.ids.join('-'),
        badge: `${daysLabel} · ${windowLabel}`,
        title: group.title,
        detail: group.description?.trim() || null,
      }
    })
    .sort((a, b) => {
      const aHappy = isHappyHourTitle(a.title) ? 0 : 1
      const bHappy = isHappyHourTitle(b.title) ? 0 : 1
      if (aHappy !== bHappy) return aHappy - bHappy
      return a.title.localeCompare(b.title)
    })
}
