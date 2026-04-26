import Link from 'next/link'
import { Colors } from '@/lib/colors'
import { getAllEventsWithSlugs } from '@/lib/events'
import { getAllReleasesWithSlugs } from '@/lib/releases'
import { EventCard } from '@/components/EventCard'
import { BeerReleaseCard } from '@/components/BeerReleaseCard'
import { groupEventsByDate, groupEventsByRegion, isEventInPast } from '@/lib/utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export default async function Home() {
  const [events, releases] = await Promise.all([getAllEventsWithSlugs(), getAllReleasesWithSlugs()])
  const featuredEventsPool = events
    .filter((event) => !isEventInPast(event.event_date))
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 12)
  const featuredEventsByDate = groupEventsByDate(featuredEventsPool)
  const featuredDateEntries = Object.entries(featuredEventsByDate).sort(([, evA], [, evB]) => {
    const minA = evA.map((e) => e.event_date).sort()[0] ?? ''
    const minB = evB.map((e) => e.event_date).sort()[0] ?? ''
    return minA.localeCompare(minB)
  })
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
          <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.textPrimary }}>
            This Week&apos;s Featured Events
          </h2>
          {featuredDateEntries.length === 0 ? (
            <p className="text-sm" style={{ color: Colors.textPrimary }}>
              No upcoming events right now. Check the full{' '}
              <Link href="/events" className="underline font-semibold" style={{ color: Colors.primary }}>
                events calendar
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-8">
              {featuredDateEntries.map(([dateLabel, dateEvents]) => (
                <div key={dateLabel} className="space-y-4">
                  <div
                    className="flex items-center justify-between pb-2 border-b-2"
                    style={{ borderColor: Colors.dividerLight }}
                  >
                    <h3 className="text-xl font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                      {dateLabel}
                    </h3>
                  </div>
                  <div className="space-y-6">
                    {Object.entries(groupEventsByRegion(dateEvents)).map(([region, regionEvents]) => (
                      <div key={`${dateLabel}-${region}`} className="space-y-3">
                        <h4
                          className="text-lg font-bold"
                          style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
                        >
                          {region}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {regionEvents.map((event) => (
                            <EventCard key={event.id} event={event} isFeatured={event.featured} />
                          ))}
                        </div>
                      </div>
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
