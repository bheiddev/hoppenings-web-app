import { supabase } from './supabase'
import { BeerRelease } from '@/types/supabase'
import { generateReleaseSlug, generateLegacyReleaseSlug } from './slug'
import { isReleaseInIndexableWindow } from './contentExpiry'

export interface BeerReleaseWithSlug extends BeerRelease {
  slug: string
  legacySlug: string
}

function buildReleaseSlugMap(releases: BeerReleaseWithSlug[]): Map<string, BeerReleaseWithSlug> {
  const map = new Map<string, BeerReleaseWithSlug>()
  for (const release of releases) {
    map.set(release.slug, release)
    map.set(release.legacySlug, release)
  }
  return map
}

/**
 * Fetch all beer releases with brewery data and generate slugs
 * Used for static page generation
 */
export async function getAllReleasesWithSlugs(): Promise<BeerReleaseWithSlug[]> {
  try {
    const { data, error } = await supabase
      .from('beer_releases_base')
      .select(`
        id,
        created_at,
        beer_name,
        "ABV",
        "Type",
        description,
        brewery_id,
        brewery_id2,
        brewery_id3,
        release_date,
        breweries!beer_releases_brewery_id_fkey (
          id,
          name,
          location,
          Region
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500) // Increase limit to get all releases

    if (error) {
      console.error('Error fetching releases:', error)
      return []
    }

    if (!data) return []

    // Map to BeerRelease type
    const releases = data.map((release: any) => ({
      id: release.id,
      created_at: release.created_at,
      beer_name: release.beer_name,
      ABV: release.ABV,
      Type: release.Type,
      description: release.description,
      brewery_id: release.brewery_id,
      brewery_id2: release.brewery_id2,
      brewery_id3: release.brewery_id3,
      release_date: release.release_date,
      breweries: {
        id: release.breweries?.id || '',
        name: release.breweries?.name || 'Unknown Brewery',
        location: release.breweries?.location || null,
        Region: release.breweries?.Region || null
      }
    })) as BeerRelease[]

    // Generate slugs for each release
    const releasesWithSlugs: BeerReleaseWithSlug[] = releases.map((release) => {
      const slug = generateReleaseSlug(
        release.beer_name,
        release.Type,
        release.breweries.name,
        release.breweries.location || null,
        release.id
      )
      const legacySlug = generateLegacyReleaseSlug(
        release.beer_name,
        release.Type,
        release.breweries.name,
        release.breweries.location || null,
        release.id
      )

      return {
        ...release,
        slug,
        legacySlug,
      }
    })

    // Only include releases in the indexable window (sitemap + listing). Expired URLs 301 from the detail page.
    const filteredReleases = releasesWithSlugs.filter((release) =>
      isReleaseInIndexableWindow(release.release_date)
    )

    return filteredReleases
  } catch (error) {
    console.error('Error fetching releases with slugs:', error)
    return []
  }
}

/**
 * Get a single release by slug (only within current 2-week window)
 */
export async function getReleaseBySlug(slug: string): Promise<BeerReleaseWithSlug | null> {
  const allReleases = await getAllReleasesWithSlugs()
  return buildReleaseSlugMap(allReleases).get(slug) || null
}

/**
 * Fetch all releases with slugs, no date filter. Used to detect expired (formerly indexed) URLs.
 */
async function getAllReleasesWithSlugsUnfiltered(): Promise<BeerReleaseWithSlug[]> {
  try {
    const { data, error } = await supabase
      .from('beer_releases_base')
      .select(`
        id,
        created_at,
        beer_name,
        "ABV",
        "Type",
        description,
        brewery_id,
        brewery_id2,
        brewery_id3,
        release_date,
        breweries!beer_releases_brewery_id_fkey (
          id,
          name,
          location,
          Region
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Error fetching releases (unfiltered):', error)
      return []
    }

    if (!data) return []

    const releases = data.map((release: any) => ({
      id: release.id,
      created_at: release.created_at,
      beer_name: release.beer_name,
      ABV: release.ABV,
      Type: release.Type,
      description: release.description,
      brewery_id: release.brewery_id,
      brewery_id2: release.brewery_id2,
      brewery_id3: release.brewery_id3,
      release_date: release.release_date,
      breweries: {
        id: release.breweries?.id || '',
        name: release.breweries?.name || 'Unknown Brewery',
        location: release.breweries?.location || null,
        Region: release.breweries?.Region || null
      }
    })) as BeerRelease[]

    return releases.map((release) => {
      const slug = generateReleaseSlug(
        release.beer_name,
        release.Type,
        release.breweries.name,
        release.breweries.location || null,
        release.id
      )
      const legacySlug = generateLegacyReleaseSlug(
        release.beer_name,
        release.Type,
        release.breweries.name,
        release.breweries.location || null,
        release.id
      )
      return { ...release, slug, legacySlug }
    })
  } catch (error) {
    console.error('Error fetching releases (unfiltered):', error)
    return []
  }
}

/**
 * Get a release by slug even if it's past the 2-week window (for redirecting expired URLs).
 */
export async function getReleaseBySlugIncludingExpired(slug: string): Promise<BeerReleaseWithSlug | null> {
  const allReleases = await getAllReleasesWithSlugsUnfiltered()
  return buildReleaseSlugMap(allReleases).get(slug) || null
}

/**
 * Get all breweries associated with a release (can have up to 3)
 */
export async function getReleaseBreweries(release: BeerRelease): Promise<any[]> {
  const breweryIds = [
    release.brewery_id,
    release.brewery_id2,
    release.brewery_id3
  ].filter(Boolean) as string[]

  if (breweryIds.length === 0) return []

  try {
    const { data, error } = await supabase
      .from('breweries')
      .select('*')
      .in('id', breweryIds)

    if (error) {
      console.error('Error fetching release breweries:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching release breweries:', error)
    return []
  }
}

