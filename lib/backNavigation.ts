import {
  ACTIVITY_CONFIG,
  ActivitySlug,
  displayNameForRegionSlug,
} from '@/lib/seoCities'
import { getPreviousPath } from '@/lib/navigationHistory'

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function regionLabelFromSlug(slug: string): string {
  return displayNameForRegionSlug(slug, slugToTitle(slug))
}

export function pathToLabel(path: string): string {
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/'

  if (normalized === '/') return 'Home'
  if (normalized === '/events') return 'All Events'
  if (normalized === '/breweries') return 'All Breweries'
  if (normalized === '/releases') return 'All Beer Releases'
  if (normalized === '/admin' || normalized === '/breweries-events') return 'Content Admin'
  if (normalized === '/profile' || normalized === '/account') return 'Profile'
  if (normalized === '/connect-instagram') return 'Connect Instagram'
  if (normalized === '/events/signup') return 'Event Sign Up'

  const cityMatch = normalized.match(/^\/([^/]+)$/)
  if (cityMatch) {
    return regionLabelFromSlug(cityMatch[1])
  }

  const cityEventsMatch = normalized.match(/^\/([^/]+)\/events$/)
  if (cityEventsMatch) {
    return `Events in ${regionLabelFromSlug(cityEventsMatch[1])}`
  }

  const cityBreweriesMatch = normalized.match(/^\/([^/]+)\/breweries$/)
  if (cityBreweriesMatch) {
    return `Breweries in ${regionLabelFromSlug(cityBreweriesMatch[1])}`
  }

  const cityReleasesMatch = normalized.match(/^\/([^/]+)\/releases$/)
  if (cityReleasesMatch) {
    return `Beer Releases in ${regionLabelFromSlug(cityReleasesMatch[1])}`
  }

  const cityHappyHoursMatch = normalized.match(/^\/([^/]+)\/happy-hours$/)
  if (cityHappyHoursMatch) {
    return `Happy Hours in ${regionLabelFromSlug(cityHappyHoursMatch[1])}`
  }

  const cityActivityMatch = normalized.match(/^\/([^/]+)\/([^/]+)$/)
  if (cityActivityMatch && cityActivityMatch[2] in ACTIVITY_CONFIG) {
    const cityName = regionLabelFromSlug(cityActivityMatch[1])
    const activityLabel = ACTIVITY_CONFIG[cityActivityMatch[2] as ActivitySlug].label
    return `${activityLabel} in ${cityName}`
  }

  const regionMatch = normalized.match(/^\/(?:admin|breweries-events)\/([^/]+)$/)
  if (regionMatch) {
    return slugToTitle(regionMatch[1])
  }

  const breweryMatch = normalized.match(/^\/breweries\/([^/]+)$/)
  if (breweryMatch) {
    return slugToTitle(breweryMatch[1])
  }

  const eventMatch = normalized.match(/^\/events\/([^/]+)$/)
  if (eventMatch) {
    return slugToTitle(eventMatch[1].replace(/-\d{4}-\d{2}-\d{2}$/, ''))
  }

  const releaseMatch = normalized.match(/^\/releases\/([^/]+)$/)
  if (releaseMatch) {
    return slugToTitle(releaseMatch[1])
  }

  return slugToTitle(normalized.replace(/^\//, '')) || 'Previous Page'
}

export function canGoBackInHistory(): boolean {
  return typeof window !== 'undefined' && window.history.length > 1
}

export function resolveBackLabel(fallbackHref: string, fallbackLabel?: string): string {
  const hasHistory = canGoBackInHistory()
  const previousPath = getPreviousPath()

  if (hasHistory && previousPath) {
    return `Back to ${pathToLabel(previousPath)}`
  }

  if (hasHistory && !previousPath) {
    return 'Back'
  }

  const label = fallbackLabel ?? pathToLabel(fallbackHref)
  return `Back to ${label}`
}
