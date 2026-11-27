/**
 * Content expiry and indexability – single source of truth for SEO.
 *
 * Strategy:
 * - Sitemap only lists a small set of indexable URLs (see selectEventsForSitemap).
 * - Recurring series: only the next upcoming occurrence is indexable.
 * - One-offs: only near-term events with enough unique description copy.
 * - Non-indexable but still-valid detail URLs serve with noindex (or 301 when past).
 * - Expired releases / dead one-offs 301 to a city hub when known, else the global hub.
 * - Deletes and renames write `slug_redirects` tombstones (see lib/slugRedirects.ts).
 */

import { addDaysToDateString, getTodayMountainDateString, normalizeEventDateToMountainTime } from '@/lib/utils'
import { inferCityFromRegionOrLocation } from '@/lib/seoCities'

/** Release list/detail: from 14 Mountain days ago through ~1 year ahead (matches mobile). */
export const RELEASE_LOOKBACK_DAYS = 14
export const RELEASE_LOOKAHEAD_YEARS = 1

/** @deprecated Prefer RELEASE_LOOKBACK_DAYS — kept for older call sites. */
export const RELEASE_INDEXABLE_DAYS = RELEASE_LOOKBACK_DAYS

/**
 * Event detail pages: how long after event_date a URL still 200s as that occurrence
 * before redirecting to the next occurrence / hub. null = never expire by date alone
 * for serving (listings window still applies via expand/filter).
 */
export const EVENT_INDEXABLE_DAYS: number | null = null

/** How far ahead a one-off or “next” recurring occurrence may appear in the sitemap. */
export const EVENT_SITEMAP_LOOKAHEAD_DAYS = 21

/** Min description length (trimmed) for a one-off to earn a sitemap slot / index. */
export const EVENT_SITEMAP_MIN_DESCRIPTION = 60

/** Where to send users when they hit an expired release URL (fallback). */
export const EXPIRED_RELEASE_REDIRECT = '/releases'

/** Where to send users when they hit an expired event URL (fallback). */
export const EXPIRED_EVENT_REDIRECT = '/events'

const TIMEZONE = 'America/Denver'

function toDateString(isoOrDate: string | null): string | null {
  if (!isoOrDate) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(isoOrDate)) {
    return normalizeEventDateToMountainTime(isoOrDate)
  }
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

/** Mountain YYYY-MM-DD bounds used by the mobile beer_releases_base query. */
export function getReleaseListDateBounds(todayYmd = getTodayMountainDateString()): {
  fromYmd: string
  toYmd: string
} {
  const fromYmd = addDaysToDateString(todayYmd, -RELEASE_LOOKBACK_DAYS)
  const [y, m, d] = todayYmd.split('-').map(Number)
  const future = new Date(Date.UTC(y + RELEASE_LOOKAHEAD_YEARS, m - 1, d, 12, 0, 0))
  const toYmd = future.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  return { fromYmd, toYmd }
}

/**
 * True if this release should be in the sitemap and listing pages.
 * Matches mobile: release_date required, within 14 days ago → 1 year ahead (Mountain).
 */
export function isReleaseInIndexableWindow(releaseDate: string | null): boolean {
  if (!releaseDate) return false
  const releaseStr = toDateString(releaseDate)
  if (!releaseStr) return false
  const { fromYmd, toYmd } = getReleaseListDateBounds()
  return releaseStr >= fromYmd && releaseStr <= toYmd
}

/**
 * True if this event date is still within the (optional) post-event serve window.
 * If EVENT_INDEXABLE_DAYS is null, all dates pass this check.
 */
export function isEventInIndexableWindow(eventDate: string): boolean {
  if (EVENT_INDEXABLE_DAYS === null) return true
  const eventStr = toDateString(eventDate)
  if (!eventStr) return true
  const today = getTodayMountainDateString()
  const cutoffStr = addDaysToDateString(today, -EVENT_INDEXABLE_DAYS)
  return eventStr >= cutoffStr
}

