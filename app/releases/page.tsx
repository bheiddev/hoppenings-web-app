import { Metadata } from 'next'
import Link from 'next/link'
import { getAllReleasesWithSlugs } from '@/lib/releases'
import { BeerRelease } from '@/types/supabase'
import { BeerReleaseCard } from '@/components/BeerReleaseCard'
import { Colors } from '@/lib/colors'
import { CITY_CONFIG, CitySlug, filterReleasesForCity } from '@/lib/seoCities'

export const metadata: Metadata = {
  title: 'New Beer Releases in Colorado | Hoppenings',
  description: 'Track new beer releases from Colorado breweries in Colorado Springs, Fort Collins, Boulder, and Longmont.',
  keywords: 'new beer releases colorado, colorado springs beer releases, fort collins beer releases, boulder craft beer releases',
  openGraph: {
    title: 'Beer Releases | Hoppenings',
    description: 'Stay updated on the latest beer releases from your favorite breweries.',
    type: 'website',
  },
}

function groupReleasesByType(releases: BeerRelease[]): Record<string, BeerRelease[]> {
  const grouped: Record<string, BeerRelease[]> = {}
  
  releases.forEach((release) => {
    const type = release.Type || 'Other'
    if (!grouped[type]) {
      grouped[type] = []
    }
    grouped[type].push(release)
  })
  
  return grouped
}

export default async function ReleasesPage() {
  const releases = await getAllReleasesWithSlugs()
  const cityEntries = (Object.entries(CITY_CONFIG) as [CitySlug, (typeof CITY_CONFIG)[CitySlug]][])
    .map(([citySlug, cityConfig]) => ({
      citySlug,
      cityName: cityConfig.name,
      releases: filterReleasesForCity(releases, citySlug),
    }))
    .filter(({ releases }) => releases.length > 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
          RELEASES
        </h1>
        <div className="flex flex-wrap gap-3 mb-10">
          {cityEntries.map(({ citySlug, cityName }) => (
            <Link
              key={citySlug}
              href={`/${citySlug}/releases`}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: Colors.primary, color: Colors.primaryDark }}
            >
              {cityName}
            </Link>
          ))}
        </div>
        
        {releases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              No releases found. Check back soon for new beer releases!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {cityEntries.map(({ citySlug, cityName, releases: cityReleases }) => (
              <div key={citySlug} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2" style={{ borderColor: Colors.dividerLight }}>
                  <h2 className="text-2xl font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                    {cityName}
                  </h2>
                  <Link href={`/${citySlug}/releases`} className="underline text-sm" style={{ color: Colors.primary }}>
                    View all
                  </Link>
                </div>
                <div className="space-y-6">
                  {Object.entries(groupReleasesByType(cityReleases))
                    .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
                    .map(([beerType, typeReleases]) => (
                      <section key={`${citySlug}-${beerType}`} className="space-y-3">
                        <h3
                          className="text-lg font-bold"
                          style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
                        >
                          {beerType}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {typeReleases.map((release) => (
                            <BeerReleaseCard
                              key={release.id}
                              beerRelease={release}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

