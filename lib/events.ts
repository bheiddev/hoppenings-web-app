import { supabase } from './supabase'
import { Event } from '@/types/supabase'
import { expandRecurringEvents } from './utils'
import { generateEventSlug } from './slug'
import { isEventInIndexableWindow } from './contentExpiry'

export interface EventWithSlug extends Event {
  slug: string
}

/**
 * Fetch all events with brewery data and generate slugs
 * Used for static page generation
 */
export async function getAllEventsWithSlugs(): Promise<EventWithSlug[]> {
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
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
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
        name: event.breweries?.name || 'Unknown Brewery',
        location: event.breweries?.location || null
      }
    })) as Event[]

    // Expand recurring events - include past events for detail page generation
    // This allows past events to still be accessible via their URLs (good for SEO)
    const expandedEvents = expandRecurringEvents(events, false)

    // Generate slugs for each event
    const eventsWithSlugs: EventWithSlug[] = expandedEvents.map((event) => {
      const isRecurring = event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly
      const slug = generateEventSlug(
        event.title,
        event.breweries.name,
        event.breweries.location || null,
        event.event_date,
        event.id,
        isRecurring
      )

      return {
        ...event,
        slug
      }
    })

    // Only include events in the indexable window (sitemap + listing). Expired URLs 301 from the detail page.
    return eventsWithSlugs.filter((event) => isEventInIndexableWindow(event.event_date))
  } catch (error) {
    console.error('Error fetching events with slugs:', error)
    return []
  }
}

/** All events with slugs, no date filter. Used to detect expired (formerly indexed) event URLs for 301. */
async function getAllEventsWithSlugsUnfiltered(): Promise<EventWithSlug[]> {
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
    .order('event_date', { ascending: true })

  if (error || !data) return []

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
      name: event.breweries?.name || 'Unknown Brewery',
      location: event.breweries?.location || null
    }
  })) as Event[]

  const expanded = expandRecurringEvents(events, false)
  return expanded.map((event) => {
    const isRecurring = event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly
    const slug = generateEventSlug(
      event.title,
      event.breweries.name,
      event.breweries.location || null,
      event.event_date,
      event.id,
      isRecurring
    )
    return { ...event, slug }
  })
}

/**
 * Get a single event by slug (only within indexable window)
 */
export async function getEventBySlug(slug: string): Promise<EventWithSlug | null> {
  const allEvents = await getAllEventsWithSlugs()
  return allEvents.find(event => event.slug === slug) || null
}

/**
 * Get event by slug even if past indexable window (for redirecting expired URLs)
 */
export async function getEventBySlugIncludingExpired(slug: string): Promise<EventWithSlug | null> {
  const allEvents = await getAllEventsWithSlugsUnfiltered()
  return allEvents.find(event => event.slug === slug) || null
}

