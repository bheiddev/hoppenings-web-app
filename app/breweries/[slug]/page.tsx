import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import {
  getBreweryBySlug,
  getAllBreweriesWithSlugs,
  getBreweryEvents,
  getBreweryReleases,
  getBreweryTonightFood,
} from '@/lib/breweries'
import {
  formatTime12Hour,
  isEventToday,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'
import { getBreweryAmenities } from '@/lib/breweryUtils'
import { matchBreweryEventIcon } from '@/lib/breweryCardStatus'
import { generateEventSlug, generateReleaseSlug } from '@/lib/slug'
import { Colors } from '@/lib/colors'
import Image from 'next/image'
import { EventCard } from '@/components/EventCard'
import { BeerReleaseCard } from '@/components/BeerReleaseCard'
import { CardCarousel } from '@/components/CardCarousel'
import { HoppeningTonight } from '@/components/HoppeningTonight'
import { MugClubCta } from '@/components/breweryDemo/MugClubCta'
import { HoppeningsAppPromo } from '@/components/breweryDemo/HoppeningsAppPromo'
import { HappyHourDeals } from '@/components/breweryDemo/HappyHourDeals'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export async function generateStaticParams() {
  const breweries = await getAllBreweriesWithSlugs()
  return breweries.map((brewery) => ({
    slug: brewery.slug,
  }))
}

// Always render on request so signed brewery image URLs can be refreshed.
// ISR was embedding expired Supabase tokens into the hero for up to an hour.
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

  // Fetch related data
  const [events, releases, tonightFood] = await Promise.all([
    getBreweryEvents(brewery.id),
    getBreweryReleases(brewery.id),
    getBreweryTonightFood(brewery.id, Boolean(brewery.has_food_trucks)),
  ])

  const tonightEvent = events.find((event) => isEventToday(event.event_date)) ?? null

  const latestRelease = releases[0] ?? null
  const hoppeningReleaseBase = latestRelease
    ? {
        name: latestRelease.beer_name,
        detail: [latestRelease.Type, latestRelease.ABV ? `${latestRelease.ABV}% ABV` : null]
          .filter(Boolean)
          .join(' · ') || null,
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
        detail: tonightEvent.start_time
          ? formatTime12Hour(tonightEvent.start_time)
          : null,
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
  // Filter out pet friendly, non-alcoholic, outdoor seating, food, and wifi
  const amenities = allAmenities.filter(amenity => 
    amenity.key !== 'is_pet_friendly' &&
    amenity.key !== 'has_na_beer' &&
    amenity.key !== 'has_outdoor_seating' &&
    amenity.key !== 'has_food_trucks' &&
    amenity.key !== 'has_wifi'
  )
  const city = brewery.location ? brewery.location.split(',')[0].trim() : 'Colorado'
  const isDemoBrewery = brewery.slug === 'mash-mechanix-downtown'
  const hoppeningRelease = isDemoBrewery
    ? {
        name: hoppeningReleaseBase?.name ?? 'View Full Tap Menu',
        detail: hoppeningReleaseBase?.detail ?? 'Draft beer, seltzers & more',
        href: 'https://www.mashmechanix.com/menu',
      }
    : hoppeningReleaseBase
  const foodForTonight =
    isDemoBrewery
      ? {
          ...tonightFood,
          active: true,
          label: tonightFood.label?.toLowerCase().includes('smokehouse')
            ? tonightFood.label
            : 'Mash Smokehouse',
          detail: tonightFood.detail ?? 'Stage Stop Cantina · full-time kitchen',
          href: 'https://www.mashmechanix.com/smokehouse',
        }
      : tonightFood
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
    <div className="min-h-screen" style={{ backgroundColor: Colors.surfaceMedium }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breweryJsonLd) }} />

      {/* Hero */}
      <section
        className="relative w-full min-h-[55vh] flex items-center overflow-hidden"
        style={{ backgroundColor: Colors.surfaceDark }}
      >
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
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.2) 100%)',
          }}
          aria-hidden
        />

        <a
          href="/"
          className="absolute top-5 right-5 sm:top-8 sm:right-8 z-[2] flex flex-col items-end gap-1.5 hover:opacity-90 transition-opacity"
          aria-label="Powered by Hoppenings"
        >
          <span
            className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em]"
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
            className="h-16 sm:h-24 w-auto"
            unoptimized
            priority
          />
        </a>

        <div className="relative z-[2] w-full max-w-6xl mx-auto px-6 sm:px-10 py-10">
          <h1
            className="font-bold uppercase leading-[0.95] tracking-wide text-left text-[clamp(1.75rem,7vw,4rem)]"
            style={{
              color: Colors.textOnDark,
              fontFamily: 'var(--font-fjalla-one)',
              textShadow: '0 2px 8px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.75)',
            }}
          >
            {brewery.name}
          </h1>

          {(brewery.address || brewery.phone) && (
            <div className="mt-4 sm:mt-5 flex flex-col gap-2.5 max-w-xl">
              {brewery.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brewery.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2.5 text-sm sm:text-base hover:opacity-90 transition-opacity"
                  style={{ color: Colors.textOnDark, fontFamily: 'var(--font-be-vietnam-pro)' }}
                >
                  <svg
                    width="16"
                    height="20"
                    viewBox="0 0 16 22"
                    fill="currentColor"
                    className="shrink-0 mt-0.5"
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
                  className="inline-flex items-center gap-2.5 text-sm sm:text-base hover:opacity-90 transition-opacity"
                  style={{ color: Colors.textOnDark, fontFamily: 'var(--font-be-vietnam-pro)' }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="shrink-0"
                    aria-hidden
                  >
                    <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <span>{brewery.phone}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <HoppeningTonight
          release={hoppeningRelease}
          event={hoppeningEvent}
          food={foodForTonight}
        />

        {/* Amenities */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-6">
            {amenities.map((amenity) => (
              <div key={amenity.key} className="flex items-center gap-2">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  style={{ color: amenity.isAvailable ? Colors.primary : Colors.textSecondary }}
                >
                  {amenity.key === 'is_pet_friendly' && (
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                  )}
                  {amenity.key === 'has_na_beer' && (
                    <path d="M6 3h12v2H6V3zm0 16h12v2H6v-2zm6-13v12l-4-2V8l4-2z" fill="currentColor"/>
                  )}
                  {amenity.key === 'has_outdoor_seating' && (
                    <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" fill="currentColor"/>
                  )}
                  {amenity.key === 'has_food_trucks' && (
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="currentColor"/>
                  )}
                  {amenity.key === 'has_wifi' && (
                    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" fill="currentColor"/>
                  )}
                </svg>
                <span 
                  className="text-sm" 
                  style={{ 
                    color: Colors.textPrimary,
                    opacity: amenity.isAvailable ? 1 : 0.6,
                    fontFamily: 'var(--font-be-vietnam-pro)'
                  }}
                >
                  {amenity.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        {chronologicalEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#000000', fontFamily: 'var(--font-fjalla-one)' }}>
              UPCOMING EVENTS
            </h2>
            <CardCarousel>
              {chronologicalEvents.map((event) => (
                <EventCard key={`${event.id}-${event.event_date}`} event={event} isFeatured={event.featured} />
              ))}
            </CardCarousel>
          </div>
        )}

        {/* New Releases */}
        {releases.length > 0 && (
          <div className="mb-8">
            <div style={{ height: '1px', backgroundColor: 'white', marginBottom: '2rem' }} />
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#000000', fontFamily: 'var(--font-fjalla-one)' }}>
              NEW RELEASES
            </h2>
            <CardCarousel>
              {releases.map((release) => (
                <BeerReleaseCard key={release.id} beerRelease={release} />
              ))}
            </CardCarousel>
          </div>
        )}

        {isDemoBrewery && (
          <>
            <HappyHourDeals />
            <MugClubCta />
            <HoppeningsAppPromo />
          </>
        )}
      </div>
    </div>
  )
}

