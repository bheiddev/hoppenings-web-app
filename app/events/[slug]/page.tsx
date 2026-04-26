import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getEventBySlug, getEventBySlugIncludingExpired, getAllEventsWithSlugs } from '@/lib/events'
import { EXPIRED_EVENT_REDIRECT } from '@/lib/contentExpiry'
import { formatEventDate, formatTime12Hour, isEventInPast } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
import { generateBrewerySlug, generateEventSlug } from '@/lib/slug'
import { getBreweryEvents } from '@/lib/breweries'
import Image from 'next/image'
import Link from 'next/link'
import { TextWithLinks } from '@/components/TextWithLinks'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

function cityFromLocation(location?: string | null): string {
  if (!location) return 'Colorado'
  return location.split(',')[0].trim() || 'Colorado'
}

function cityPagePath(city: string): string {
  const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (slug === 'boulder' || slug === 'longmont') return '/boulder-longmont'
  const allowed = new Set(['colorado-springs', 'fort-collins', 'boulder-longmont'])
  return allowed.has(slug) ? `/${slug}` : '/events'
}

function buildEventDateTime(date: string, time: string | null | undefined): string | undefined {
  if (!time) return undefined
  return `${date}T${time}`
}

function buildEventEndDateTime(
  date: string,
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string | undefined {
  if (!startTime || !endTime) return undefined
  const start = new Date(`${date}T${startTime}`)
  const end = new Date(`${date}T${endTime}`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined
  if (end < start) {
    end.setDate(end.getDate() + 1)
  }
  return end.toISOString()
}

function eventCanonicalPath(event: {
  title: string
  breweries: { name: string; location?: string | null }
  event_date: string
  id: string
  is_recurring: boolean
  is_recurring_biweekly: boolean
  is_recurring_monthly: boolean
}): string {
  const isRecurring = event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly
  const slug = generateEventSlug(
    event.title,
    event.breweries.name,
    event.breweries.location || null,
    event.event_date,
    event.id,
    isRecurring
  )
  return `/events/${slug}`
}

export async function generateStaticParams() {
  const events = await getAllEventsWithSlugs()
  return events.map((event) => ({
    slug: event.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  
  if (!event) {
    return {
      title: 'Event Not Found | Hoppenings',
    }
  }

  const breweryName = event.breweries.name
  const location = event.breweries.location || ''
  const city = cityFromLocation(location)
  const eventDate = formatEventDate(event.event_date)
  const timeLabel = event.start_time ? formatTime12Hour(event.start_time) : null
  const recurrenceText = event.is_recurring ? 'Weekly' : eventDate
  const description =
    event.description && event.description.trim().length >= 60
      ? `${event.description.substring(0, 155)}...`
      : `${event.title} at ${breweryName} in ${city}. ${recurrenceText}${timeLabel ? ` at ${timeLabel}` : ''}.`

  return {
    title: `${event.title} at ${breweryName} | ${recurrenceText}${timeLabel ? ` ${timeLabel}` : ''} in ${city} | Hoppenings`,
    description: description,
    keywords: `${event.title}, ${breweryName}, ${location}, brewery event, craft beer, ${eventDate}`,
    alternates: {
      canonical: `${BASE_URL}${eventCanonicalPath(event)}`,
    },
    openGraph: {
      title: `${event.title} at ${breweryName} in ${city}`,
      description: description,
      type: 'website',
      url: `${BASE_URL}${eventCanonicalPath(event)}`,
    },
  }
}

// Revalidate every hour to pick up new events
export const revalidate = 3600

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    const expiredEvent = await getEventBySlugIncludingExpired(slug)
    if (expiredEvent) {
      permanentRedirect(EXPIRED_EVENT_REDIRECT)
    }
    notFound()
  }
  const canonicalPath = eventCanonicalPath(event)
  const canonicalSlug = canonicalPath.split('/').pop()
  if (slug !== canonicalSlug) {
    permanentRedirect(canonicalPath)
  }

  // Fetch full brewery data for the detail page
  let brewery = null
  try {
    const { data } = await supabase
      .from('breweries')
      .select('*')
      .eq('id', event.brewery_id)
      .single()
    brewery = data
  } catch (error) {
    console.error('Error fetching brewery:', error)
  }

  const isPastEvent = isEventInPast(event.event_date)
  const city = cityFromLocation(event.breweries.location)
  const relatedFromBrewery = (await getBreweryEvents(event.brewery_id))
    .filter((e) => e.id !== event.id)
    .slice(0, 3)
  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || undefined,
    startDate: buildEventDateTime(event.event_date, event.start_time) || event.event_date,
    endDate: buildEventEndDateTime(event.event_date, event.start_time, event.end_time),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.breweries.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: 'CO',
        addressCountry: 'US',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: event.breweries.name,
    },
    offers: {
      '@type': 'Offer',
      price: event.cost != null ? String(event.cost) : '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}${eventCanonicalPath(event)}`,
    },
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Previous Event Banner */}
        {isPastEvent && (
          <div 
            className="mb-6 p-4 rounded-lg border-2"
            style={{ 
              backgroundColor: Colors.background,
              borderColor: Colors.textSecondary,
            }}
          >
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: Colors.textSecondary }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
              </svg>
              <p 
                className="text-sm font-medium"
                style={{ 
                  color: Colors.textSecondary,
                  fontFamily: 'var(--font-be-vietnam-pro)'
                }}
              >
                This is a previous event that has already occurred.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/events"
            className="inline-flex items-center gap-2 mb-4 text-sm font-medium hover:underline"
            style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
            </svg>
            Back to Events
          </Link>
          <h1 className="text-4xl font-bold mb-2" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
            {event.title}
          </h1>
          <p className="text-xl" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
            {formatEventDate(event.event_date)}
          </p>
        </div>

        <div style={{ height: '1px', backgroundColor: Colors.textPrimary, marginBottom: '2rem' }} />

        {/* Event Details Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
            {event.description && (
              <div className="flex-1">
                <p className="text-base leading-relaxed" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                  <TextWithLinks text={event.description} />
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-3 md:flex-shrink-0">
              {event.start_time && (
                <div className="flex items-center justify-center px-3 py-2 rounded-full" style={{ backgroundColor: Colors.backgroundLight }}>
                  <span className="text-sm font-medium leading-none" style={{ color: Colors.textDark, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                    {formatTime12Hour(event.start_time)}
                  </span>
                </div>
              )}

              {event.cost !== null && (
                <div className="flex items-center justify-center px-3 py-2 rounded-full" style={{ backgroundColor: Colors.backgroundLight }}>
                  <span className="text-sm font-medium leading-none" style={{ color: Colors.textDark, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                    ${event.cost.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {event.is_recurring && event.recurrence_pattern && (
            <div className="mb-4">
              <p className="text-sm" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                {event.recurrence_pattern}
              </p>
            </div>
          )}
        </div>

        {/* Brewery Section */}
        <div>
          {(() => {
            const breweryName = brewery?.name || event.breweries.name
            const breweryLocation = brewery?.location || event.breweries.location
            const breweryId = brewery?.id || event.brewery_id
            const brewerySlug = generateBrewerySlug(breweryName, breweryLocation, breweryId)
            return (
              <Link href={`/breweries/${brewerySlug}`}>
                <h2 className="text-2xl font-bold mb-4 hover:underline cursor-pointer" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                  {breweryName}
                </h2>
              </Link>
            )
          })()}

          {brewery?.image_url && (
            <div className="relative w-full h-96 mb-6 rounded-lg overflow-hidden" style={{ backgroundColor: Colors.backgroundDark }}>
              <Image
                src={brewery.image_url}
                alt={brewery.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {brewery?.description && (
            <p className="text-base leading-relaxed mb-6" style={{ color: Colors.textPrimary, lineHeight: '1.6', fontFamily: 'var(--font-be-vietnam-pro)' }}>
              {brewery.description}
            </p>
          )}

          {(() => {
            const breweryName = brewery?.name || event.breweries.name
            const breweryLocation = brewery?.location || event.breweries.location
            const breweryId = brewery?.id || event.brewery_id
            const brewerySlug = generateBrewerySlug(breweryName, breweryLocation, breweryId)
            return (
              <Link
                href={`/breweries/${brewerySlug}`}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-base transition-colors hover:opacity-90"
                style={{ 
                  backgroundColor: Colors.background,
                  color: Colors.textDark,
                  fontFamily: 'var(--font-fjalla-one)',
                }}
              >
                VIEW BREWERY
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                </svg>
              </Link>
            )
          })()}

          <div className="mt-8 pt-6 border-t" style={{ borderColor: Colors.dividerLight }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
              Explore More
            </h3>
            <div className="flex flex-col gap-2 text-sm" style={{ color: Colors.textPrimary }}>
              <Link href={cityPagePath(city)} className="underline" style={{ color: Colors.primary }}>
                More events in {city}
              </Link>
              <Link href={cityPagePath(city)} className="underline" style={{ color: Colors.primary }}>
                More breweries in {city}
              </Link>
              {relatedFromBrewery.map((rel) => {
                const relSlug = generateEventSlug(
                  rel.title,
                  rel.breweries.name,
                  rel.breweries.location || null,
                  rel.event_date,
                  rel.id,
                  rel.is_recurring || rel.is_recurring_biweekly || rel.is_recurring_monthly
                )
                return (
                  <Link key={rel.id} href={`/events/${relSlug}`} className="underline" style={{ color: Colors.primary }}>
                    {rel.title} ({formatEventDate(rel.event_date)})
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

