import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { PoshEyebrow, PoshPageShell } from '@/components/PoshPageShell'
import { Colors } from '@/lib/colors'
import { CITY_CONFIG, CitySlug, filterReleasesForCity } from '@/lib/seoCities'
import { getAllReleasesWithSlugs } from '@/lib/releases'
import { formatReleaseDate } from '@/lib/utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'
const ICON_SIZE = 28

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
  const title = `Beer Releases in ${cityName} | Hoppenings`
  const description = `Track recent beer releases from breweries in ${cityName}.`

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${city}/releases` },
    openGraph: { title, description, type: 'website', url: `${BASE_URL}/${city}/releases` },
  }
}

function BeerIcon() {
  return (
    <span
      className="mt-0.5 block shrink-0"
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: Colors.accent,
        WebkitMaskImage: 'url(/beer.svg)',
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: 'url(/beer.svg)',
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
      aria-hidden
    />
  )
}

export default async function CityReleasesPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  if (!(city in CITY_CONFIG)) notFound()

  const citySlug = city as CitySlug
  const cityName = CITY_CONFIG[citySlug].name
  const releases = await getAllReleasesWithSlugs()
  const cityReleases = filterReleasesForCity(releases, citySlug).sort((a, b) =>
    (b.release_date || '').localeCompare(a.release_date || '')
  )

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
          Releases
        </h1>
        <p
          className="hop-home-fade hop-home-delay-1 mb-12 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'rgba(249, 247, 242, 0.78)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          Fresh pours and new cans from breweries across {cityName}.
        </p>

        {cityReleases.length === 0 ? (
          <p
            className="text-base"
            style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            No recent releases found in {cityName}.
          </p>
        ) : (
          <ul className="hop-home-fade hop-home-delay-2 flex flex-col">
            {cityReleases.map((release) => {
              const meta = [
                release.breweries?.name,
                release.Type,
                formatReleaseDate(release.release_date),
              ]
                .filter(Boolean)
                .join(' · ')

              return (
                <li key={release.id}>
                  <Link
                    href={`/releases/${release.slug}`}
                    className="flex items-start gap-3 border-t border-white/10 py-4 transition-opacity hover:opacity-85 sm:gap-4"
                  >
                    <BeerIcon />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-lg font-bold uppercase tracking-wide sm:text-xl"
                        style={{
                          color: Colors.textOnDark,
                          fontFamily: 'var(--font-fjalla-one)',
                        }}
                      >
                        {release.beer_name}
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
                      {release.description?.trim() ? (
                        <span
                          className="mt-1.5 block text-sm leading-snug line-clamp-2"
                          style={{
                            color: 'rgba(249, 247, 242, 0.62)',
                            fontFamily: 'var(--font-be-vietnam-pro)',
                          }}
                        >
                          {release.description.trim()}
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
