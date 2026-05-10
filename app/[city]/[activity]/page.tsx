import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { EventCard } from '@/components/EventCard'
import { getAllEventsWithSlugs } from '@/lib/events'
import {
  ACTIVITY_CONFIG,
  ActivitySlug,
  CITY_CONFIG,
  CitySlug,
  filterEventsForActivity,
  filterEventsForCity,
} from '@/lib/seoCities'
import { bucketEventsByMountainWeekDays, formatMountainWeekDayHeading } from '@/lib/utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export async function generateStaticParams() {
  return Object.keys(CITY_CONFIG).flatMap((city) =>
    Object.keys(ACTIVITY_CONFIG).map((activity) => ({ city, activity }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; activity: string }>
}): Promise<Metadata> {
  const { city, activity } = await params
  if (!(city in CITY_CONFIG) || !(activity in ACTIVITY_CONFIG)) {
    return { title: 'Not Found | Hoppenings' }
  }
  const cityName = CITY_CONFIG[city as CitySlug].name
  const activityLabel = ACTIVITY_CONFIG[activity as ActivitySlug].label
  const title = `${activityLabel} in ${cityName} | Hoppenings`
  const description = `Find ${activityLabel.toLowerCase()} at breweries in ${cityName}. Updated recurring listings and details.`
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${city}/${activity}` },
    openGraph: { title, description, type: 'website', url: `${BASE_URL}/${city}/${activity}` },
  }
}

export default async function CityActivityPage({
  params,
}: {
  params: Promise<{ city: string; activity: string }>
}) {
  const { city, activity } = await params
  if (!(city in CITY_CONFIG) || !(activity in ACTIVITY_CONFIG)) notFound()

  const citySlug = city as CitySlug
  const activitySlug = activity as ActivitySlug
  const cityName = CITY_CONFIG[citySlug].name
  const activityLabel = ACTIVITY_CONFIG[activitySlug].label

  const events = await getAllEventsWithSlugs()
  const cityEvents = filterEventsForCity(events, citySlug)
  const filtered = filterEventsForActivity(cityEvents, activitySlug)
  const { weekDates, eventsInWeek: activityEventsThisWeek, eventsByMountainDay } =
    bucketEventsByMountainWeekDays(filtered, 7)

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href={`/${citySlug}`} className="underline text-sm" style={{ color: Colors.primary }}>
          Back to {cityName}
        </Link>
        <h1
          className="text-4xl font-bold mt-4 mb-4"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {activityLabel} in {cityName}
        </h1>
        <p className="mb-8 max-w-3xl" style={{ color: Colors.textPrimary }}>
          Explore recurring {activityLabel.toLowerCase()} at breweries around {cityName}. Listings are
          continuously updated so you can plan weeknights and weekend outings quickly.
        </p>

        {filtered.length === 0 ? (
          <p style={{ color: Colors.textPrimary }}>No events currently matched this category.</p>
        ) : activityEventsThisWeek.length === 0 ? (
          <p className="text-sm max-w-2xl" style={{ color: Colors.textPrimary }}>
            No matching {activityLabel.toLowerCase()} in {cityName} over the next seven days. Check the{' '}
            <Link href={`/${citySlug}`} className="underline font-semibold" style={{ color: Colors.primary }}>
              {cityName} hub
            </Link>{' '}
            or full{' '}
            <Link href="/events" className="underline font-semibold" style={{ color: Colors.primary }}>
              events calendar
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-8">
            {weekDates.map((ymd, index) => {
              const dayEvents = eventsByMountainDay.get(ymd) ?? []
              return (
                <div key={ymd} className="space-y-4">
                  <div
                    className="flex items-center justify-between pb-2 border-b-2"
                    style={{ borderColor: Colors.dividerLight }}
                  >
                    <h2
                      className="text-xl font-bold"
                      style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
                    >
                      {formatMountainWeekDayHeading(ymd, index)}
                    </h2>
                  </div>
                  {dayEvents.length === 0 ? (
                    <p className="text-sm" style={{ color: Colors.textPrimary }}>
                      No events scheduled.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {dayEvents.map((event) => (
                        <EventCard
                          key={`${event.id}-${event.event_date}`}
                          event={event}
                          isFeatured={event.featured}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
