import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { PoshEyebrow, PoshPageShell } from '@/components/PoshPageShell'
import { Colors } from '@/lib/colors'
import {
  BREWERY_EVENT_ICON_SRC,
  matchBreweryEventIcon,
} from '@/lib/breweryCardStatus'
import { CITY_CONFIG, CitySlug, filterEventsForCity } from '@/lib/seoCities'
import { getAllEventsWithSlugs } from '@/lib/events'
import {
  formatRelativeEventDateHeading,
  formatTime12Hour,
  groupEventsByDate,
  isEventInPast,
  isRelativeDayHeading,
} from '@/lib/utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'
const ICON_SIZE = 28

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

function EventIcon({ src }: { src: string }) {
  return (
    <span
      className="mt-0.5 block shrink-0"
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: Colors.accent,
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
      aria-hidden
    />
  )
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
          Events
        </h1>
        <p
          className="hop-home-fade hop-home-delay-1 mb-12 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'rgba(249, 247, 242, 0.78)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          Trivia, live music, run clubs, and what&apos;s on at taprooms across {cityName}.
        </p>

        {cityEvents.length === 0 ? (
          <p
            className="text-base"
            style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            No upcoming events found in {cityName}.
          </p>
        ) : (
          <div className="hop-home-fade hop-home-delay-2 space-y-12">
            {dateEntries.map(([dateLabel, dateEvents]) => {
              const dateHeading = formatRelativeEventDateHeading(dateEvents[0].event_date)
              return (
                <section key={dateLabel}>
                  <h2
                    className="mb-2 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
                    style={{
                      color: isRelativeDayHeading(dateHeading) ? Colors.accent : Colors.textOnDark,
                      fontFamily: 'var(--font-fjalla-one)',
                    }}
                  >
                    {dateHeading}
                  </h2>
                  <ul className="flex flex-col">
                    {dateEvents.map((event) => {
                      const icon =
                        BREWERY_EVENT_ICON_SRC[
                          matchBreweryEventIcon(event.title, event.description)
                        ]
                      const meta = [
                        event.breweries?.name,
                        event.start_time ? formatTime12Hour(event.start_time) : null,
                      ]
                        .filter(Boolean)
                        .join(' ')

                      return (
                        <li key={`${event.id}-${event.event_date}`}>
                          <Link
                            href={`/events/${event.slug}`}
                            className="flex items-start gap-3 border-t border-white/10 py-4 transition-opacity hover:opacity-85 sm:gap-4"
                          >
                            <EventIcon src={icon} />
                            <span className="min-w-0 flex-1">
                              <span
                                className="block truncate text-lg font-bold uppercase tracking-wide sm:text-xl"
                                style={{
                                  color: Colors.textOnDark,
                                  fontFamily: 'var(--font-fjalla-one)',
                                }}
                              >
                                {event.title}
                              </span>
                              {meta ? (
                                <span
                                  className="mt-1 block text-sm"
                                  style={{
                                    color: Colors.accent,
                                    fontFamily: 'var(--font-be-vietnam-pro)',
                                  }}
                                >
                                  {meta}
                                </span>
                              ) : null}
                              {event.description?.trim() ? (
                                <span
                                  className="mt-1.5 text-sm leading-snug"
                                  style={{
                                    color: 'rgba(249, 247, 242, 0.62)',
                                    fontFamily: 'var(--font-be-vietnam-pro)',
                                    display: '-webkit-box',
                                    WebkitBoxOrient: 'vertical' as const,
                                    WebkitLineClamp: 2,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {event.description.trim()}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </PoshPageShell>
  )
}
