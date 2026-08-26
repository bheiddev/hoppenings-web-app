import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getEventBySlug, getEventBySlugIncludingExpired, getAllEventsWithSlugs, eventIsRecurring } from '@/lib/events'
import { EXPIRED_EVENT_REDIRECT } from '@/lib/contentExpiry'
import { formatEventDate, formatTime12Hour, isEventInPast } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
import { generateBrewerySlug, generateEventSlug } from '@/lib/slug'
import {
  filterEventsForCity,
  getRegionDisplayName,
  inferCityFromRegionOrLocation,
} from '@/lib/seoCities'
import Image from 'next/image'
import Link from 'next/link'
import { BackLink } from '@/components/BackLink'
import { TextWithLinks } from '@/components/TextWithLinks'
import { ensureFreshBreweryImages } from '@/lib/storageUrls'
import { PoshCta, PoshEyebrow, PoshPageShell, PoshSectionTitle } from '@/components/PoshPageShell'
import { HoppeningsAppPromo } from '@/components/breweryDemo/HoppeningsAppPromo'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

function cityFromLocation(location?: string | null): string {
  if (!location) return 'Colorado'
  return location.split(',')[0].trim() || 'Colorado'
}

function cityPagePath(city: string): string {
  const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (slug === 'boulder' || slug === 'longmont') return '/boulder-longmont/events'
  const allowed = new Set(['colorado-springs', 'fort-collins', 'boulder-longmont'])
  return allowed.has(slug) ? `/${slug}/events` : '/events'
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

export const revalidate = 3600

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    const expiredOrSeries = await getEventBySlugIncludingExpired(slug)
    if (expiredOrSeries) {
      if (eventIsRecurring(expiredOrSeries)) {
        permanentRedirect(eventCanonicalPath(expiredOrSeries))
      }
      permanentRedirect(EXPIRED_EVENT_REDIRECT)
    }
    notFound()
  }
  const canonicalPath = eventCanonicalPath(event)
  const canonicalSlug = canonicalPath.split('/').pop()
  if (slug !== canonicalSlug) {
    permanentRedirect(canonicalPath)
  }

  let brewery = null
  try {
    const { data } = await supabase
      .from('breweries')
      .select('*')
      .eq('id', event.brewery_id)
      .single()
    brewery = data ? await ensureFreshBreweryImages(data) : null
  } catch (error) {
    console.error('Error fetching brewery:', error)
  }

  const isPastEvent = isEventInPast(event.event_date)
  const city = cityFromLocation(event.breweries.location)
  const citySlug = inferCityFromRegionOrLocation(
    brewery?.Region ?? event.breweries.Region,
    event.breweries.location
  )
  const regionName = getRegionDisplayName(
    brewery?.Region ?? event.breweries.Region,
    event.breweries.location,
    city
  )

  const allUpcoming = await getAllEventsWithSlugs()
  const relatedEvents = (
    citySlug
      ? filterEventsForCity(allUpcoming, citySlug)
      : allUpcoming.filter((e) => e.brewery_id === event.brewery_id)
  )
    .filter((e) => e.id !== event.id && !isEventInPast(e.event_date))
    .sort((a, b) => {
      const byDate = a.event_date.localeCompare(b.event_date)
      if (byDate !== 0) return byDate
      return (a.start_time || '').localeCompare(b.start_time || '')
    })
    .slice(0, 4)

  const breweryName = brewery?.name || event.breweries.name
  const breweryLocation = brewery?.location || event.breweries.location
  const breweryId = brewery?.id || event.brewery_id
  const brewerySlug = generateBrewerySlug(breweryName, breweryLocation, breweryId)

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
    <PoshPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />

      {brewery?.image_url ? (
        <div className="relative h-[42vh] min-h-[240px] w-full overflow-hidden sm:h-[48vh]">
          <Image
            src={brewery.image_url}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(58,21,21,0.95) 0%, rgba(58,21,21,0.45) 45%, rgba(58,21,21,0.25) 100%)',
            }}
            aria-hidden
          />
        </div>
      ) : null}

      <div
        className={`mx-auto max-w-4xl px-6 sm:px-10 lg:px-12 lg:pb-14 ${
          brewery?.image_url ? 'py-10 lg:pt-14' : 'pb-10 pt-24 lg:pb-14 lg:pt-28'
        }`}
      >
        <BackLink
          fallbackHref="/events"
          style={{ color: 'rgba(249, 247, 242, 0.75)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        />

        {isPastEvent ? (
          <p
            className="mb-6 mt-4 text-sm"
            style={{ color: 'rgba(249, 247, 242, 0.55)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            This is a previous event that has already occurred.
          </p>
        ) : null}

        <PoshEyebrow>{formatEventDate(event.event_date)}</PoshEyebrow>
        <h1
          className="hop-home-fade mb-6 font-bold uppercase leading-[0.95] tracking-wide text-[clamp(2rem,7vw,4.25rem)]"
          style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {event.title}
        </h1>

        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2">
          {event.start_time ? (
            <span
              className="text-sm uppercase tracking-[0.14em]"
              style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              {formatTime12Hour(event.start_time)}
            </span>
          ) : null}
          {event.cost !== null ? (
            <span
              className="text-sm uppercase tracking-[0.14em]"
              style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              ${event.cost.toFixed(2)}
            </span>
          ) : null}
          {event.is_recurring && event.recurrence_pattern ? (
            <span
              className="text-sm"
              style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              {event.recurrence_pattern}
            </span>
          ) : null}
        </div>

        {event.description ? (
          <p
            className="mb-10 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: 'rgba(249, 247, 242, 0.82)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            <TextWithLinks text={event.description} style={{ color: Colors.accent }} />
          </p>
        ) : null}

        <div className="border-t border-white/10 pt-10">
          <PoshEyebrow>At</PoshEyebrow>
          <Link href={`/breweries/${brewerySlug}`} className="group inline-block">
            <h2
              className="mb-4 text-3xl font-bold uppercase tracking-wide transition-colors group-hover:opacity-90 sm:text-4xl"
              style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
            >
              {breweryName}
            </h2>
          </Link>

          {brewery?.description ? (
            <p
              className="mb-8 max-w-2xl text-base leading-relaxed"
              style={{ color: 'rgba(249, 247, 242, 0.72)', fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              {brewery.description}
            </p>
          ) : null}

          <PoshCta href={`/breweries/${brewerySlug}`}>View Brewery</PoshCta>
        </div>

        <div className="mt-14 border-t border-white/10 pt-10">
          <PoshSectionTitle>Explore More</PoshSectionTitle>
          <ul className="flex flex-col">
            <li>
              <Link
                href={cityPagePath(city)}
                className="block border-t border-white/10 py-4 text-lg font-bold uppercase tracking-wide transition-opacity hover:opacity-85"
                style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                More events in {city}
              </Link>
            </li>
            {relatedEvents.map((rel) => {
              const relSlug = generateEventSlug(
                rel.title,
                rel.breweries.name,
                rel.breweries.location || null,
                rel.event_date,
                rel.id,
                rel.is_recurring || rel.is_recurring_biweekly || rel.is_recurring_monthly
              )
              return (
                <li key={`${rel.id}-${rel.event_date}`}>
                  <Link
                    href={`/events/${relSlug}`}
                    className="block border-t border-white/10 py-4 transition-opacity hover:opacity-85"
                  >
                    <span
                      className="block text-lg font-bold uppercase tracking-wide"
                      style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                    >
                      {rel.title}
                    </span>
                    <span
                      className="mt-1 block truncate text-sm"
                      style={{
                        color: 'rgba(249, 247, 242, 0.72)',
                        fontFamily: 'var(--font-be-vietnam-pro)',
                      }}
                    >
                      {rel.breweries.name}
                    </span>
                    <span
                      className="mt-1 block text-xs uppercase tracking-[0.14em]"
                      style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                    >
                      {formatEventDate(rel.event_date)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <HoppeningsAppPromo region={regionName} />
      </div>
    </PoshPageShell>
  )
}
