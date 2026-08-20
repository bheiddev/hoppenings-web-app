import { supabase } from './supabase'
import { Brewery, BreweryHours, Event, BeerRelease, FoodTruck, ProposedEvent, TaplistItem } from '@/types/supabase'
import { filterBreweryFoodTrucksForDisplay, foodTruckShowsOnDate } from '@/lib/foodTrucks'
import { generateBrewerySlug, generateLegacyBrewerySlug } from './slug'
import { expandRecurringEvents, getTodayMountainDateString, isEventInPast } from './utils'
import { isReleaseInIndexableWindow } from './contentExpiry'
import { ensureFreshBreweryImages } from './storageUrls'

export interface BreweryWithSlug extends Brewery {
  slug: string
  legacySlug: string
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

    // Refresh signed storage URLs (brewery-images is private; tokens expire ~yearly).
    const breweriesWithSlugs: BreweryWithSlug[] = await Promise.all(
      data.map(async (brewery: Brewery) => {
        const withFreshImages = await ensureFreshBreweryImages(brewery)
        const slug = generateBrewerySlug(
          withFreshImages.name,
          withFreshImages.location,
          withFreshImages.id
        )
        const legacySlug = generateLegacyBrewerySlug(
          withFreshImages.name,
          withFreshImages.location,
          withFreshImages.id
        )

        return {
          ...withFreshImages,
          slug,
          legacySlug,
        }
      })
    )

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
  const index = new Map<string, BreweryWithSlug>()
  for (const brewery of allBreweries) {
    index.set(brewery.slug, brewery)
    index.set(brewery.legacySlug, brewery)
  }
  return index.get(slug) || null
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

/** Batch-fetch hours for many breweries (admin region loads). */
export async function getBreweryHoursByBreweryIds(
  breweryIds: string[]
): Promise<Map<string, BreweryHours>> {
  const map = new Map<string, BreweryHours>()
  if (breweryIds.length === 0) return map

  try {
    const { data, error } = await supabase
      .from('brewery_hours')
      .select('*')
      .in('brewery_id', breweryIds)

    if (error) {
      console.error('Error fetching brewery hours batch:', error)
      return map
    }

    for (const row of data ?? []) {
      if (row.brewery_id) map.set(row.brewery_id, row as BreweryHours)
    }
  } catch (error) {
    console.error('Error fetching brewery hours batch:', error)
  }

  return map
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

    // Same indexable window as sitemap and release detail (lib/contentExpiry)
    const filteredReleases = releases.filter((release) =>
      isReleaseInIndexableWindow(release.release_date)
    )

    return filteredReleases
  } catch (error) {
    console.error('Error fetching brewery releases:', error)
    return []
  }
}

/**
 * Food trucks shown under a brewery: permanent trucks + upcoming date-specific ones.
 */
export async function getBreweryFoodTrucks(breweryId: string): Promise<FoodTruck[]> {
  try {
    const { data, error } = await supabase
      .from('food_trucks')
      .select('id, created_at, brewery_id, name, permanent, date, closed')
      .eq('brewery_id', breweryId)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching brewery food trucks:', error)
      return []
    }

    if (!data) return []

    const trucks = data.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      brewery_id: row.brewery_id,
      name: row.name,
      permanent: row.permanent,
      date: row.date,
      closed: row.closed,
    })) as FoodTruck[]

    return filterBreweryFoodTrucksForDisplay(trucks)
  } catch (error) {
    console.error('Error fetching brewery food trucks:', error)
    return []
  }
}

export type BreweryTonightFood = {
  active: boolean
  label: string
  detail: string | null
  href?: string | null
}

/**
 * Resolve tonight's food situation: scheduled truck, permanent truck, or kitchen flag.
 */
