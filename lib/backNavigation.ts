import { ACTIVITY_CONFIG, ActivitySlug, CITY_CONFIG, CitySlug } from '@/lib/seoCities'
import { getPreviousPath } from '@/lib/navigationHistory'

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function pathToLabel(path: string): string {
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/'

  if (normalized === '/') return 'Home'
  if (normalized === '/events') return 'All Events'
  if (normalized === '/breweries') return 'All Breweries'
  if (normalized === '/releases') return 'All Beer Releases'
  if (normalized === '/breweries-events') return 'All Regions'
  if (normalized === '/connect-instagram') return 'Connect Instagram'
  if (normalized === '/events/signup') return 'Event Sign Up'

  const cityMatch = normalized.match(/^\/([^/]+)$/)
  if (cityMatch && cityMatch[1] in CITY_CONFIG) {
    return CITY_CONFIG[cityMatch[1] as CitySlug].name
  }

  const cityEventsMatch = normalized.match(/^\/([^/]+)\/events$/)
  if (cityEventsMatch && cityEventsMatch[1] in CITY_CONFIG) {
    const cityName = CITY_CONFIG[cityEventsMatch[1] as CitySlug].name
    return `Events in ${cityName}`
  }

  const cityBreweriesMatch = normalized.match(/^\/([^/]+)\/breweries$/)
  if (cityBreweriesMatch && cityBreweriesMatch[1] in CITY_CONFIG) {
    const cityName = CITY_CONFIG[cityBreweriesMatch[1] as CitySlug].name
    return `Breweries in ${cityName}`
  }

  const cityReleasesMatch = normalized.match(/^\/([^/]+)\/releases$/)
  if (cityReleasesMatch && cityReleasesMatch[1] in CITY_CONFIG) {
    const cityName = CITY_CONFIG[cityReleasesMatch[1] as CitySlug].name
    return `Beer Releases in ${cityName}`
  }

  const cityActivityMatch = normalized.match(/^\/([^/]+)\/([^/]+)$/)
  if (
    cityActivityMatch &&
    cityActivityMatch[1] in CITY_CONFIG &&
    cityActivityMatch[2] in ACTIVITY_CONFIG
  ) {
    const cityName = CITY_CONFIG[cityActivityMatch[1] as CitySlug].name
    const activityLabel = ACTIVITY_CONFIG[cityActivityMatch[2] as ActivitySlug].label
    return `${activityLabel} in ${cityName}`
  }

  const regionMatch = normalized.match(/^\/breweries-events\/([^/]+)$/)
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
