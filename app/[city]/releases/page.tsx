import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { PoshEyebrow, PoshPageShell } from '@/components/PoshPageShell'
import { ReleaseSectionsList } from '@/components/ReleaseSectionsList'
import { Colors } from '@/lib/colors'
import { CITY_CONFIG, CitySlug, filterReleasesForCity } from '@/lib/seoCities'
import { getAllReleasesWithSlugs, type BeerReleaseWithSlug } from '@/lib/releases'
import { splitReleasesForDisplay } from '@/lib/releaseSections'

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
  const title = `Beer Releases in ${cityName} | Hoppenings`
  const description = `Track recent and upcoming beer releases from breweries in ${cityName}.`

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${city}/releases` },
    openGraph: { title, description, type: 'website', url: `${BASE_URL}/${city}/releases` },
  }
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
  const cityReleases = filterReleasesForCity(releases, citySlug)
  const leadSection = splitReleasesForDisplay(cityReleases)[0]
  const pageTitle = leadSection?.id === 'just-dropped' ? 'Just Dropped' : 'Releases'

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
          {pageTitle}
        </h1>
        <p
          className="hop-home-fade hop-home-delay-1 mb-12 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'rgba(249, 247, 242, 0.78)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          Fresh pours, upcoming cans, and recent drops from breweries across {cityName}.
        </p>

        {cityReleases.length === 0 ? (
          <p
            className="text-base"
            style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            No releases found in {cityName} right now.
          </p>
        ) : (
          <div className="hop-home-fade hop-home-delay-2">
            <ReleaseSectionsList
              releases={cityReleases}
              variant="posh"
              showBrewery
              getHref={(release) => `/releases/${(release as BeerReleaseWithSlug).slug}`}
            />
          </div>
        )}
      </div>
    </PoshPageShell>
  )
}
