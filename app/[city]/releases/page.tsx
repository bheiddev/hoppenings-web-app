import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { BeerReleaseCard } from '@/components/BeerReleaseCard'
import { CITY_CONFIG, CitySlug, filterReleasesForCity } from '@/lib/seoCities'
import { getAllReleasesWithSlugs } from '@/lib/releases'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/releases" className="underline text-sm" style={{ color: Colors.primary }}>
          Back to all releases
        </Link>
        <h1
          className="text-4xl font-bold mt-4 mb-4"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Beer Releases in {cityName}
        </h1>

        {cityReleases.length === 0 ? (
          <p style={{ color: Colors.textPrimary }}>
            No recent releases found in {cityName}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cityReleases.map((release) => (
              <BeerReleaseCard key={release.id} beerRelease={release} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
