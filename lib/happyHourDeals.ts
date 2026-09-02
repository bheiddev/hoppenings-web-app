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

/** True when the deal's hour window covers `hour` (0–23). Null bounds = open-ended / all day. */
export function happyHourDealIsActiveAtHour(deal: HappyHourDeal, hour: number): boolean {
  const start = deal.time_start
  const end = deal.time_end
  if (start == null && end == null) return true
  if (start != null && end == null) return hour >= start
  if (start == null && end != null) return hour < end
  return hour >= start! && hour < end!
}

/**
 * Deals scheduled for today (Mountain Time), sorted with Happy Hour titles first.
 * Does not invent or collapse rows — returns the matching DB objects as-is.
 */
export function getTodaysHappyHourDeals(
  deals: HappyHourDeal[],
  now: { date: string; hours: number }
): HappyHourDeal[] {
  return sortHappyHourDeals(deals.filter((deal) => happyHourDealShowsOnDate(deal, now.date)))
}

/**
 * Deals for today that are in-window now. If none are in-window yet/anymore,
 * falls back to today's deals (Happy Hour first) so the tonight strip still has a teaser.
 * @deprecated Prefer getTodaysHappyHourDeals for exact object display.
 */
export function getActiveHappyHourDealsForNow(
  deals: HappyHourDeal[],
  now: { date: string; hours: number }
): HappyHourDeal[] {
  const todays = getTodaysHappyHourDeals(deals, now)
  if (todays.length === 0) return []

  const inWindow = todays.filter((deal) => happyHourDealIsActiveAtHour(deal, now.hours))
  const pool = inWindow.length > 0 ? inWindow : todays

  return sortHappyHourDeals(pool)
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

function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0))
  return date.toISOString().slice(0, 10)
}

/**
 * Short status for sibling-location teaser: today's remaining happy hour,
 * or the next one within two days. Format: "Happy Hour <window>".
 */
export function getUpcomingHappyHourStatus(
  deals: HappyHourDeal[],
  now: { date: string; hours: number }
): string | null {
  const todays = getTodaysHappyHourDeals(deals, now)
  const remaining = todays.filter(
    (deal) => deal.time_end == null || now.hours < deal.time_end
  )

  if (remaining.length > 0) {
    const active =
      remaining.find((deal) => happyHourDealIsActiveAtHour(deal, now.hours)) ?? null
    const deal = active ?? remaining[0]
    return `Happy Hour ${formatHappyHourWindow(deal.time_start, deal.time_end)}`
  }

  for (let offset = 1; offset <= 2; offset++) {
    const date = addDaysYmd(now.date, offset)
    const dayDeals = sortHappyHourDeals(
      deals.filter((deal) => happyHourDealShowsOnDate(deal, date))
    )
    if (dayDeals.length === 0) continue
    const deal = dayDeals[0]
    return `Happy Hour ${formatHappyHourWindow(deal.time_start, deal.time_end)}`
  }

  return null
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

/** Collapse consecutive weekdays into ranges (e.g. Mon–Thu, Fri, Sat–Sun). */
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

function normalizeDealText(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeHour(value: number | string | null | undefined): string {
  if (value == null || value === '') return 'x'
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? String(n) : 'x'
}

function coerceHour(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeDayOfWeek(day: string | null | undefined): HappyHourDayOfWeek | null {
  if (!day) return null
  const match = HAPPY_HOUR_DAYS.find((d) => d.toLowerCase() === day.trim().toLowerCase())
  return match ?? null
}

function dealGroupKey(deal: HappyHourDeal): string {
  const title = normalizeDealText(deal.title)
  const start = normalizeHour(deal.time_start)
  const end = normalizeHour(deal.time_end)

  // Standard "Happy Hour" windows collapse across days by title + hours only,
  // so Mon–Thu 2–5 becomes one row even if descriptions differ slightly.
  if (title === 'happy hour') {
    return `happy-hour|${start}|${end}`
  }

  return [title, normalizeDealText(deal.description), start, end].join('|')
}

/**
 * Collapse alike deals (same title, description, and time window) across weekdays
 * into one display row — e.g. Mon–Thu · 2 – 5 PM.
 * "Happy Hour" titles group by title + time window only.
 */
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
    const key = dealGroupKey(deal)
    const day = normalizeDayOfWeek(deal.day_of_week) ?? deal.day_of_week
    const existing = groups.get(key)
    if (existing) {
      if (!existing.days.includes(day)) existing.days.push(day)
      existing.ids.push(deal.id)
      if (!existing.description?.trim() && deal.description?.trim()) {
        existing.description = deal.description
      }
      continue
    }

    groups.set(key, {
      title: deal.title.trim(),
      description: deal.description,
      timeStart: coerceHour(deal.time_start),
      timeEnd: coerceHour(deal.time_end),
      days: [day],
      ids: [deal.id],
    })
  }

  return [...groups.values()]
    .map((group) => ({
      key: group.ids.join('-'),
      badge: `${formatDayList(group.days)} · ${formatHappyHourWindow(group.timeStart, group.timeEnd)}`,
      title: group.title,
      detail: group.description?.trim() || null,
    }))
    .sort((a, b) => {
      const aHappy = isHappyHourTitle(a.title) ? 0 : 1
      const bHappy = isHappyHourTitle(b.title) ? 0 : 1
      if (aHappy !== bHappy) return aHappy - bHappy
      return a.title.localeCompare(b.title)
    })
}

/** @deprecated Prefer groupHappyHourDealsForDisplay. */
export function happyHourDealsForDisplay(deals: HappyHourDeal[]): HappyHourDealDisplayItem[] {
  return groupHappyHourDealsForDisplay(deals)
}
