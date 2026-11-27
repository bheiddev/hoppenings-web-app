import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getEventBySlug, getEventBySlugIncludingExpired, getAllEventsWithSlugs, eventIsRecurring } from '@/lib/events'
import {
  expiredEventRedirectPath,
  isEventSeoIndexable,
  selectEventsForSitemap,
} from '@/lib/contentExpiry'
import { resolveEventSlugRedirect } from '@/lib/slugRedirects'
import { formatEventDate, formatReleaseDate, formatTime12Hour, isEventInPast } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
import { generateBrewerySlug, generateEventSlug, generateReleaseSlug } from '@/lib/slug'
import {
  filterEventsForCity,
  getRegionDisplayName,
  inferCityFromRegionOrLocation,
} from '@/lib/seoCities'
import { getBreweryHappyHourDeals, getBreweryReleases } from '@/lib/breweries'
import {
  formatHappyHourWindow,
  getHappyHourDealsForCalendarDate,
} from '@/lib/happyHourDeals'
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

function cityHubPath(citySlug: string | null): string {
  if (!citySlug) return '/events'
  return `/${citySlug}`
}

function cityEventsPath(citySlug: string | null): string {
  if (!citySlug) return '/events'
  return `/${citySlug}/events`
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

  // Only sitemap-worthy occurrences are indexed; other dates stay crawlable with noindex.
  const allForSeo = await getAllEventsWithSlugs()
  const sitemapSet = selectEventsForSitemap(allForSeo)
  const indexable = isEventSeoIndexable(event, sitemapSet)
  const canonicalPath = eventCanonicalPath(event)

  return {
    title: `${event.title} at ${breweryName} | ${recurrenceText}${timeLabel ? ` ${timeLabel}` : ''} in ${city} | Hoppenings`,
    description: description,
    keywords: `${event.title}, ${breweryName}, ${location}, brewery event, craft beer, ${eventDate}`,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    alternates: {
      canonical: `${BASE_URL}${canonicalPath}`,
    },
    openGraph: {
      title: `${event.title} at ${breweryName} in ${city}`,
      description: description,
      type: 'website',
      url: `${BASE_URL}${canonicalPath}`,
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
      permanentRedirect(expiredEventRedirectPath(expiredOrSeries))
    }
    const tombstone = await resolveEventSlugRedirect(slug)
    if (tombstone) {
      permanentRedirect(tombstone)
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

  const breweryId = brewery?.id || event.brewery_id
  const [happyHourDeals, breweryReleases, allUpcoming] = await Promise.all([
    getBreweryHappyHourDeals(breweryId),
    getBreweryReleases(breweryId),
    getAllEventsWithSlugs(),
  ])
  const eventDayHappyHours = getHappyHourDealsForCalendarDate(happyHourDeals, event.event_date).slice(
    0,
    4
  )
  const featuredReleases = breweryReleases.slice(0, 4)

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
          brewery?.image_url ? 'py-10 lg:pt-14' : 'pb-10 pt-8 lg:pb-14 lg:pt-10'
        }`}
      >
        <BackLink
          fallbackHref={cityHubPath(citySlug)}
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

          {brewery?.image_url ? (
            <Link href={`/breweries/${brewerySlug}`} className="group mb-8 block">
              <div className="relative h-56 w-full overflow-hidden sm:h-72">
                <Image
                  src={brewery.image_url}
                  alt={breweryName}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 896px) 100vw, 896px"
                  unoptimized
                />
              </div>
            </Link>
          ) : null}

          {brewery?.description ? (
            <p
              className="mb-8 max-w-2xl text-base leading-relaxed"
              style={{ color: 'rgba(249, 247, 242, 0.72)', fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              {brewery.description}
            </p>
          ) : null}

          {eventDayHappyHours.length > 0 ? (
            <div className="mb-8">
              <p
                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
              >
                Happy Hours
              </p>
              <ul className="flex max-w-2xl flex-col">
                {eventDayHappyHours.map((deal) => (
                  <li key={deal.id} className="border-t border-white/10 py-3">
                    <p
                      className="text-base font-bold uppercase tracking-wide"
                      style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                    >
                      {deal.title?.trim() || 'Happy Hour'}
                    </p>
                    <p
                      className="mt-1 text-sm"
                      style={{
                        color: 'rgba(249, 247, 242, 0.72)',
                        fontFamily: 'var(--font-be-vietnam-pro)',
                      }}
                    >
                      {formatHappyHourWindow(deal.time_start, deal.time_end)}
                      {deal.description?.trim() ? ` · ${deal.description.trim()}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {featuredReleases.length > 0 ? (
            <div className="mb-8">
              <p
                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
              >
                Beer Releases
              </p>
              <ul className="flex max-w-2xl flex-col">
                {featuredReleases.map((release) => {
                  const releaseSlug = generateReleaseSlug(
                    release.beer_name,
                    release.Type,
                    breweryName,
                    breweryLocation || null,
                    release.id
                  )
                  return (
                    <li key={release.id} className="border-t border-white/10">
                      <Link
                        href={`/releases/${releaseSlug}`}
                        className="block py-3 transition-opacity hover:opacity-85"
                      >
                        <span
                          className="block text-base font-bold uppercase tracking-wide"
                          style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                        >
                          {release.beer_name}
                        </span>
                        <span
                          className="mt-1 block text-sm"
                          style={{
                            color: 'rgba(249, 247, 242, 0.72)',
                            fontFamily: 'var(--font-be-vietnam-pro)',
                          }}
                        >
                          {[release.Type, formatReleaseDate(release.release_date)]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          <PoshCta href={`/breweries/${brewerySlug}`}>View Brewery</PoshCta>
        </div>

        <div className="mt-14 border-t border-white/10 pt-10">
          <PoshSectionTitle>Explore More in {regionName}</PoshSectionTitle>
          <ul className="flex flex-col">
            <li>
              <Link
                href={cityHubPath(citySlug)}
                className="block border-t border-white/10 py-4 text-lg font-bold uppercase tracking-wide transition-opacity hover:opacity-85"
                style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                {regionName} brewery guide
              </Link>
            </li>
            <li>
              <Link
                href={cityEventsPath(citySlug)}
                className="block border-t border-white/10 py-4 text-lg font-bold uppercase tracking-wide transition-opacity hover:opacity-85"
                style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                More events in {regionName}
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
