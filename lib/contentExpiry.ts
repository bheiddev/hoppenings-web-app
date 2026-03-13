/**
 * Content expiry and indexability – single source of truth for SEO.
 *
 * Strategy:
 * - Sitemap only lists "indexable" URLs (releases/events within the window).
 * - When a user or crawler hits an expired URL, we 301 redirect to the listing page.
 * - We never 404 for content that "existed but expired" – only for truly invalid slugs.
 *
 * As time moves forward, content ages out of the indexable window and drops off the
 * sitemap; visits to those URLs get a 301. Google recrawls and updates the index
 * without accumulating 404s.
 */

const TIMEZONE = 'America/Denver'

/** Release detail pages: indexable for this many days after release_date (and always future). */
export const RELEASE_INDEXABLE_DAYS = 14

/** Event detail pages: indexable for this many days after event_date. null = no expiry (all events stay indexable). */
export const EVENT_INDEXABLE_DAYS: number | null = null

/** Where to send users when they hit an expired release URL. */
export const EXPIRED_RELEASE_REDIRECT = '/releases'

/** Where to send users when they hit an expired event URL (if event expiry is enabled). */
export const EXPIRED_EVENT_REDIRECT = '/events'

function todayDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

function toDateString(isoOrDate: string | null): string | null {
  if (!isoOrDate) return null
  const d = new Date(isoOrDate)
  return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

/**
 * True if this release should be in the sitemap and served as a normal page.
 * Uses release_date: within last RELEASE_INDEXABLE_DAYS or in the future; no date = indexable.
 */
export function isReleaseInIndexableWindow(releaseDate: string | null): boolean {
  if (!releaseDate) return true
  const releaseStr = toDateString(releaseDate)
  if (!releaseStr) return true
  const today = todayDateString()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RELEASE_INDEXABLE_DAYS)
  const cutoffStr = cutoff.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  return releaseStr >= cutoffStr
}

/**
 * True if this event should be in the sitemap and served as a normal page.
 * If EVENT_INDEXABLE_DAYS is null, all events are indexable.
 */
export function isEventInIndexableWindow(eventDate: string): boolean {
  if (EVENT_INDEXABLE_DAYS === null) return true
  const eventStr = toDateString(eventDate)
  if (!eventStr) return true
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - EVENT_INDEXABLE_DAYS)
  const cutoffStr = cutoff.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  return eventStr >= cutoffStr
}
