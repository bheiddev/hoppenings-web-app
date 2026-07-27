import { Metadata } from 'next'
import Link from 'next/link'
import { getExpandedEventsForListing } from '@/lib/events'
import { groupEventsByDate, groupEventsByRegion, formatRelativeEventDateHeading, isRelativeDayHeading } from '@/lib/utils'
import { EventCard } from '@/components/EventCard'
import { CardCarousel } from '@/components/CardCarousel'
import { Colors } from '@/lib/colors'
import { CITY_CONFIG, CitySlug, filterEventsForCity } from '@/lib/seoCities'

export const metadata: Metadata = {
  title: 'Brewery Events in Colorado Springs, Fort Collins, Boulder | Hoppenings',
  description: 'Find upcoming brewery events in Colorado Springs, Fort Collins, Boulder, and Longmont including trivia nights, run clubs, live music, and more.',
  keywords: 'brewery events colorado, trivia nights colorado springs, fort collins brewery events, boulder brewery events, live music breweries',
  openGraph: {
    title: 'Brewery Events | Hoppenings',
    description: 'Discover the latest brewery events, tastings, and happenings near you.',
    type: 'website',
  },
}

// Force dynamic rendering to ensure dates are calculated at request time, not build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EventsPage() {
  const hasEnvVars = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const events = hasEnvVars ? await getExpandedEventsForListing() : []
  const groupedEvents = groupEventsByDate(events)

  const cityEntries = (Object.entries(CITY_CONFIG) as [CitySlug, (typeof CITY_CONFIG)[CitySlug]][])
    .map(([citySlug, cityConfig]) => ({
      citySlug,
      cityName: cityConfig.name,
      cityEvents: filterEventsForCity(events, citySlug),
    }))
    .filter(({ cityEvents }) => cityEvents.length > 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.surfaceMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
          EVENTS
        </h1>

        {hasEnvVars && cityEntries.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-10">
            {cityEntries.map(({ citySlug, cityName }) => (
              <Link
                key={citySlug}
                href={`/${citySlug}/events`}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ backgroundColor: Colors.primary, color: Colors.onPrimary }}
              >
                {cityName}
              </Link>
            ))}
          </div>
        )}

        {!hasEnvVars ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: Colors.error, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              ⚠️ Configuration Error: Supabase environment variables are missing.
            </p>
            <p className="text-sm" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment settings.
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              No events found. Check back soon for upcoming brewery events!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => {
              const dateHeading = formatRelativeEventDateHeading(dateEvents[0].event_date)
              return (
              <div key={date} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2" style={{ borderColor: Colors.dividerLight }}>
                  <h2
                    className="text-2xl font-bold"
                    style={{
                      color: isRelativeDayHeading(dateHeading) ? Colors.textPrimary : Colors.primary,
                      fontFamily: 'var(--font-fjalla-one)',
                    }}
                  >
                    {dateHeading}
                  </h2>
                </div>
                <div className="space-y-6">
                  {Object.entries(groupEventsByRegion(dateEvents)).map(([region, regionEvents]) => (
                    <section key={`${date}-${region}`} className="space-y-3">
                      <h3
                        className="text-lg font-bold"
                        style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
                      >
                        {region}
                      </h3>
                      <CardCarousel>
                        {regionEvents.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            isFeatured={event.featured}
                          />
                        ))}
                      </CardCarousel>
                    </section>
                  ))}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  )
}