export async function getBreweryTonightFood(
  breweryId: string,
  hasKitchenFood: boolean
): Promise<BreweryTonightFood> {
  try {
    const today = getTodayMountainDateString()
    const { data, error } = await supabase
      .from('food_trucks')
      .select('id, created_at, brewery_id, name, permanent, date, closed')
      .eq('brewery_id', breweryId)

    if (error) {
      console.error('Error fetching brewery food for tonight:', error)
    } else {
      const trucks = (data ?? []).map((row) => ({
        id: row.id,
        created_at: row.created_at,
        brewery_id: row.brewery_id,
        name: row.name,
        permanent: row.permanent,
        date: row.date,
        closed: row.closed,
      })) as FoodTruck[]

      const tonightTruck = trucks.find((truck) => foodTruckShowsOnDate(truck, today))
      if (tonightTruck) {
        const isPermanent = tonightTruck.permanent === true
        return {
          active: true,
          label:
            tonightTruck.name?.trim() ||
            (isPermanent ? 'Food available' : 'Food truck tonight'),
          detail: isPermanent ? 'On site' : 'Food truck',
        }
      }
    }

    if (hasKitchenFood) {
      return {
        active: true,
        label: 'Kitchen open',
        detail: 'Food available',
      }
    }

    return {
      active: false,
      label: 'No food tonight',
      detail: null,
    }
  } catch (error) {
    console.error('Error resolving brewery tonight food:', error)
    return {
      active: false,
      label: 'No food tonight',
      detail: null,
    }
  }
}

/**
 * Get taplist for a brewery from tap_list table
 */
export async function getBreweryTaplist(breweryId: string): Promise<TaplistItem[]> {
  try {
    const { data, error } = await supabase
      .from('tap_list')
      .select('brewery_id, beer_name, description, abv, type, is_active, first_seen_at, last_seen_at')
      .eq('brewery_id', breweryId)
      .order('beer_name', { ascending: true })

    if (error) {
      console.error('Error fetching tap_list:', error)
      return []
    }

    if (!data) return []

    return data.map((row: any) => ({
      brewery_id: row.brewery_id,
      beer_name: row.beer_name ?? '',
      description: row.description ?? null,
      abv: row.abv ?? null,
      type: row.type ?? null,
      is_active: row.is_active ?? true,
      first_seen: row.first_seen_at ?? null,
      last_seen: row.last_seen_at ?? null
    })) as TaplistItem[]
  } catch (error) {
    console.error('Error fetching tap_list:', error)
    return []
  }
}

/**
 * Get proposed events for a brewery from proposed_events table
 */
export async function getProposedEventsByBreweryId(breweryId: string): Promise<ProposedEvent[]> {
  try {
    const { data, error } = await supabase
      .from('proposed_events')
      .select(
        'id, created_at, title, description, brewery_id, event_date, start_time, brewery_id2, brewery_id3, cost, end_time, featured, is_recurring, is_recurring_biweekly, is_recurring_monthly'
      )
      .or(`brewery_id.eq.${breweryId},brewery_id2.eq.${breweryId},brewery_id3.eq.${breweryId}`)
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error fetching proposed events:', error)
      return []
    }

    if (!data) return []

    return data
      .map((row: any) => ({
        id: row.id,
        created_at: row.created_at,
        title: row.title ?? null,
        description: row.description ?? null,
        brewery_id: row.brewery_id ?? null,
        event_date: row.event_date ?? null,
        start_time: row.start_time ?? null,
        brewery_id2: row.brewery_id2 ?? null,
        brewery_id3: row.brewery_id3 ?? null,
        cost: row.cost ?? null,
        end_time: row.end_time ?? null,
        featured: row.featured ?? null,
        is_recurring: row.is_recurring ?? null,
        is_recurring_biweekly: row.is_recurring_biweekly ?? null,
        is_recurring_monthly: row.is_recurring_monthly ?? null,
      }))
      .filter((event) => !event.event_date?.trim() || !isEventInPast(event.event_date)) as ProposedEvent[]
  } catch (error) {
    console.error('Error fetching proposed events:', error)
    return []
  }
}

