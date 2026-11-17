import { BeerRelease } from '@/types/supabase'
import { EventWithSlug } from '@/lib/events'
import { BreweryWithSlug } from '@/lib/breweries'
import {
  bucketForRegion,
  findRegionBucketBySlug,
  getRegionBucketsFromBreweries,
  regionSlugFromBucket,
  UNASSIGNED_REGION_KEY,
  type RegionBucket,
} from '@/lib/breweriesEventsRegions'

/** Region URL slug (e.g. `denver`, `castle-rock`) — same scheme as admin. */
export type CitySlug = string

export type ActivitySlug = 'trivia-nights' | 'run-clubs' | 'bingo' | 'live-music'

/**
 * Optional pretty names for familiar region slugs.
 * Source of truth for which regions exist is brewery.Region (admin buckets).
 */
export const CITY_CONFIG: Record<string, { name: string }> = {
  'colorado-springs': { name: 'Colorado Springs' },
  'fort-collins': { name: 'Fort Collins' },
  'boulder-longmont': { name: 'Boulder & Longmont' },
  denver: { name: 'Denver' },
  'castle-rock': { name: 'Castle Rock' },
}

/** Keep familiar cities first on home / carousels; newer regions follow alphabetically. */
export const REGION_LINK_ORDER: string[] = [
  'colorado-springs',
  'fort-collins',
  'boulder-longmont',
  'denver',
  'castle-rock',
]

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

/** Same slug as admin region tabs — derived only from brewery.Region. */
export function regionSlugFromRegionField(
  regionRaw: string | null | undefined
): string | null {
  const { normKey, displayLabel } = bucketForRegion(regionRaw ?? null)
  if (normKey === UNASSIGNED_REGION_KEY) return null
  return regionSlugFromBucket(normKey, displayLabel)
}

/**
 * Resolve a public /[city] slug to a Region bucket (excludes unassigned).
 * Matches admin `findRegionBucketBySlug` + content scoped by Region.
 */
export async function resolvePublicRegion(citySlug: string): Promise<RegionBucket | null> {
  const buckets = await getRegionBucketsFromBreweries()
  const bucket = findRegionBucketBySlug(citySlug, buckets)
  if (!bucket || bucket.normKey === UNASSIGNED_REGION_KEY) return null
  return bucket
}

export async function listPublicRegionBuckets(): Promise<RegionBucket[]> {
  const buckets = await getRegionBucketsFromBreweries()
  return buckets.filter((bucket) => bucket.normKey !== UNASSIGNED_REGION_KEY)
}

export function displayNameForRegionSlug(slug: string, fallbackLabel?: string): string {
  return CITY_CONFIG[slug]?.name ?? fallbackLabel ?? slug
}

export function sortRegionBucketsForDisplay(buckets: RegionBucket[]): RegionBucket[] {
  return [...buckets].sort((a, b) => {
    const ai = REGION_LINK_ORDER.indexOf(a.slug)
    const bi = REGION_LINK_ORDER.indexOf(b.slug)
    if (ai === -1 && bi === -1) return a.displayLabel.localeCompare(b.displayLabel)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

/**
 * Map brewery Region → public city slug (admin-compatible).
 * `locationRaw` is ignored for scoping — kept for call-site compatibility.
 */
export function inferCityFromRegionOrLocation(
  regionRaw: string | null | undefined,
  _locationRaw?: string | null | undefined
): CitySlug | null {
  return regionSlugFromRegionField(regionRaw)
}

/** Full region label for UI copy (e.g. "Colorado Springs"). */
export function getRegionDisplayName(
  regionRaw: string | null | undefined,
  locationRaw: string | null | undefined,
  fallback = 'Colorado'
): string {
  const { normKey, displayLabel } = bucketForRegion(regionRaw ?? null)
  if (normKey !== UNASSIGNED_REGION_KEY) {
    const slug = regionSlugFromBucket(normKey, displayLabel)
    return displayNameForRegionSlug(slug, displayLabel)
  }
  const fromLocation = (locationRaw || '').split(',')[0].trim()
  return fromLocation || fallback
}

/** Lower sort index = earlier in the Events Tonight carousel. Unknown regions sort last. */
export function getTonightCarouselCitySortOrder(
  regionRaw: string | null | undefined,
  _locationRaw?: string | null | undefined
): number {
  const city = regionSlugFromRegionField(regionRaw)
  if (!city) return REGION_LINK_ORDER.length
  const index = REGION_LINK_ORDER.indexOf(city)
  return index >= 0 ? index : REGION_LINK_ORDER.length
}

function breweryBelongsToCity(
  brewery: { Region?: string | null },
  city: CitySlug
): boolean {
  return regionSlugFromRegionField(brewery.Region) === city
}

export function filterBreweriesForCity(
  breweries: BreweryWithSlug[],
  city: CitySlug
): BreweryWithSlug[] {
  return breweries.filter((brewery) => breweryBelongsToCity(brewery, city))
}

/** Minimal event shape for city filtering (works with `Event` and `EventWithSlug`). */
export type EventLikeForCity = {
  breweries: { Region?: string | null; location?: string | null }
}

export function filterEventsForCity<T extends EventLikeForCity>(events: T[], city: CitySlug): T[] {
  return events.filter((event) => breweryBelongsToCity(event.breweries, city))
}

export function filterReleasesForCity<T extends BeerRelease>(releases: T[], city: CitySlug): T[] {
  return releases.filter((release) => breweryBelongsToCity(release.breweries, city))
}

export function filterEventsForActivity(
  events: EventWithSlug[],
  activity: ActivitySlug
): EventWithSlug[] {
  const config = ACTIVITY_CONFIG[activity]
  return events.filter((event) => {
    const text = `${event.title} ${event.description || ''}`.toLowerCase()
    return includesAny(text, config.keywords)
  })
}
