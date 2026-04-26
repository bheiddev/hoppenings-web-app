import { Metadata } from 'next'
import Link from 'next/link'
import { BreweryCard } from '@/components/BreweryCard'
import { Colors } from '@/lib/colors'
import { getAllBreweriesWithSlugs } from '@/lib/breweries'
import { CITY_CONFIG, CitySlug, filterBreweriesForCity } from '@/lib/seoCities'

export const metadata: Metadata = {
  title: 'Breweries in Colorado Springs, Fort Collins, Boulder & Longmont | Hoppenings',
  description: 'Explore Colorado breweries by city, with brewery details, events, and recent beer releases in Colorado Springs, Fort Collins, Boulder, and Longmont.',
  keywords: 'breweries in colorado springs, fort collins breweries, boulder breweries, longmont breweries, colorado brewery directory',
  openGraph: {
    title: 'Breweries | Hoppenings',
    description: 'Explore local breweries, craft beer makers, and brewery information.',
    type: 'website',
  },
}

export default async function BreweriesPage() {
  const breweries = await getAllBreweriesWithSlugs()
  const cityEntries = (Object.entries(CITY_CONFIG) as [CitySlug, (typeof CITY_CONFIG)[CitySlug]][])
    .map(([citySlug, cityConfig]) => ({
      citySlug,
      cityName: cityConfig.name,
      breweries: filterBreweriesForCity(breweries, citySlug),
    }))
    .filter(({ breweries }) => breweries.length > 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
          BREWERIES
        </h1>
        <div className="flex flex-wrap gap-3 mb-10">
          {cityEntries.map(({ citySlug, cityName }) => (
            <Link
              key={citySlug}
              href={`/${citySlug}/breweries`}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: Colors.primary, color: Colors.primaryDark }}
            >
              {cityName}
            </Link>
          ))}
        </div>
        
        {breweries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              No breweries found. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {cityEntries.map(({ citySlug, cityName, breweries: cityBreweries }) => (
              <section key={citySlug} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2" style={{ borderColor: Colors.dividerLight }}>
                  <h2 className="text-2xl font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                    {cityName}
                  </h2>
                  <Link href={`/${citySlug}/breweries`} className="underline text-sm" style={{ color: Colors.primary }}>
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cityBreweries.map((brewery) => (
                    <BreweryCard
                      key={brewery.id}
                      brewery={brewery}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

