import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { BreweryCard } from '@/components/BreweryCard'
import { CITY_CONFIG, CitySlug, filterBreweriesForCity } from '@/lib/seoCities'
import { getAllBreweriesWithSlugs } from '@/lib/breweries'

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
  const title = `Breweries in ${cityName} | Hoppenings`
  const description = `Browse breweries, taprooms, and craft beer spots in ${cityName}.`

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${city}/breweries` },
    openGraph: { title, description, type: 'website', url: `${BASE_URL}/${city}/breweries` },
  }
}

export default async function CityBreweriesPage({
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/breweries" className="underline text-sm" style={{ color: Colors.primary }}>
          Back to all breweries
        </Link>
        <h1
          className="text-4xl font-bold mt-4 mb-4"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Breweries in {cityName}
        </h1>

        {cityBreweries.length === 0 ? (
          <p style={{ color: Colors.textPrimary }}>
            No breweries currently listed in {cityName}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cityBreweries.map((brewery) => (
              <BreweryCard key={brewery.id} brewery={brewery} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
