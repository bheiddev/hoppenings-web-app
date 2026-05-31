import {
  getAllBreweriesWithSlugs,
  getBreweryEvents,
  getBreweryFoodTrucks,
  getBreweryReleases,
} from '@/lib/breweries'
import { Event, BeerRelease, FoodTruck } from '@/types/supabase'

export type BreweryWithData = {
  brewery: { id: string; name: string; region: string | null }
  events: Event[]
  releases: BeerRelease[]
  foodTrucks: FoodTruck[]
}

/** Normalized key for breweries with no Region set (displayed as "Other") */
export const UNASSIGNED_REGION_KEY = '__unassigned__'

export function bucketForRegion(region: string | null): { normKey: string; displayLabel: string } {
  const trimmed = region?.trim()
  if (!trimmed) {
    return { normKey: UNASSIGNED_REGION_KEY, displayLabel: 'Other' }
  }
  return { normKey: trimmed.toLowerCase(), displayLabel: trimmed }
}

export function regionSlugFromBucket(normKey: string, displayLabel: string): string {
  if (normKey === UNASSIGNED_REGION_KEY) return 'other'
  const slug = displayLabel
    .trim()
    .toLowerCase()
    .replace(/[/\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (slug) return slug
  return normKey.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'region'
}

export function breweryAnchorId(breweryId: string): string {
  return `brewery-${breweryId}`
}

export type RegionBucket = {
  normKey: string
  displayLabel: string
  sectionHeading: string
  slug: string
}

export function buildRegionBuckets(breweriesWithData: BreweryWithData[]): RegionBucket[] {
  const labelByNorm = new Map<string, string>()
  for (const row of breweriesWithData) {
    const { normKey, displayLabel } = bucketForRegion(row.brewery.region)
    if (!labelByNorm.has(normKey)) labelByNorm.set(normKey, displayLabel)
  }
  const keys = [...labelByNorm.keys()].sort((a, b) => {
    if (a === UNASSIGNED_REGION_KEY) return 1
    if (b === UNASSIGNED_REGION_KEY) return -1
    return (labelByNorm.get(a) || '').localeCompare(labelByNorm.get(b) || '', undefined, {
      sensitivity: 'base',
    })
  })
  return keys.map((normKey) => {
    const displayLabel = labelByNorm.get(normKey) || 'Other'
    return {
      normKey,
      displayLabel,
      sectionHeading: `${displayLabel} Breweries`,
      slug: regionSlugFromBucket(normKey, displayLabel),
    }
  })
}

export function groupByRegion(breweriesWithData: BreweryWithData[]): Map<string, BreweryWithData[]> {
  const map = new Map<string, BreweryWithData[]>()
  for (const row of breweriesWithData) {
    const { normKey } = bucketForRegion(row.brewery.region)
    if (!map.has(normKey)) map.set(normKey, [])
    map.get(normKey)!.push(row)
  }
  return map
}

export function findRegionBucketBySlug(
  slug: string,
  buckets: RegionBucket[]
): RegionBucket | undefined {
  return buckets.find((b) => b.slug === slug)
}

export async function getBreweriesWithEvents(): Promise<BreweryWithData[]> {
  const breweries = await getAllBreweriesWithSlugs()
  return Promise.all(
    breweries.map(async (brewery) => ({
      brewery: { id: brewery.id, name: brewery.name, region: brewery.Region ?? null },
      events: await getBreweryEvents(brewery.id),
      releases: await getBreweryReleases(brewery.id),
      foodTrucks: await getBreweryFoodTrucks(brewery.id),
    }))
  )
}
