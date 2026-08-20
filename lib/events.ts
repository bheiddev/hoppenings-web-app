import { supabase } from './supabase'
import { Event } from '@/types/supabase'
import { expandRecurringEvents, getTodayMountainDateString, normalizeEventDateToMountainTime } from './utils'
import { generateEventSlug, generateLegacyEventSlug, generateSlug } from './slug'
import { isEventInIndexableWindow } from './contentExpiry'
import { ensureFreshStorageUrl } from './storageUrls'

export interface EventWithSlug extends Event {
  slug: string
  legacySlug: string
}

const EVENTS_BASE_SELECT = `
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
    location,
    Region,
    image_url,
    latitude,
    longitude
  )
`

const SUPABASE_PAGE_SIZE = 1000

function mapEventRow(event: Record<string, unknown>): Event {
  const breweries = event.breweries as Record<string, unknown> | null
  return {
    id: event.id as string,
    created_at: event.created_at as string,
    title: event.title as string,
    description: event.description as string | null,
    brewery_id: event.brewery_id as string,
    event_date: event.event_date as string,
    start_time: event.start_time as string | null,
    end_time: event.end_time as string | null,
    cost: (event.cost as number | null) ?? null,
    is_recurring: (event.is_recurring as boolean) || false,
    is_recurring_biweekly: (event.is_recurring_biweekly as boolean) || false,
    is_recurring_monthly: (event.is_recurring_monthly as boolean) || false,
    recurrence_pattern: null,
    featured: (event.featured as boolean) || false,
    breweries: {
      id: (breweries?.id as string) || '',
      name: (breweries?.name as string) || 'Unknown Brewery',
      location: (breweries?.location as string) || null,
      Region: (breweries?.Region as string) || null,
      image_url: (breweries?.image_url as string | null) || null,
      latitude: (breweries?.latitude as number | null) ?? null,
      longitude: (breweries?.longitude as number | null) ?? null,
    },
  }
}

/** Recurring templates (old event_date anchors) — fetched separately from upcoming one-time rows. */
async function fetchRecurringEventRows(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events_base')
    .select(EVENTS_BASE_SELECT)
    .or(
      'is_recurring.eq.true,is_recurring_biweekly.eq.true,is_recurring_monthly.eq.true'
    )

  if (error) {
    console.error('Error fetching recurring events:', error)
    return []
  }

  return (data ?? []).map((row) => mapEventRow(row as Record<string, unknown>))
}

/** One-time events from minDate forward, paginated past Supabase's 1000-row cap. */
async function fetchNonRecurringEventRows(minDate: string): Promise<Event[]> {
  const results: Event[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('events_base')
      .select(EVENTS_BASE_SELECT)
      .eq('is_recurring', false)
      .eq('is_recurring_biweekly', false)
      .eq('is_recurring_monthly', false)
      .gte('event_date', minDate)
      .order('event_date', { ascending: true })
      .range(offset, offset + SUPABASE_PAGE_SIZE - 1)

    if (error) {
      console.error('Error fetching non-recurring events:', error)
      break
    }

    if (!data?.length) break

    results.push(...data.map((row) => mapEventRow(row as Record<string, unknown>)))

    if (data.length < SUPABASE_PAGE_SIZE) break
    offset += SUPABASE_PAGE_SIZE
  }

  return results
}

/**
 * Load events_base without hitting the 1000-row limit on a single ascending event_date query.
 * Recurring templates are loaded in full; one-time events are filtered by minNonRecurringDate server-side.
 */
export async function fetchEventsBaseRows(options?: {
  /** Minimum event_date (YYYY-MM-DD) for one-time events. Defaults to today in Mountain Time. */
  minNonRecurringDate?: string
}): Promise<Event[]> {
  const minDate = options?.minNonRecurringDate ?? getTodayMountainDateString()

  const [recurring, nonRecurring] = await Promise.all([
    fetchRecurringEventRows(),
    fetchNonRecurringEventRows(minDate),
  ])

  const byId = new Map<string, Event>()
  for (const event of [...recurring, ...nonRecurring]) {
    byId.set(event.id, event)
  }
  return Array.from(byId.values())
}

/** Expanded upcoming events for listing pages (/events, city pages). */
export async function getExpandedEventsForListing(): Promise<Event[]> {
  const rows = await fetchEventsBaseRows()
  const expanded = expandRecurringEvents(rows)
  return withFreshBreweryImages(expanded)
}

/** Events happening today (Mountain Time) for the home page carousel. */
export async function getTonightCarouselEvents(): Promise<EventWithSlug[]> {
  const rows = await fetchEventsBaseRows()
  const expanded = expandRecurringEvents(rows, true)
  const today = getTodayMountainDateString()
  const todaysEvents = expanded.filter(
    (event) => normalizeEventDateToMountainTime(event.event_date) === today
  )
  const withImages = await withFreshBreweryImages(todaysEvents)
  return attachSlugs(withImages)
}

/** Strip trailing YYYY-MM-DD from a slug (undated recurring URLs). */
export function stripDateSuffixFromSlug(slug: string): string {
  return slug.replace(/-\d{4}-\d{2}-\d{2}$/, '')
}

function extractIsoDateFromSlug(slug: string): string | null {
  const m = slug.match(/-(\d{4}-\d{2}-\d{2})$/)
  return m?.[1] ?? null
}

function titleBrewerySlugPrefix(event: EventWithSlug): string {
  return `${generateSlug(event.title, 40)}-${generateSlug(event.breweries.name, 30)}`
}

