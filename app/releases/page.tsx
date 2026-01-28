import { Metadata } from 'next'
import { getAllReleasesWithSlugs } from '@/lib/releases'
import { BeerRelease } from '@/types/supabase'
import { BeerReleaseCard } from '@/components/BeerReleaseCard'
import { Colors } from '@/lib/colors'

export const metadata: Metadata = {
  title: 'Beer Releases | Hoppenings',
  description: 'Stay updated on the latest beer releases from your favorite breweries. Discover new craft beers, limited editions, and seasonal releases.',
  keywords: 'beer releases, new beers, craft beer releases, limited edition beers, seasonal beers, brewery releases',
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
  const groupedReleases = groupReleasesByType(releases)

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
          RELEASES
        </h1>
        
        {releases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              No releases found. Check back soon for new beer releases!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedReleases)
              .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
              .map(([beerType, typeReleases]) => (
              <div key={beerType} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2" style={{ borderColor: Colors.dividerLight }}>
                  <h2 className="text-2xl font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                    {beerType}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {typeReleases.map((release) => (
                    <BeerReleaseCard 
                      key={release.id} 
                      beerRelease={release}
                    />
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

