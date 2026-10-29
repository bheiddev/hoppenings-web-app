import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { ExploreTeaserRow } from '@/components/ExploreTeaserRow'
import { PoshEyebrow, PoshPageShell } from '@/components/PoshPageShell'
import { getAllBreweriesWithSlugs, getHappyHourDealsForBreweryIds } from '@/lib/breweries'
import { Colors } from '@/lib/colors'
import {
  formatHappyHourWindow,
  getHappyHourDealsForCalendarDate,
} from '@/lib/happyHourDeals'
import { CITY_CONFIG, CitySlug, filterBreweriesForCity } from '@/lib/seoCities'
import {
  formatRelativeEventDateHeading,
  getMountainDateRangeFromToday,
  isRelativeDayHeading,
} from '@/lib/utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'
const HAPPY_HOUR_DAY_HORIZON = 14

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
  const title = `Happy Hours in ${cityName} | Hoppenings`
  const description = `Find brewery happy hours and deals in ${cityName}. Browse by day with Hoppenings.`

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${city}/happy-hours` },
    openGraph: { title, description, type: 'website', url: `${BASE_URL}/${city}/happy-hours` },
  }
}

export default async function CityHappyHoursPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  if (!(city in CITY_CONFIG)) notFound()

  const citySlug = city as CitySlug
  const cityName = CITY_CONFIG[citySlug].name
  const breweries = await getAllBreweriesWithSlugs()
  const cityBreweries = filterBreweriesForCity(breweries, citySlug)
  const breweryById = new Map(cityBreweries.map((brewery) => [brewery.id, brewery]))
  const deals = await getHappyHourDealsForBreweryIds(cityBreweries.map((b) => b.id))

  const daySections = getMountainDateRangeFromToday(HAPPY_HOUR_DAY_HORIZON)
    .map((ymd) => {
      const dayDeals = getHappyHourDealsForCalendarDate(deals, ymd)
        .map((deal) => {
          const brewery = breweryById.get(deal.brewery_id)
          return {
            deal,
            brewery,
            subtitle: brewery?.name ?? '',
            meta: formatHappyHourWindow(deal.time_start, deal.time_end),
          }
        })
        .sort((a, b) => {
          const byBrewery = a.subtitle.localeCompare(b.subtitle)
          if (byBrewery !== 0) return byBrewery
          return a.meta.localeCompare(b.meta)
        })
      return { ymd, dayDeals }
    })
    .filter((section) => section.dayDeals.length > 0)

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
          Happy Hours
        </h1>
        <p
          className="hop-home-fade hop-home-delay-1 mb-12 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'rgba(249, 247, 242, 0.78)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          Daily specials and happy hours at taprooms across {cityName}.
        </p>

        {daySections.length === 0 ? (
          <p
            className="text-base"
            style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            No happy hours listed right now in {cityName}.
          </p>
        ) : (
          <div className="hop-home-fade hop-home-delay-2 space-y-12">
            {daySections.map(({ ymd, dayDeals }) => {
              const dateHeading = formatRelativeEventDateHeading(ymd)
              return (
                <section key={ymd}>
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
                    {dayDeals.map(({ deal, brewery, subtitle, meta }) => (
                      <li key={deal.id}>
                        <ExploreTeaserRow
                          item={{
                            id: deal.id,
                            title: deal.title,
                            subtitle: subtitle || undefined,
                            meta,
                            description: deal.description?.trim() || undefined,
                            href: brewery ? `/breweries/${brewery.slug}` : `/${citySlug}`,
                            imageUrl: brewery
                              ? brewery.image_url || brewery.tap_image || null
                              : null,
                          }}
                        />
                      </li>
                    ))}
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
