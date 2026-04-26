import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { Brewery } from '@/types/supabase'
import { BreweryCard } from '@/components/BreweryCard'
import { Colors } from '@/lib/colors'

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

async function getBreweries(): Promise<Brewery[]> {
  try {
    const { data, error } = await supabase
      .from('breweries')
      .select('*')
      .order('name', { ascending: true })
      .limit(100)

    if (error) {
      console.error('Error fetching breweries:', error)
      return []
    }

    if (!data) return []

    return data as Brewery[]
  } catch (error) {
    console.error('Error fetching breweries:', error)
    return []
  }
}

function regionForBrewery(brewery: Brewery): string {
  const region = brewery.Region?.trim()
  return region || 'Other'
}

function groupBreweriesByRegion(breweries: Brewery[]): Record<string, Brewery[]> {
  const grouped: Record<string, Brewery[]> = {}

  breweries.forEach((brewery) => {
    const region = regionForBrewery(brewery)
    if (!grouped[region]) grouped[region] = []
    grouped[region].push(brewery)
  })

  return grouped
}

export default async function BreweriesPage() {
  const breweries = await getBreweries()

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
          BREWERIES
        </h1>
        
        {breweries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              No breweries found. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupBreweriesByRegion(breweries))
              .sort(([regionA], [regionB]) => {
                if (regionA === 'Other') return 1
                if (regionB === 'Other') return -1
                return regionA.localeCompare(regionB, undefined, { sensitivity: 'base' })
              })
              .map(([region, regionBreweries]) => (
              <section key={region} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2" style={{ borderColor: Colors.dividerLight }}>
                  <h2 className="text-2xl font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                    {region}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {regionBreweries.map((brewery) => (
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

