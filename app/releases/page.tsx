import { Metadata } from 'next'
import Link from 'next/link'
import { getAllReleasesWithSlugs, type BeerReleaseWithSlug } from '@/lib/releases'
import { ReleaseSectionsList } from '@/components/ReleaseSectionsList'
import { Colors } from '@/lib/colors'
import { CITY_CONFIG, CitySlug, filterReleasesForCity } from '@/lib/seoCities'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'New Beer Releases in Colorado | Hoppenings',
  description:
    'Track new and upcoming beer releases from Colorado breweries in Colorado Springs, Fort Collins, Boulder, and Longmont.',
  keywords:
    'new beer releases colorado, colorado springs beer releases, fort collins beer releases, boulder craft beer releases',
  openGraph: {
    title: 'Beer Releases | Hoppenings',
    description: 'Stay updated on the latest beer releases from your favorite breweries.',
    type: 'website',
  },
}

export default async function ReleasesPage() {
  const releases = await getAllReleasesWithSlugs()
  const cityEntries = (Object.entries(CITY_CONFIG) as [CitySlug, (typeof CITY_CONFIG)[CitySlug]][])
    .map(([citySlug, cityConfig]) => ({
      citySlug,
      cityName: cityConfig.name,
      releases: filterReleasesForCity(releases, citySlug),
    }))
    .filter(({ releases: cityReleases }) => cityReleases.length > 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.surfaceMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1
          className="text-3xl font-bold mb-8"
          style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          RELEASES
        </h1>
        <div className="flex flex-wrap gap-3 mb-10">
          {cityEntries.map(({ citySlug, cityName }) => (
            <Link
              key={citySlug}
              href={`/${citySlug}/releases`}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: Colors.primary, color: Colors.onPrimary }}
            >
              {cityName}
            </Link>
          ))}
        </div>

        {releases.length === 0 ? (
          <div className="text-center py-12">
            <p
              className="text-lg"
              style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              No releases found. Check back soon for new beer releases!
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {cityEntries.map(({ citySlug, cityName, releases: cityReleases }) => (
              <div key={citySlug} className="space-y-6">
                <div
                  className="flex items-center justify-between pb-2 border-b-2"
                  style={{ borderColor: Colors.dividerLight }}
                >
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
                  >
                    {cityName}
                  </h2>
                  <Link
                    href={`/${citySlug}/releases`}
                    className="underline text-sm"
                    style={{ color: Colors.primary }}
                  >
                    View all
                  </Link>
                </div>
                <ReleaseSectionsList
                  releases={cityReleases}
                  variant="light"
                  showBrewery
                  mode="cards"
                  getHref={(release) => `/releases/${(release as BeerReleaseWithSlug).slug}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
