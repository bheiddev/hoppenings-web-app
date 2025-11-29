import { supabase } from './supabase'
import { Event } from '@/types/supabase'
import { expandRecurringEvents } from './utils'
import { generateEventSlug } from './slug'

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

    // Expand recurring events
    const expandedEvents = expandRecurringEvents(events)

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

    return eventsWithSlugs
  } catch (error) {
    console.error('Error fetching events with slugs:', error)
    return []
  }
}

/**
 * Get a single event by slug
 */
export async function getEventBySlug(slug: string): Promise<EventWithSlug | null> {
  const allEvents = await getAllEventsWithSlugs()
  return allEvents.find(event => event.slug === slug) || null
}