export function isEventInSitemapDateWindow(
  eventDate: string,
  todayYmd = getTodayMountainDateString()
): boolean {
  const eventStr = toDateString(eventDate)
  if (!eventStr) return false
  if (eventStr < todayYmd) return false
  const until = addDaysToDateString(todayYmd, EVENT_SITEMAP_LOOKAHEAD_DAYS)
  return eventStr <= until
}

export type EventSeoShape = {
  id: string
  title: string
  event_date: string
  description?: string | null
  brewery_id?: string
  is_recurring?: boolean | null
  is_recurring_biweekly?: boolean | null
  is_recurring_monthly?: boolean | null
  true_event_date?: string | null
  slug?: string
  breweries?: { Region?: string | null; location?: string | null; name?: string }
}

function isRecurringEvent(event: EventSeoShape): boolean {
  return Boolean(event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly)
}

/** Stable key for a recurring series (expanded rows share the base UUID). */
export function eventSeriesKey(event: EventSeoShape): string {
  const baseId = String(event.id).replace(/-\d{4}-\d{2}-\d{2}$/, '')
  return `${baseId}|${event.title.trim().toLowerCase()}`
}

function hasRichDescription(event: EventSeoShape): boolean {
  return (event.description ?? '').trim().replace(/\s+/g, ' ').length >= EVENT_SITEMAP_MIN_DESCRIPTION
}

/**
 * Events Google should index: next occurrence of each recurring series (within the
 * sitemap window), plus near-term one-offs with enough unique copy.
 */
export function selectEventsForSitemap<T extends EventSeoShape>(
  events: T[],
  todayYmd = getTodayMountainDateString()
): T[] {
  const inWindow = events.filter((e) => isEventInSitemapDateWindow(e.event_date, todayYmd))
  const recurring = inWindow.filter(isRecurringEvent)
  const oneOffs = inWindow.filter((e) => !isRecurringEvent(e) && hasRichDescription(e))

  const nextBySeries = new Map<string, T>()
  for (const event of [...recurring].sort((a, b) => a.event_date.localeCompare(b.event_date))) {
    const key = eventSeriesKey(event)
    if (!nextBySeries.has(key)) nextBySeries.set(key, event)
  }

  const selected = [...nextBySeries.values(), ...oneOffs]
  const seen = new Set<string>()
  return selected.filter((e) => {
    const k = e.slug ?? `${e.id}|${e.event_date}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** Whether this occurrence should be indexed (sitemap + robots index). */
export function isEventSeoIndexable(
  event: EventSeoShape,
  sitemapEvents?: EventSeoShape[],
  todayYmd = getTodayMountainDateString()
): boolean {
  const pool = sitemapEvents ?? selectEventsForSitemap([event], todayYmd)
  if (sitemapEvents) {
    const key = event.slug ?? `${event.id}|${event.event_date}`
    return pool.some((e) => (e.slug ?? `${e.id}|${e.event_date}`) === key)
  }
  return selectEventsForSitemap([event], todayYmd).length > 0
}

/** Prefer `/{city}/events` when Region maps to a public city slug. */
export function expiredEventRedirectPath(event: {
  breweries?: { Region?: string | null; location?: string | null } | null
}): string {
  const city = inferCityFromRegionOrLocation(
    event.breweries?.Region,
    event.breweries?.location
  )
  return city ? `/${city}/events` : EXPIRED_EVENT_REDIRECT
}

/** Prefer `/{city}/releases` when Region maps to a public city slug. */
export function expiredReleaseRedirectPath(release: {
  breweries?: { Region?: string | null; location?: string | null } | null
}): string {
  const city = inferCityFromRegionOrLocation(
    release.breweries?.Region,
    release.breweries?.location
  )
  return city ? `/${city}/releases` : EXPIRED_RELEASE_REDIRECT
}
