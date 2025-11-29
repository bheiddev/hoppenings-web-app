import { supabase } from './supabase'
import { Brewery, BreweryHours, Event, BeerRelease } from '@/types/supabase'
import { generateBrewerySlug } from './slug'
import { expandRecurringEvents } from './utils'

export interface BreweryWithSlug extends Brewery {
  slug: string
}

/**
 * Fetch all breweries and generate slugs
 * Used for static page generation
 */
export async function getAllBreweriesWithSlugs(): Promise<BreweryWithSlug[]> {
  try {
    const { data, error } = await supabase
      .from('breweries')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching breweries:', error)
      return []
    }

    if (!data) return []

    // Generate slugs for each brewery
    const breweriesWithSlugs: BreweryWithSlug[] = data.map((brewery: any) => {
      const slug = generateBrewerySlug(
        brewery.name,
        brewery.location,
        brewery.id
      )

      return {
        ...brewery,
        slug
      }
    })

    return breweriesWithSlugs
  } catch (error) {
    console.error('Error fetching breweries with slugs:', error)
    return []
  }
}

/**
 * Get a single brewery by slug
 */
export async function getBreweryBySlug(slug: string): Promise<BreweryWithSlug | null> {
  const allBreweries = await getAllBreweriesWithSlugs()
  return allBreweries.find(brewery => brewery.slug === slug) || null
}

/**
 * Get brewery hours
 */
export async function getBreweryHours(breweryId: string): Promise<BreweryHours | null> {
  try {
    const { data, error } = await supabase
      .from('brewery_hours')
      .select('*')
      .eq('brewery_id', breweryId)
      .maybeSingle()

    if (error) {
      // Only log non-404 errors (PGRST116 is "no rows found" which is expected for some breweries)
      if (error.code !== 'PGRST116') {
        console.error('Error fetching brewery hours:', error)
      }
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching brewery hours:', error)
    return null
  }
}

/**
 * Get brewery events (expanded recurring events)
 */
export async function getBreweryEvents(breweryId: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events_base')
      .select(`
        id,
        created_at,
        title,
        brewery_id,
        event_date,
        start_time,
        end_time,
        cost,
        is_recurring,
        is_recurring_biweekly,
        is_recurring_monthly,
        description,
        featured,
        breweries (
          id,
          name,
          location
        )
      `)
      .eq('brewery_id', breweryId)
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error fetching brewery events:', error)
      return []
    }

    if (!data) return []

    // Map to Event type
    const events = data.map((event: any) => ({
      id: event.id,
      created_at: event.created_at,
      title: event.title,
      description: event.description,
      brewery_id: event.brewery_id,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      cost: event.cost,
      is_recurring: event.is_recurring || false,
      is_recurring_biweekly: event.is_recurring_biweekly || false,
      is_recurring_monthly: event.is_recurring_monthly || false,
      recurrence_pattern: null,
      featured: event.featured || false,
      breweries: {
        id: event.breweries?.id || '',
        name: event.breweries?.name || '',
        location: event.breweries?.location || null
      }
    })) as Event[]

    // Expand recurring events
    return expandRecurringEvents(events)
  } catch (error) {
    console.error('Error fetching brewery events:', error)
    return []
  }
}

/**
 * Get brewery beer releases
 */
export async function getBreweryReleases(breweryId: string): Promise<BeerRelease[]> {
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
      .or(`brewery_id.eq.${breweryId},brewery_id2.eq.${breweryId},brewery_id3.eq.${breweryId}`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching brewery releases:', error)
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
        name: release.breweries?.name || '',
        location: release.breweries?.location || null
      }
    })) as BeerRelease[]

    // Filter out releases older than 2 weeks, but keep future releases
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const twoWeeksAgoStr = twoWeeksAgo.toLocaleDateString('en-CA', { timeZone: 'America/Denver' })

    const filteredReleases = releases.filter((release) => {
      if (!release.release_date) return true // Keep releases without dates
      const releaseDate = new Date(release.release_date)
      const releaseDateStr = releaseDate.toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
      // Keep if release date is within the last 2 weeks or in the future
      return releaseDateStr >= twoWeeksAgoStr
    })

    return filteredReleases
  } catch (error) {
    console.error('Error fetching brewery releases:', error)
    return []
  }
}

