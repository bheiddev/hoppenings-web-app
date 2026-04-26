import { BeerRelease } from '@/types/supabase'
import { EventWithSlug } from '@/lib/events'
import { BreweryWithSlug } from '@/lib/breweries'

export type CitySlug = 'colorado-springs' | 'fort-collins' | 'boulder-longmont'
export type ActivitySlug = 'trivia-nights' | 'run-clubs' | 'bingo' | 'live-music'

export const CITY_CONFIG: Record<
  CitySlug,
  { name: string; regionMatchers: string[]; locationMatchers: string[] }
> = {
  'colorado-springs': {
    name: 'Colorado Springs',
    regionMatchers: ['colorado springs'],
    locationMatchers: [
      'colorado springs',
      'old colorado city',
      'manitou',
      'north-cos',
      'east-cos',
      'garden of the gods',
      'garden-of-the-gods',
      'route 24',
      'route-24',
      'black forest',
      'ivywild',
      'fillmore',
      'northgate',
      'monument',
      'fountain',
      'divide',
      'downtown',
    ],
  },
  'fort-collins': {
    name: 'Fort Collins',
    regionMatchers: ['fort collins'],
    locationMatchers: ['fort collins'],
  },
  'boulder-longmont': {
    name: 'Boulder & Longmont',
    regionMatchers: ['boulder / longmont', 'boulder', 'longmont'],
    locationMatchers: ['boulder', 'longmont'],
  },
}

export const ACTIVITY_CONFIG: Record<ActivitySlug, { label: string; keywords: string[] }> = {
  'trivia-nights': {
    label: 'Trivia Nights',
    keywords: ['trivia'],
  },
  'run-clubs': {
    label: 'Run Clubs',
    keywords: ['run club', 'running club', 'group run'],
  },
  bingo: {
    label: 'Bingo Nights',
    keywords: ['bingo'],
  },
  'live-music': {
    label: 'Live Music',
    keywords: ['live music', 'live band', 'acoustic', 'concert', 'performance'],
  },
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

function inferCityFromRegionOrLocation(
  regionRaw: string | null | undefined,
  locationRaw: string | null | undefined
): CitySlug | null {
  const region = (regionRaw || '').toLowerCase().trim()
  const location = (locationRaw || '').toLowerCase().trim()

  // Region is source of truth; fallback to location only when Region is missing/ambiguous.
  if (region.includes('colorado springs')) return 'colorado-springs'
  if (region.includes('fort collins')) return 'fort-collins'
  if (
    region.includes('boulder / longmont') ||
    region.includes('longmont') ||
    region.includes('boulder')
  ) {
    return 'boulder-longmont'
  }

  if (location) {
    for (const [city, config] of Object.entries(CITY_CONFIG) as [CitySlug, (typeof CITY_CONFIG)[CitySlug]][]) {
      if (includesAny(location, config.locationMatchers)) return city
    }
  }

  return null
}

function breweryBelongsToCity(brewery: BreweryWithSlug, city: CitySlug): boolean {
  return inferCityFromRegionOrLocation(brewery.Region, brewery.location) === city
}

export function filterBreweriesForCity(breweries: BreweryWithSlug[], city: CitySlug): BreweryWithSlug[] {
  return breweries.filter((brewery) => breweryBelongsToCity(brewery, city))
}

export function filterEventsForCity(events: EventWithSlug[], city: CitySlug): EventWithSlug[] {
  return events.filter(
    (event) => inferCityFromRegionOrLocation(event.breweries.Region, event.breweries.location) === city
  )
}

export function filterReleasesForCity(releases: BeerRelease[], city: CitySlug): BeerRelease[] {
  return releases.filter(
    (release) => inferCityFromRegionOrLocation(release.breweries.Region, release.breweries.location) === city
  )
}

export function filterEventsForActivity(events: EventWithSlug[], activity: ActivitySlug): EventWithSlug[] {
  const config = ACTIVITY_CONFIG[activity]
  return events.filter((event) => {
    const text = `${event.title} ${event.description || ''}`.toLowerCase()
    return includesAny(text, config.keywords)
  })
}
