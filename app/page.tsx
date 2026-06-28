import type { Metadata } from 'next'
import Link from 'next/link'
import { Colors } from '@/lib/colors'
import { getTonightCarouselEvents } from '@/lib/events'
import { getBreweryCardContext, getBreweryCardContextMap, mergeBreweryCardContext } from '@/lib/breweryCardContext'
import { matchBreweryEventIcon } from '@/lib/breweryCardStatus'
import { getTonightCarouselCitySortOrder } from '@/lib/seoCities'
import { TodayBreweriesCarousel } from '@/components/TodayBreweriesCarousel'

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
    .sort((a, b) => {
      const cityA = getTonightCarouselCitySortOrder(a.breweries.Region, a.breweries.location)
      const cityB = getTonightCarouselCitySortOrder(b.breweries.Region, b.breweries.location)
      if (cityA !== cityB) return cityA - cityB
      const tA = a.start_time ?? ''
      const tB = b.start_time ?? ''
      if (tA !== tB) return tA.localeCompare(tB)
      return a.breweries.name.localeCompare(b.breweries.name) || a.title.localeCompare(b.title)
    })
    .map((event) => {
      const baseContext = getBreweryCardContext(breweryCardContext, event.brewery_id)
      return {
        id: `${event.id}-${event.event_date}`,
        breweryName: event.breweries.name,
        href: `/events/${event.slug}`,
        imageUrl: event.breweries.image_url ?? null,
        latitude: event.breweries.latitude ?? null,
        longitude: event.breweries.longitude ?? null,
        context: mergeBreweryCardContext(baseContext, {
          todayEventIcon: matchBreweryEventIcon(event.title, event.description),
          todayEventTitle: event.title,
        }),
      }
    })

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
                style={{ backgroundColor: Colors.primary, color: Colors.primaryDark }}
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
          Events Tonight
        </h2>

        <TodayBreweriesCarousel items={carouselItems} />
      </div>
    </div>
  )
}
