import type { Metadata } from 'next'
import Link from 'next/link'
import { Colors } from '@/lib/colors'
import { getTonightCarouselEvents } from '@/lib/events'
import {
  getBreweryCardContext,
  getBreweryCardContextMap,
  mergeBreweryCardContext,
  type BreweryCardContext,
} from '@/lib/breweryCardContext'
import { matchBreweryEventIcon } from '@/lib/breweryCardStatus'
import { getTonightCarouselCitySortOrder } from '@/lib/seoCities'
import { TodayBreweriesCarousel } from '@/components/TodayBreweriesCarousel'

/** Prefer cards with more live activity: event + release + food truck. */
function tonightActivityScore(context: BreweryCardContext): number {
  let score = 0
  if (context.todayEventTitle) score += 1
  if (context.hasNewRelease) score += 1
  if (context.hasFoodTruckToday) score += 1
  return score
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export const metadata: Metadata = {
  title: 'Colorado Taproom Events, Beer Releases, and Your One Stop Shop For Every Brewery',
  openGraph: {
    title: 'Colorado Taproom Events, Beer Releases, and Your One Stop Shop For Every Brewery',
  },
}

// Today's Hoppenings must use the request date in Mountain Time, not the time of the last static build
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const [todaysEvents, breweryCardContext] = await Promise.all([
    getTonightCarouselEvents(),
    getBreweryCardContextMap(),
  ])
  const carouselItems = todaysEvents
    .map((event) => {
      const baseContext = getBreweryCardContext(breweryCardContext, event.brewery_id)
      const context = mergeBreweryCardContext(baseContext, {
        todayEventIcon: matchBreweryEventIcon(event.title, event.description),
        todayEventTitle: event.title,
      })
      return {
        id: `${event.id}-${event.event_date}`,
        breweryName: event.breweries.name,
        href: `/events/${event.slug}`,
        imageUrl: event.breweries.image_url ?? null,
        latitude: event.breweries.latitude ?? null,
        longitude: event.breweries.longitude ?? null,
        context,
        cityOrder: getTonightCarouselCitySortOrder(event.breweries.Region, event.breweries.location),
        startTime: event.start_time ?? '',
        eventTitle: event.title,
      }
    })
    .sort((a, b) => {
      const activityDiff = tonightActivityScore(b.context) - tonightActivityScore(a.context)
      if (activityDiff !== 0) return activityDiff
      if (a.cityOrder !== b.cityOrder) return a.cityOrder - b.cityOrder
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime)
      return a.breweryName.localeCompare(b.breweryName) || a.eventTitle.localeCompare(b.eventTitle)
    })
    .map(({ cityOrder: _cityOrder, startTime: _startTime, eventTitle: _eventTitle, ...item }) => item)

  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Hoppenings',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/events`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.surfaceMedium }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-4" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
              Colorado Brewery Events, Beer Releases & Taproom Happenings
            </h1>
            <p className="max-w-4xl" style={{ color: Colors.textPrimary }}>
              Hoppenings is a curated source for local craft beer culture across Colorado Springs, Fort
              Collins, and Boulder & Longmont. Discover trivia nights, run clubs, live music, brewery
              releases, and neighborhood taprooms with continuously updated listings.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            {[
              ['Colorado Springs', '/colorado-springs'],
              ['Fort Collins', '/fort-collins'],
              ['Boulder & Longmont', '/boulder-longmont'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 rounded-full text-sm font-semibold text-center whitespace-nowrap"
                style={{ backgroundColor: Colors.primary, color: Colors.onPrimary }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <h2
          className="text-2xl font-bold text-center mb-6"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Brewery Hoppenings Tonight
        </h2>

        <TodayBreweriesCarousel items={carouselItems} />
      </div>
    </div>
  )
}
