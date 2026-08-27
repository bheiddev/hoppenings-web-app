import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { PoshEyebrow, PoshPageShell } from '@/components/PoshPageShell'
import { Colors } from '@/lib/colors'
import { getAllBreweriesWithSlugs } from '@/lib/breweries'
import { getBreweryCardContext, getBreweryCardContextMap } from '@/lib/breweryCardContext'
import {
  BREWERY_EVENT_ICON_SRC,
  getBreweryHoursStatusLabel,
  isBreweryOpenIconStatus,
} from '@/lib/breweryCardStatus'
import { CITY_CONFIG, CitySlug, filterBreweriesForCity } from '@/lib/seoCities'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'
const STATUS_ICON_SIZE = 18

function StatusIcon({
  src,
  active,
  muted = false,
}: {
  src: string
  active: boolean
  muted?: boolean
}) {
  const color = muted
    ? 'rgba(249, 247, 242, 0.35)'
    : active
      ? Colors.accent
      : 'rgba(249, 247, 242, 0.45)'

  return (
    <span
      className="shrink-0"
      style={{
        width: STATUS_ICON_SIZE,
        height: STATUS_ICON_SIZE,
        backgroundColor: color,
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
  const title = `Breweries in ${cityName} | Hoppenings`
  const description = `Browse breweries, taprooms, and craft beer spots in ${cityName}.`

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${city}/breweries` },
    openGraph: { title, description, type: 'website', url: `${BASE_URL}/${city}/breweries` },
  }
}

// Signed brewery image URLs need a fresh request.
export const dynamic = 'force-dynamic'

export default async function CityBreweriesPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  if (!(city in CITY_CONFIG)) notFound()

  const citySlug = city as CitySlug
  const cityName = CITY_CONFIG[citySlug].name
  const [breweries, breweryCardContext] = await Promise.all([
    getAllBreweriesWithSlugs(),
    getBreweryCardContextMap(),
  ])
  const cityBreweries = filterBreweriesForCity(breweries, citySlug)

  return (
    <PoshPageShell>
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-24 sm:px-10 lg:px-12 lg:pb-20 lg:pt-28">
        <BackLink
          fallbackHref={`/${citySlug}`}
          style={{ color: 'rgba(249, 247, 242, 0.75)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        />

        <PoshEyebrow>{cityName}</PoshEyebrow>
        <h1
          className="hop-home-fade mb-4 font-bold uppercase leading-[0.95] tracking-wide text-[clamp(2.25rem,8vw,5rem)]"
          style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Breweries
        </h1>
        <p
          className="hop-home-fade hop-home-delay-1 mb-12 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'rgba(249, 247, 242, 0.78)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          Taprooms and craft spots across {cityName} — open status, tonight&apos;s events, and what&apos;s on
          tap.
        </p>

        {cityBreweries.length === 0 ? (
          <p
            className="text-base"
            style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            No breweries currently listed in {cityName}.
          </p>
        ) : (
          <ul className="hop-home-fade hop-home-delay-2 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {cityBreweries.map((brewery) => {
              const context = getBreweryCardContext(breweryCardContext, brewery.id)
              const hoursLabel = getBreweryHoursStatusLabel(context.hoursStatus)
              const isOpen = isBreweryOpenIconStatus(context.hoursStatus)
              const hoursIcon = isOpen ? '/open.svg' : '/closed-sign.svg'
              const hasRelease = Boolean(context.hasNewRelease && context.releaseName)
              const hasEvent = Boolean(context.todayEventTitle)
              const imageSrc = brewery.image_url || brewery.tap_image

              return (
                <li key={brewery.id}>
                  <Link href={`/breweries/${brewery.slug}`} className="group block">
                    <span className="relative mb-4 block aspect-[16/10] w-full overflow-hidden">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <span
                          className="absolute inset-0"
                          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                          aria-hidden
                        />
                      )}
                      <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                    </span>

                    <span
                      className="block text-xl font-bold uppercase tracking-wide transition-colors duration-200 group-hover:text-[#f8c701] sm:text-2xl"
                      style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                    >
                      {brewery.name}
                    </span>

                    {brewery.location ? (
                      <span
                        className="mt-1 block truncate text-sm"
                        style={{
                          color: 'rgba(249, 247, 242, 0.7)',
                          fontFamily: 'var(--font-be-vietnam-pro)',
                        }}
                      >
                        {brewery.location}
                      </span>
                    ) : null}

                    <span className="mt-3 flex flex-col gap-2">
                      <span className="flex items-center gap-2">
                        <StatusIcon src={hoursIcon} active={isOpen} muted={!isOpen} />
                        <span
                          className="text-xs font-semibold uppercase tracking-[0.14em]"
                          style={{
                            color: isOpen ? Colors.accent : 'rgba(249, 247, 242, 0.55)',
                            fontFamily: 'var(--font-be-vietnam-pro)',
                          }}
                        >
                          {hoursLabel}
                        </span>
                      </span>

                      {hasRelease ? (
                        <span className="flex min-w-0 items-center gap-2">
                          <StatusIcon src="/beer.svg" active />
                          <span
                            className="truncate text-xs font-semibold uppercase tracking-[0.14em]"
                            style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                            title={context.releaseName ?? undefined}
                          >
                            {context.releaseName}
                          </span>
                        </span>
                      ) : null}

                      {hasEvent ? (
                        <span className="flex min-w-0 items-center gap-2">
                          <StatusIcon
                            src={BREWERY_EVENT_ICON_SRC[context.todayEventIcon]}
                            active
                          />
                          <span
                            className="truncate text-xs font-semibold uppercase tracking-[0.14em]"
                            style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                            title={context.todayEventTitle ?? undefined}
                          >
                            {context.todayEventTitle}
                          </span>
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </PoshPageShell>
  )
}
