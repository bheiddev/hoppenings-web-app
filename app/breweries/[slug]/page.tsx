import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import {
  getBreweryBySlug,
  getBreweryById,
  getAllBreweriesWithSlugs,
  getBreweryEvents,
  getBreweryFoodTrucks,
  getBreweryHappyHourDeals,
  getBreweryReleases,
  getBreweryTonightFood,
} from '@/lib/breweries'
import { getSiblingBreweryId } from '@/lib/multiLocationBreweries'
import {
  formatEventDateShort,
  formatReleaseDate,
  formatTime12Hour,
  getMountainTimeNow,
  isEventToday,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'
import { getBreweryAmenities } from '@/lib/breweryUtils'
import { matchBreweryEventIcon, BREWERY_EVENT_ICON_SRC } from '@/lib/breweryCardStatus'
import { generateEventSlug, generateReleaseSlug } from '@/lib/slug'
import { Colors } from '@/lib/colors'
import Image from 'next/image'
import Link from 'next/link'
import { HoppeningTonight } from '@/components/HoppeningTonight'
import { MugClubCta } from '@/components/breweryDemo/MugClubCta'
import { HoppeningsAppPromo } from '@/components/breweryDemo/HoppeningsAppPromo'
import { CollectBreweryTapPromo } from '@/components/breweryDemo/CollectBreweryTapPromo'
import { HappyHourDeals } from '@/components/breweryDemo/HappyHourDeals'
import { FoodTruckSchedule } from '@/components/breweryDemo/FoodTruckSchedule'
import { OtherBreweryLocation } from '@/components/breweryDemo/OtherBreweryLocation'
import { BreweryUpcomingEvents } from '@/components/BreweryUpcomingEvents'
import { PoshPageShell } from '@/components/PoshPageShell'
import { getRegionDisplayName } from '@/lib/seoCities'
import {
  formatHappyHourWindow,
  getTodaysHappyHourDeals,
  getUpcomingHappyHourStatus,
} from '@/lib/happyHourDeals'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export async function generateStaticParams() {
  const breweries = await getAllBreweriesWithSlugs()
  return breweries.map((brewery) => ({
    slug: brewery.slug,
  }))
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brewery = await getBreweryBySlug(slug)

  if (!brewery) {
    return {
      title: 'Brewery Not Found | Hoppenings',
    }
  }

  const location = brewery.location || ''
  const city = location ? location.split(',')[0].trim() : 'Colorado'
  const description = brewery.description
    ? `${brewery.description.substring(0, 155)}...`
    : `${brewery.name}${location ? ` in ${location}` : ''} - Craft brewery with events, beer releases, and more.`
  const canonical = `${BASE_URL}/breweries/${brewery.slug}`

  return {
    title: `${brewery.name} | ${city}, CO | Events & Beer | Hoppenings`,
    description: description,
    keywords: `${brewery.name}, ${location}, brewery, craft beer, brewery events, beer releases`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${brewery.name} | ${city}, CO`,
      description: description,
      type: 'website',
      url: canonical,
      images: brewery.image_url ? [brewery.image_url] : [],
    },
  }
}

export default async function BreweryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brewery = await getBreweryBySlug(slug)

  if (!brewery) {
    notFound()
  }
  if (slug !== brewery.slug) {
    permanentRedirect(`/breweries/${brewery.slug}`)
  }

  const siblingBreweryId = getSiblingBreweryId(brewery.id)

  const [
    events,
    releases,
    tonightFood,
    happyHourDeals,
    foodTrucks,
    siblingBrewery,
    siblingEvents,
    siblingHappyHourDeals,
  ] = await Promise.all([
    getBreweryEvents(brewery.id),
    getBreweryReleases(brewery.id),
    getBreweryTonightFood(brewery.id, Boolean(brewery.has_food_trucks)),
    getBreweryHappyHourDeals(brewery.id),
    getBreweryFoodTrucks(brewery.id),
    siblingBreweryId ? getBreweryById(siblingBreweryId) : Promise.resolve(null),
    siblingBreweryId ? getBreweryEvents(siblingBreweryId) : Promise.resolve([]),
    siblingBreweryId ? getBreweryHappyHourDeals(siblingBreweryId) : Promise.resolve([]),
  ])

  const tonightEvent = events.find((event) => isEventToday(event.event_date)) ?? null

  const mountainNow = getMountainTimeNow()
  const siblingTonightEvent =
    siblingEvents.find((event) => isEventToday(event.event_date)) ?? null
  const siblingEventStatus = siblingTonightEvent
    ? [
        siblingTonightEvent.title,
        siblingTonightEvent.start_time
          ? formatTime12Hour(siblingTonightEvent.start_time)
          : null,
      ]
        .filter(Boolean)
        .join(' ')
    : null
  const siblingEventIconSrc = siblingTonightEvent
    ? BREWERY_EVENT_ICON_SRC[
        matchBreweryEventIcon(siblingTonightEvent.title, siblingTonightEvent.description)
      ]
    : null
  const siblingHappyHourStatus = siblingBrewery
    ? getUpcomingHappyHourStatus(siblingHappyHourDeals, mountainNow)
    : null

  const latestRelease = releases[0] ?? null
  const hoppeningReleaseBase = latestRelease
    ? {
        name: latestRelease.beer_name,
        meta: [latestRelease.Type, latestRelease.ABV ? `${latestRelease.ABV} ABV` : null]
          .filter(Boolean)
          .join(' · ') || null,
        description: latestRelease.description?.trim() || null,
        href: `/releases/${generateReleaseSlug(
          latestRelease.beer_name,
          latestRelease.Type,
          latestRelease.breweries.name,
          latestRelease.breweries.location || null,
          latestRelease.id
        )}`,
      }
    : null

  const hoppeningEvent = tonightEvent
    ? {
        title: tonightEvent.title,
        time: tonightEvent.start_time ? formatTime12Hour(tonightEvent.start_time) : null,
        description: tonightEvent.description?.trim() || null,
        icon: matchBreweryEventIcon(tonightEvent.title, tonightEvent.description),
        href: `/events/${generateEventSlug(
          tonightEvent.title,
          tonightEvent.breweries.name,
          tonightEvent.breweries.location || null,
          tonightEvent.event_date,
          tonightEvent.id,
          Boolean(
            tonightEvent.is_recurring ||
              tonightEvent.is_recurring_biweekly ||
              tonightEvent.is_recurring_monthly
          )
        )}`,
      }
    : null

  const chronologicalEvents = [...events].sort((a, b) => {
    const dateA = normalizeEventDateToMountainTime(a.event_date)
    const dateB = normalizeEventDateToMountainTime(b.event_date)
    if (dateA !== dateB) return dateA.localeCompare(dateB)
    return (a.start_time ?? '').localeCompare(b.start_time ?? '')
  })

  const allAmenities = getBreweryAmenities(brewery)
  const amenities = allAmenities.filter(
    (amenity) =>
      amenity.key !== 'is_pet_friendly' &&
      amenity.key !== 'has_na_beer' &&
      amenity.key !== 'has_outdoor_seating' &&
      amenity.key !== 'has_food_trucks' &&
      amenity.key !== 'has_wifi'
  )
  const city = brewery.location ? brewery.location.split(',')[0].trim() : 'Colorado'
  const regionName = getRegionDisplayName(brewery.Region, brewery.location, city)
  const isDemoBrewery = brewery.slug === 'mash-mechanix-downtown'
  const hoppeningRelease = isDemoBrewery
    ? {
        name: hoppeningReleaseBase?.name ?? 'View Full Tap Menu',
        meta: hoppeningReleaseBase?.meta ?? 'Draft beer, seltzers & more',
        description: hoppeningReleaseBase?.description ?? null,
        href: 'https://www.mashmechanix.com/menu',
      }
    : hoppeningReleaseBase
  const foodForTonight =
    isDemoBrewery && tonightFood.active
      ? {
          ...tonightFood,
          label: tonightFood.label?.toLowerCase().includes('smokehouse')
            ? tonightFood.label
            : 'Mash Smokehouse',
          detail: tonightFood.detail ?? 'Stage Stop Cantina · full-time kitchen',
          href: 'https://www.mashmechanix.com/smokehouse',
        }
      : tonightFood

  const hoppeningDeals = getTodaysHappyHourDeals(happyHourDeals, {
    date: mountainNow.date,
    hours: mountainNow.hours,
  }).map((deal) => ({
    key: deal.id,
    title: deal.title,
    window: formatHappyHourWindow(deal.time_start, deal.time_end),
    detail: deal.description?.trim() || null,
  }))

  const breweryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BarOrPub',
    name: brewery.name,
    description: brewery.description || undefined,
    image: brewery.image_url || undefined,
    telephone: brewery.phone || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: brewery.address || undefined,
      addressLocality: city,
      addressRegion: 'CO',
      addressCountry: 'US',
    },
    geo:
      brewery.latitude != null && brewery.longitude != null
        ? {
            '@type': 'GeoCoordinates',
            latitude: brewery.latitude,
            longitude: brewery.longitude,
          }
        : undefined,
    url: `${BASE_URL}/breweries/${brewery.slug}`,
  }

  return (
    <PoshPageShell accountForNav={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breweryJsonLd) }} />

      <section className="relative flex min-h-[55vh] w-full items-center overflow-hidden">
        {brewery.image_url ? (
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
        ) : null}

        <a
          href="/"
          className="absolute right-5 top-5 z-[2] flex flex-col items-end gap-1.5 transition-opacity hover:opacity-90 sm:right-8 sm:top-8"
          aria-label="Powered by Hoppenings"
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-xs"
            style={{
              color: Colors.textOnDark,
              fontFamily: 'var(--font-be-vietnam-pro)',
              textShadow: '0 1px 4px rgba(0,0,0,0.75)',
            }}
          >
            Powered by
          </span>
          <Image
            src="/HoppeningsLogoWhite.png"
            alt="Hoppenings"
            width={440}
            height={144}
            className="h-12 w-auto sm:h-14"
            unoptimized
            priority
          />
        </a>

        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
          <h1
            className="text-left font-bold uppercase leading-[0.95] tracking-wide text-[clamp(1.75rem,7vw,4rem)]"
            style={{
              color: Colors.textOnDark,
              fontFamily: 'var(--font-fjalla-one)',
              textShadow: '0 2px 8px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.75)',
            }}
          >
            {brewery.name}
          </h1>

          {(brewery.address || brewery.phone) && (
            <div className="mt-4 flex max-w-xl flex-col gap-2.5 sm:mt-5">
              {brewery.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brewery.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2.5 text-sm transition-opacity hover:opacity-90 sm:text-base"
                  style={{
                    color: Colors.textOnDark,
                    fontFamily: 'var(--font-be-vietnam-pro)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                  }}
                >
                  <svg
                    width="16"
                    height="20"
                    viewBox="0 0 16 22"
                    fill="currentColor"
                    className="mt-0.5 shrink-0"
                    aria-hidden
                  >
                    <path d="M7.99989 0.5C3.85835 0.5 0.5 3.98812 0.5 8.2897C0.5 13.4039 5.62899 19.3371 7.40417 21.2379C7.73022 21.5874 8.26978 21.5874 8.59583 21.2379C10.3708 19.3381 15.5 13.4039 15.5 8.2897C15.5 3.98812 12.1414 0.5 7.99989 0.5ZM7.99989 11.7518C6.15931 11.7518 4.66661 10.2014 4.66661 8.2897C4.66661 6.37799 6.15931 4.82761 7.99989 4.82761C9.84048 4.82761 11.3332 6.37799 11.3332 8.2897C11.3332 10.2025 9.84048 11.7518 7.99989 11.7518Z" />
                  </svg>
                  <span>{brewery.address}</span>
                </a>
              )}
              {brewery.phone && (
                <a
                  href={`tel:${brewery.phone.replace(/\D/g, '')}`}
                  className="inline-flex items-center gap-2.5 text-sm transition-opacity hover:opacity-90 sm:text-base"
                  style={{
                    color: Colors.textOnDark,
                    fontFamily: 'var(--font-be-vietnam-pro)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden>
                    <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <span>{brewery.phone}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <HoppeningTonight
        release={hoppeningRelease}
        event={hoppeningEvent}
        food={foodForTonight}
        deals={hoppeningDeals}
      />

      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        {amenities.length > 0 ? (
          <div className="mb-12 flex flex-wrap gap-6">
            {amenities.map((amenity) => (
              <div key={amenity.key} className="flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: amenity.isAvailable ? Colors.accent : 'rgba(249,247,242,0.35)' }}
                >
                  {amenity.key === 'is_pet_friendly' && (
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                      fill="currentColor"
                    />
                  )}
                  {amenity.key === 'has_na_beer' && (
                    <path d="M6 3h12v2H6V3zm0 16h12v2H6v-2zm6-13v12l-4-2V8l4-2z" fill="currentColor" />
                  )}
                  {amenity.key === 'has_outdoor_seating' && (
                    <path
                      d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"
                      fill="currentColor"
                    />
                  )}
                  {amenity.key === 'has_food_trucks' && (
                    <path
                      d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"
                      fill="currentColor"
                    />
                  )}
                  {amenity.key === 'has_wifi' && (
                    <path
                      d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"
                      fill="currentColor"
                    />
                  )}
                </svg>
                <span
                  className="text-sm"
                  style={{
                    color: amenity.isAvailable ? 'rgba(249, 247, 242, 0.85)' : 'rgba(249, 247, 242, 0.4)',
                    fontFamily: 'var(--font-be-vietnam-pro)',
                  }}
                >
                  {amenity.label}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {chronologicalEvents.length > 0 ? (
          <BreweryUpcomingEvents
            events={chronologicalEvents.map((event) => {
              const eventSlug = generateEventSlug(
                event.title,
                event.breweries.name,
                event.breweries.location || null,
                event.event_date,
                event.id,
                Boolean(event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly)
              )
              return {
                key: `${event.id}-${event.event_date}`,
                href: `/events/${eventSlug}`,
                title: event.title,
                description: event.description?.trim() || undefined,
                iconSrc:
                  BREWERY_EVENT_ICON_SRC[
                    matchBreweryEventIcon(event.title, event.description)
                  ],
                meta: [
                  formatEventDateShort(event.event_date),
                  event.start_time ? formatTime12Hour(event.start_time) : null,
                ]
                  .filter(Boolean)
                  .join(' '),
              }
            })}
          />
        ) : null}

        <HappyHourDeals deals={happyHourDeals} />

        {brewery.tap_image ? (
          <CollectBreweryTapPromo tapImageUrl={brewery.tap_image} breweryName={brewery.name} />
        ) : null}

        {releases.length > 0 ? (
          <section className="relative left-1/2 mb-14 w-screen -translate-x-1/2 overflow-hidden py-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(ellipse 85% 65% at 12% 15%, rgba(248, 199, 1, 0.16) 0%, transparent 55%),
                    radial-gradient(ellipse 70% 55% at 92% 88%, rgba(93, 37, 37, 0.08) 0%, transparent 52%),
                    linear-gradient(165deg, ${Colors.surface} 0%, ${Colors.background} 48%, ${Colors.surfaceLight} 100%)
                  `,
                }}
              />
              <div className="hop-posh-noise opacity-60" />
              <div
                className="absolute -right-1/4 bottom-0 h-[45%] w-[55vw] rounded-full opacity-40 blur-3xl"
                style={{
                  background: `radial-gradient(circle, ${Colors.primary}14 0%, transparent 70%)`,
                }}
              />
            </div>

            <div className="relative z-[1] mx-auto max-w-4xl px-6 sm:px-10 lg:px-12">
              <h2
                className="mb-6 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
                style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
              >
                New Beer Releases
              </h2>
              <ul className="flex flex-col">
                {releases.map((release) => {
                  const releaseSlug = generateReleaseSlug(
                    release.beer_name,
                    release.Type,
                    release.breweries.name,
                    release.breweries.location || null,
                    release.id
                  )
                  return (
                    <li key={release.id}>
                      <Link
                        href={`/releases/${releaseSlug}`}
                        className="block border-t py-4 transition-opacity hover:opacity-85"
                        style={{ borderColor: Colors.border }}
                      >
                        <span
                          className="block text-lg font-bold uppercase tracking-wide sm:text-xl"
                          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
                        >
                          {release.beer_name}
                        </span>
                        {release.description ? (
                          <span
                            className="mt-1.5 block text-sm leading-snug line-clamp-2"
                            style={{
                              color: Colors.textSecondary,
                              fontFamily: 'var(--font-be-vietnam-pro)',
                            }}
                          >
                            {release.description}
                          </span>
                        ) : null}
                        <span
                          className="mt-1.5 block text-xs uppercase tracking-[0.14em]"
                          style={{ color: Colors.primary, fontFamily: 'var(--font-be-vietnam-pro)' }}
                        >
                          {[release.Type, formatReleaseDate(release.release_date)].filter(Boolean).join(' · ')}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        ) : null}

        <FoodTruckSchedule trucks={foodTrucks} />

        {isDemoBrewery ? <MugClubCta /> : null}

        {siblingBrewery ? (
          <OtherBreweryLocation
            name={siblingBrewery.name}
            locationLabel={siblingBrewery.location}
            address={siblingBrewery.address}
            href={`/breweries/${siblingBrewery.slug}`}
            imageUrl={siblingBrewery.image_url}
            eventStatus={siblingEventStatus}
            eventIconSrc={siblingEventIconSrc}
            happyHourStatus={siblingHappyHourStatus}
          />
        ) : null}

        <HoppeningsAppPromo region={regionName} />
      </div>
    </PoshPageShell>
  )
}