/**
 * Find expanded instances in the same recurring series as this URL.
 * Matches exact base slug, or title+brewery when the city segment drifted
 * (e.g. north-cos vs colorado-springs).
 */
function findSeriesInstances(slug: string, allEvents: EventWithSlug[]): EventWithSlug[] {
  const base = stripDateSuffixFromSlug(slug)
  const exact = allEvents.filter((e) => stripDateSuffixFromSlug(e.slug) === base)
  if (exact.length > 0) return exact

  // Undated legacy URL equals base already handled above; also match by prefix.
  return allEvents.filter((e) => {
    const prefix = titleBrewerySlugPrefix(e)
    if (!prefix) return false
    const eventBase = stripDateSuffixFromSlug(e.slug)
    return (
      (base === prefix || base.startsWith(`${prefix}-`)) &&
      (eventBase === prefix || eventBase.startsWith(`${prefix}-`))
    )
  })
}

function pickNextUpcomingEvent(events: EventWithSlug[]): EventWithSlug | null {
  if (events.length === 0) return null
  const today = getTodayMountainDateString()
  const sorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date))
  const upcoming = sorted.filter(
    (e) => normalizeEventDateToMountainTime(e.event_date) >= today
  )
  return upcoming[0] ?? sorted[sorted.length - 1]
}

function buildEventSlugMap(events: EventWithSlug[]): Map<string, EventWithSlug> {
  const map = new Map<string, EventWithSlug>()
  for (const event of events) {
    map.set(event.slug, event)
    map.set(event.legacySlug, event)
  }
  return map
}

function isRecurringEvent(event: Pick<Event, 'is_recurring' | 'is_recurring_biweekly' | 'is_recurring_monthly'>): boolean {
  return Boolean(event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly)
}

/**
 * Resolve a public event URL slug to an expanded occurrence.
 * Past dated URLs for a still-active recurring series resolve to the next upcoming
 * occurrence so Google-ranked old links stay useful.
 */
function resolveEventBySlug(slug: string, allEvents: EventWithSlug[]): EventWithSlug | null {
  const map = buildEventSlugMap(allEvents)
  const direct = map.get(slug)
  if (direct) return direct

  const series = findSeriesInstances(slug, allEvents)
  if (series.length === 0) return null

  const requestedDate = extractIsoDateFromSlug(slug)
  if (requestedDate) {
    const exactDate = series.find(
      (e) => normalizeEventDateToMountainTime(e.event_date) === requestedDate
    )
    if (exactDate) return exactDate
  }

  // Undated legacy URL, or past date no longer in the expansion window → next occurrence.
  return pickNextUpcomingEvent(series)
}


function attachSlugs(events: Event[]): EventWithSlug[] {
  return events.map((event) => {
    const isRecurring =
      event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly
    const slug = generateEventSlug(
      event.title,
      event.breweries.name,
      event.breweries.location || null,
      event.event_date,
      event.id,
      isRecurring
    )
    const legacySlug = generateLegacyEventSlug(
      event.title,
      event.breweries.name,
      event.breweries.location || null,
      event.event_date,
      event.id,
      isRecurring
    )
    return { ...event, slug, legacySlug }
  })
}

async function withFreshBreweryImages(events: Event[]): Promise<Event[]> {
  return Promise.all(
    events.map(async (event) => ({
      ...event,
      breweries: {
        ...event.breweries,
        image_url: await ensureFreshStorageUrl(event.breweries.image_url),
      },
    }))
  )
}

/**
 * Fetch all events with brewery data and generate slugs
 * Used for static page generation
 */
export async function getAllEventsWithSlugs(): Promise<EventWithSlug[]> {
  try {
    const events = await fetchEventsBaseRows()
    const expandedEvents = expandRecurringEvents(events, false)
    const withImages = await withFreshBreweryImages(expandedEvents)
    const eventsWithSlugs = attachSlugs(withImages)
    return eventsWithSlugs.filter((event) => isEventInIndexableWindow(event.event_date))
  } catch (error) {
    console.error('Error fetching events with slugs:', error)
    return []
  }
}

/** All events with slugs, no date filter. Used to detect expired (formerly indexed) event URLs for 301. */
async function getAllEventsWithSlugsUnfiltered(): Promise<EventWithSlug[]> {
  try {
    const events = await fetchEventsBaseRows({ minNonRecurringDate: '1970-01-01' })
    const expanded = expandRecurringEvents(events, false)
    const withImages = await withFreshBreweryImages(expanded)
    return attachSlugs(withImages)
  } catch (error) {
    console.error('Error fetching unfiltered events with slugs:', error)
    return []
  }
}

/**
 * Get a single event by slug (only within indexable window)
 */
export async function getEventBySlug(slug: string): Promise<EventWithSlug | null> {
  const allEvents = await getAllEventsWithSlugs()
  return resolveEventBySlug(slug, allEvents)
}

/**
 * Get event by slug even if past indexable window (for redirecting expired URLs).
 * For recurring series, prefers the next upcoming occurrence when the dated URL is stale.
 */
export async function getEventBySlugIncludingExpired(slug: string): Promise<EventWithSlug | null> {
  const allEvents = await getAllEventsWithSlugsUnfiltered()
  return resolveEventBySlug(slug, allEvents)
}

export function eventIsRecurring(
  event: Pick<Event, 'is_recurring' | 'is_recurring_biweekly' | 'is_recurring_monthly'>
): boolean {
  return isRecurringEvent(event)
}
