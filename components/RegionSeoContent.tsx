/**
 * Server-rendered, always-in-HTML summary of a region hub.
 * The interactive landing only paints one tab at a time; this block gives Google
 * (and no-JS clients) the daily curated listings that make region pages unique.
 */
import Link from 'next/link'

type SeoLink = {
  href: string
  title: string
  meta?: string
}

type RegionSeoContentProps = {
  cityName: string
  citySlug: string
  todayLabel: string
  breweryCount: number
  eventCountToday: number
  releaseCount: number
  happyHourCountToday: number
  todayEvents: SeoLink[]
  releases: SeoLink[]
  breweries: SeoLink[]
}

export function RegionSeoContent({
  cityName,
  citySlug,
  todayLabel,
  breweryCount,
  eventCountToday,
  releaseCount,
  happyHourCountToday,
  todayEvents,
  releases,
  breweries,
}: RegionSeoContentProps) {
  return (
    <section
      aria-label={`${cityName} brewery guide summary`}
      className="border-t border-white/10 px-6 py-10 sm:px-10 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="sr-only">
          {cityName} brewery events, releases, and taprooms — updated daily
        </h2>
        <p className="mb-8 max-w-3xl text-base leading-relaxed text-white/75">
          Hoppenings crawls {cityName} brewery Instagrams every day and filters out
          noise, so this page stays current: {eventCountToday} event
          {eventCountToday === 1 ? '' : 's'} on {todayLabel}, {releaseCount} beer
          release{releaseCount === 1 ? '' : 's'}, {happyHourCountToday} happy hour
          {happyHourCountToday === 1 ? '' : 's'}, and {breweryCount} taproom
          {breweryCount === 1 ? '' : 's'}.
        </p>

        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#F8C701]">
              <Link href={`/${citySlug}/events`} className="hover:opacity-85">
                Events · {todayLabel}
              </Link>
            </h3>
            {todayEvents.length === 0 ? (
              <p className="text-sm text-white/60">No events listed for {todayLabel}.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {todayEvents.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-white/90 hover:opacity-85">
                      <span className="font-semibold">{item.title}</span>
                      {item.meta ? (
                        <span className="mt-0.5 block text-xs text-white/55">{item.meta}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#F8C701]">
              <Link href={`/${citySlug}/releases`} className="hover:opacity-85">
                Beer releases
              </Link>
            </h3>
            {releases.length === 0 ? (
              <p className="text-sm text-white/60">No new releases listed right now.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {releases.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-white/90 hover:opacity-85">
                      <span className="font-semibold">{item.title}</span>
                      {item.meta ? (
                        <span className="mt-0.5 block text-xs text-white/55">{item.meta}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#F8C701]">
              <Link href={`/${citySlug}/breweries`} className="hover:opacity-85">
                Breweries
              </Link>
            </h3>
            <ul className="flex flex-col gap-2">
              {breweries.slice(0, 12).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm font-semibold text-white/90 hover:opacity-85">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
            {breweries.length > 12 ? (
              <p className="mt-3 text-xs text-white/55">
                <Link href={`/${citySlug}/breweries`} className="hover:opacity-85">
                  See all {breweryCount} breweries in {cityName}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
