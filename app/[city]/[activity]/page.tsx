import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { ExploreTeaserRow } from '@/components/ExploreTeaserRow'
import { PoshEyebrow, PoshPageShell } from '@/components/PoshPageShell'
import { Colors } from '@/lib/colors'
import { getAllEventsWithSlugs } from '@/lib/events'
import {
  ACTIVITY_CONFIG,
  ActivitySlug,
  CITY_CONFIG,
  CitySlug,
  filterEventsForActivity,
  filterEventsForCity,
} from '@/lib/seoCities'
import {
  bucketEventsByMountainWeekDays,
  formatMountainWeekDayHeading,
  formatTime12Hour,
  isRelativeDayHeading,
} from '@/lib/utils'

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

// Weekly columns label "Today" from Mountain calendar date at request time, not build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    <PoshPageShell>
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-24 sm:px-10 lg:px-12 lg:pb-20 lg:pt-28">
        <div className="mb-3 flex items-center gap-2 [&_p]:mb-0">
          <BackLink
            fallbackHref={`/${citySlug}`}
            showLabel={false}
            iconSize={18}
            className="inline-flex shrink-0 items-center"
            style={{ color: Colors.accent }}
          />
          <PoshEyebrow>{cityName}</PoshEyebrow>
        </div>
        <h1
          className="hop-home-fade mb-4 font-bold uppercase leading-[0.95] tracking-wide text-[clamp(2.25rem,8vw,5rem)]"
          style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {activityLabel}
        </h1>
        <p
          className="hop-home-fade hop-home-delay-1 mb-12 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'rgba(249, 247, 242, 0.78)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          Upcoming {activityLabel.toLowerCase()} at taprooms across {cityName}.
        </p>

        {filtered.length === 0 ? (
          <p
            className="text-base"
            style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            No events currently matched this category.
          </p>
        ) : activityEventsThisWeek.length === 0 ? (
          <p
            className="text-base max-w-2xl"
            style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            No matching {activityLabel.toLowerCase()} in {cityName} over the next seven days. Check the{' '}
            <Link href={`/${citySlug}`} className="underline" style={{ color: Colors.accent }}>
              {cityName} hub
            </Link>{' '}
            or full{' '}
            <Link href={`/${citySlug}/events`} className="underline" style={{ color: Colors.accent }}>
              events calendar
            </Link>
            .
          </p>
        ) : (
          <div className="hop-home-fade hop-home-delay-2 space-y-12">
            {weekDates.map((ymd, index) => {
              const dayEvents = eventsByMountainDay.get(ymd) ?? []
              const dayHeading = formatMountainWeekDayHeading(ymd, index)
              return (
                <section key={ymd}>
                  <h2
                    className="mb-2 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
                    style={{
                      color: isRelativeDayHeading(dayHeading) ? Colors.accent : Colors.textOnDark,
                      fontFamily: 'var(--font-fjalla-one)',
                    }}
                  >
                    {dayHeading}
                  </h2>
                  {dayEvents.length === 0 ? (
                    <p
                      className="border-t border-white/10 py-4 text-sm"
                      style={{
                        color: 'rgba(249, 247, 242, 0.55)',
                        fontFamily: 'var(--font-be-vietnam-pro)',
                      }}
                    >
                      No events scheduled.
                    </p>
                  ) : (
                    <ul className="flex flex-col">
                      {dayEvents.map((event) => (
                        <li key={`${event.id}-${event.event_date}`}>
                          <ExploreTeaserRow
                            item={{
                              id: `${event.id}-${event.event_date}`,
                              title: event.title,
                              subtitle: event.breweries?.name,
                              meta: event.start_time
                                ? formatTime12Hour(event.start_time) || undefined
                                : undefined,
                              description: event.description?.trim() || undefined,
                              href: `/events/${event.slug}`,
                              imageUrl: event.breweries?.image_url ?? null,
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </PoshPageShell>
  )
}
