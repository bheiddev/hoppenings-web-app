import { supabase } from './supabase'
import { BeerRelease } from '@/types/supabase'
import { generateReleaseSlug } from './slug'

export interface BeerReleaseWithSlug extends BeerRelease {
  slug: string
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
          location
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
        location: release.breweries?.location || null
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

      return {
        ...release,
        slug
      }
    })

    // Filter out releases older than 2 weeks, but keep future releases
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const twoWeeksAgoStr = twoWeeksAgo.toLocaleDateString('en-CA', {
      timeZone: 'America/Denver'
    })

    const filteredReleases = releasesWithSlugs.filter((release) => {
      if (!release.release_date) return true // Keep releases without dates
      const releaseDate = new Date(release.release_date)
      const releaseDateStr = releaseDate.toLocaleDateString('en-CA', {
        timeZone: 'America/Denver'
      })
      // Keep if release date is within the last 2 weeks or in the future
      return releaseDateStr >= twoWeeksAgoStr
    })

    return filteredReleases
  } catch (error) {
    console.error('Error fetching releases with slugs:', error)
    return []
  }
}

/**
 * Get a single release by slug
 */
export async function getReleaseBySlug(slug: string): Promise<BeerReleaseWithSlug | null> {
  const allReleases = await getAllReleasesWithSlugs()
  return allReleases.find(release => release.slug === slug) || null
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

