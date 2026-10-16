/**
 * Content expiry and indexability – single source of truth for SEO.
 *
 * Strategy:
 * - Sitemap only lists "indexable" URLs (releases/events within the window).
 * - Expired one-off event URLs 301 to the listing page.
 * - Expired / past dated URLs for a recurring series 301 to the next upcoming
 *   occurrence of that series (so ranked weekly event links stay useful).
 * - Expired / still-findable rows 301 to hubs or the next occurrence.
 * - Deletes and renames write `slug_redirects` tombstones (see lib/slugRedirects.ts)
 *   so formerly valid URLs 301 instead of 404.
 * - True unknowns (never existed) still 404.
 *
 * As time moves forward, content ages out of the indexable window and drops off the
 * sitemap; visits to those URLs get a 301. Google recrawls and updates the index
 * without accumulating 404s.
 */

import { addDaysToDateString, getTodayMountainDateString, normalizeEventDateToMountainTime } from '@/lib/utils'

/** Release list/detail: from 14 Mountain days ago through ~1 year ahead (matches mobile). */
export const RELEASE_LOOKBACK_DAYS = 14
export const RELEASE_LOOKAHEAD_YEARS = 1

/** @deprecated Prefer RELEASE_LOOKBACK_DAYS — kept for older call sites. */
export const RELEASE_INDEXABLE_DAYS = RELEASE_LOOKBACK_DAYS

/** Event detail pages: indexable for this many days after event_date. null = no expiry (all events stay indexable). */
export const EVENT_INDEXABLE_DAYS: number | null = null

/** Where to send users when they hit an expired release URL. */
export const EXPIRED_RELEASE_REDIRECT = '/releases'

/** Where to send users when they hit an expired event URL (if event expiry is enabled). */
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
 * True if this event should be in the sitemap and served as a normal page.
 * If EVENT_INDEXABLE_DAYS is null, all events are indexable.
 */
export function isEventInIndexableWindow(eventDate: string): boolean {
  if (EVENT_INDEXABLE_DAYS === null) return true
  const eventStr = toDateString(eventDate)
  if (!eventStr) return true
  const today = getTodayMountainDateString()
  const cutoffStr = addDaysToDateString(today, -EVENT_INDEXABLE_DAYS)
  return eventStr >= cutoffStr
}
