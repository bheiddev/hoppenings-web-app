import type { Metadata } from 'next'
import Link from 'next/link'
import { Colors } from '@/lib/colors'
import { getAllEventsWithSlugs } from '@/lib/events'
import { getAllReleasesWithSlugs } from '@/lib/releases'
import { EventCard } from '@/components/EventCard'
import { BeerReleaseCard } from '@/components/BeerReleaseCard'
import {
  formatEventDate,
  getTodayMountainDateString,
  groupEventsByRegion,
  isEventToday,
} from '@/lib/utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export const metadata: Metadata = {
  title: 'Colorado Taproom Events, Beer Releases, and Your One Stop Shop For Every Brewery',
  openGraph: {
    title: 'Colorado Taproom Events, Beer Releases, and Your One Stop Shop For Every Brewery',
  },
}

export default async function Home() {
  const [events, releases] = await Promise.all([getAllEventsWithSlugs(), getAllReleasesWithSlugs()])
  const todayLabel = formatEventDate(getTodayMountainDateString())
  const todaysEvents = events
    .filter((event) => isEventToday(event.event_date))
    .sort((a, b) => {
      const tA = a.start_time ?? ''
      const tB = b.start_time ?? ''
      if (tA !== tB) return tA.localeCompare(tB)
      return a.title.localeCompare(b.title)
    })
  const todaysEventsByRegion = groupEventsByRegion(todaysEvents)
  const latestReleases = releases.slice(0, 6)
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
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl font-bold mb-4" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
          Colorado Brewery Events, Beer Releases & Taproom Happenings
        </h1>
        <p className="max-w-4xl mb-8" style={{ color: Colors.textPrimary }}>
          Hoppenings is a curated source for local craft beer culture across Colorado Springs, Fort
          Collins, and Boulder & Longmont. Discover trivia nights, run clubs, live music, brewery
          releases, and neighborhood taprooms with continuously updated listings.
        </p>
        <div className="flex flex-wrap gap-3 mb-10">
          {[
            ['Colorado Springs', '/colorado-springs'],
            ['Fort Collins', '/fort-collins'],
            ['Boulder & Longmont', '/boulder-longmont'],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: Colors.primary, color: Colors.primaryDark }}
            >
              {label}
            </Link>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2" style={{ color: Colors.textPrimary }}>
            Today&apos;s Hoppenings
          </h2>
          <p className="text-base mb-4" style={{ color: Colors.textPrimary }}>
            {todayLabel}
          </p>
          {todaysEvents.length === 0 ? (
            <p className="text-sm" style={{ color: Colors.textPrimary }}>
              No events listed for today. Check the full{' '}
              <Link href="/events" className="underline font-semibold" style={{ color: Colors.primary }}>
                events calendar
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(todaysEventsByRegion).map(([region, regionEvents]) => (
                <div key={region} className="space-y-3">
                  <h3
                    className="text-lg font-bold"
                    style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
                  >
                    {region}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {regionEvents.map((event) => (
                      <EventCard key={`${event.id}-${event.event_date}`} event={event} isFeatured={event.featured} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.textPrimary }}>
            Latest Beer Releases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {latestReleases.map((release) => (
              <BeerReleaseCard key={release.id} beerRelease={release} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
