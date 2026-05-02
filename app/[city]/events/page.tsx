import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { EventCard } from '@/components/EventCard'
import { CITY_CONFIG, CitySlug, filterEventsForCity } from '@/lib/seoCities'
import { getAllEventsWithSlugs } from '@/lib/events'
import { groupEventsByDate, groupEventsByRegion, isEventInPast } from '@/lib/utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateStaticParams() {
  return Object.keys(CITY_CONFIG).map((city) => ({ city }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city } = await params
  if (!(city in CITY_CONFIG)) return { title: 'Not Found | Hoppenings' }

  const cityName = CITY_CONFIG[city as CitySlug].name
  const title = `Brewery Events in ${cityName} | Hoppenings`
  const description = `Find upcoming brewery events, trivia nights, run clubs, and live music in ${cityName}.`

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${city}/events` },
    openGraph: { title, description, type: 'website', url: `${BASE_URL}/${city}/events` },
  }
}

export default async function CityEventsPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  if (!(city in CITY_CONFIG)) notFound()

  const citySlug = city as CitySlug
  const cityName = CITY_CONFIG[citySlug].name
  const all = await getAllEventsWithSlugs()
  const cityEvents = filterEventsForCity(all, citySlug)
    .filter((e) => !isEventInPast(e.event_date))
    .sort((a, b) => a.event_date.localeCompare(b.event_date))

  const groupedByDate = groupEventsByDate(cityEvents)
  const dateEntries = Object.entries(groupedByDate).sort(([, evA], [, evB]) => {
    const minA = evA.map((e) => e.event_date).sort()[0] ?? ''
    const minB = evB.map((e) => e.event_date).sort()[0] ?? ''
    return minA.localeCompare(minB)
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/events" className="underline text-sm" style={{ color: Colors.primary }}>
          Back to all events
        </Link>
        <h1
          className="text-4xl font-bold mt-4 mb-4"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Brewery Events in {cityName}
        </h1>

        {cityEvents.length === 0 ? (
          <p style={{ color: Colors.textPrimary }}>No upcoming events found in {cityName}.</p>
        ) : (
          <div className="space-y-8">
            {dateEntries.map(([dateLabel, dateEvents]) => (
              <div key={dateLabel} className="space-y-4">
                <div
                  className="flex items-center justify-between pb-2 border-b-2"
                  style={{ borderColor: Colors.dividerLight }}
                >
                  <h2 className="text-2xl font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                    {dateLabel}
                  </h2>
                </div>
                <div className="space-y-6">
                  {Object.entries(groupEventsByRegion(dateEvents)).map(([region, regionEvents]) => (
                    <section key={`${dateLabel}-${region}`} className="space-y-3">
                      <h3
                        className="text-lg font-bold"
                        style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
                      >
                        {region}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {regionEvents.map((event) => (
                          <EventCard
                            key={`${event.id}-${event.event_date}`}
                            event={event}
                            isFeatured={event.featured}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
