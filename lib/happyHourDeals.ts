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
 * Near-duplicate crawl rows (same title family + window) collapse to one.
 */
export function getTodaysHappyHourDeals(
  deals: HappyHourDeal[],
  now: { date: string; hours: number }
): HappyHourDeal[] {
  const todays = deals.filter((deal) => happyHourDealShowsOnDate(deal, now.date))
  return sortHappyHourDeals(dedupeDealsByTitleFamilyAndWindow(todays))
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
  return normalizeTitleFamily(title) === 'happy hour'
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

/** Collapse crawl title variants: "Weekly Happy Hour" → "happy hour". */
function normalizeTitleFamily(title: string): string {
  return normalizeDealText(title).replace(/^weekly\s+/, '')
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

/** Treat null/null and common full-day encodings (0–23, 0–24) as the same window. */
function normalizeTimeWindow(
  timeStart: number | string | null | undefined,
  timeEnd: number | string | null | undefined
): { start: number | null; end: number | null } {
  const start = coerceHour(timeStart)
  const end = coerceHour(timeEnd)
  if (start == null && end == null) return { start: null, end: null }
  if (start === 0 && (end == null || end >= 23)) return { start: null, end: null }
  return { start, end }
}

function isAllDayWindow(start: number | null, end: number | null): boolean {
  return start == null && end == null
}

function normalizeDayOfWeek(day: string | null | undefined): HappyHourDayOfWeek | null {
  if (!day) return null
  const match = HAPPY_HOUR_DAYS.find((d) => d.toLowerCase() === day.trim().toLowerCase())
  return match ?? null
}

function dealSlotKey(deal: HappyHourDeal): string {
  const title = normalizeTitleFamily(deal.title)
  const { start, end } = normalizeTimeWindow(deal.time_start, deal.time_end)
  return `${title}|${normalizeHour(start)}|${normalizeHour(end)}`
}

function createdAtMs(value: string | null | undefined): number {
  if (!value) return 0
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : 0
}

/** Prefer cleaner crawl copy: no "Sourced from…", then newer, then more complete. */
function descriptionScore(description: string | null | undefined, createdAt: string): number {
  const text = description?.trim() ?? ''
  let score = 0
  if (text) score += 50
  if (text && !/sourced from/i.test(text)) score += 100
  score += Math.min(createdAtMs(createdAt), 1e15) / 1e11
  // Mild preference for more complete copy (without letting length dominate).
  if (text) score += Math.min(text.length, 160) * 0.05
  return score
}

function preferDisplayTitle(current: string, candidate: string): string {
  const cur = current.trim()
  const next = candidate.trim()
  if (!cur) return next
  if (!next) return cur
  // Prefer the shorter canonical label within a title family ("Happy Hour" over "Weekly Happy Hour").
  if (normalizeTitleFamily(cur) === normalizeTitleFamily(next)) {
    if (next.length !== cur.length) return next.length < cur.length ? next : cur
  }
  return cur
}

/**
 * Keep one deal per title-family + time window (ignores day).
 * Used for today's strip where multiple crawl rows share the same weekday.
 */
function dedupeDealsByTitleFamilyAndWindow(deals: HappyHourDeal[]): HappyHourDeal[] {
  const best = new Map<string, HappyHourDeal>()

  for (const deal of deals) {
    const key = dealSlotKey(deal)
    const existing = best.get(key)
    if (!existing) {
      best.set(key, deal)
      continue
    }

    const existingScore = descriptionScore(existing.description, existing.created_at)
    const candidateScore = descriptionScore(deal.description, deal.created_at)
    if (candidateScore > existingScore) {
      best.set(key, {
        ...deal,
        title: preferDisplayTitle(existing.title, deal.title),
      })
    } else {
      best.set(key, {
        ...existing,
        title: preferDisplayTitle(existing.title, deal.title),
      })
    }
  }

  return [...best.values()]
}

type DealDisplayGroup = {
  titleFamily: string
  title: string
  description: string | null
  descriptionScore: number
  timeStart: number | null
  timeEnd: number | null
  days: HappyHourDayOfWeek[]
  ids: string[]
}

/**
 * Drop all-day rows when the same title family already has a specific window
 * on overlapping weekdays (common crawl artifact: All day + 2–5 PM).
 */
function dropRedundantAllDayGroups(groups: DealDisplayGroup[]): DealDisplayGroup[] {
  return groups.filter((group) => {
    if (!isAllDayWindow(group.timeStart, group.timeEnd)) return true
    return !groups.some(
      (other) =>
        other !== group &&
        other.titleFamily === group.titleFamily &&
        !isAllDayWindow(other.timeStart, other.timeEnd) &&
        other.days.some((day) => group.days.includes(day))
    )
  })
}

/**
 * Collapse alike deals across weekdays into one display row — e.g. Mon–Thu · 2 – 5 PM.
 * Dedupes crawl variants by title family + normalized time window (ignores description drift).
 */
export function groupHappyHourDealsForDisplay(deals: HappyHourDeal[]): HappyHourDealDisplayItem[] {
  const groups = new Map<string, DealDisplayGroup>()

  for (const deal of sortHappyHourDeals(deals)) {
    const key = dealSlotKey(deal)
    const day = normalizeDayOfWeek(deal.day_of_week) ?? deal.day_of_week
    const window = normalizeTimeWindow(deal.time_start, deal.time_end)
    const score = descriptionScore(deal.description, deal.created_at)
    const existing = groups.get(key)

    if (existing) {
      if (!existing.days.includes(day)) existing.days.push(day)
      existing.ids.push(deal.id)
      existing.title = preferDisplayTitle(existing.title, deal.title)
      if (score > existing.descriptionScore) {
        existing.description = deal.description
        existing.descriptionScore = score
      }
      continue
    }

    groups.set(key, {
      titleFamily: normalizeTitleFamily(deal.title),
      title: deal.title.trim(),
      description: deal.description,
      descriptionScore: score,
      timeStart: window.start,
      timeEnd: window.end,
      days: [day],
      ids: [deal.id],
    })
  }

  return dropRedundantAllDayGroups([...groups.values()])
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
