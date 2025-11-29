import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { Brewery } from '@/types/supabase'
import { BreweryCard } from '@/components/BreweryCard'
import { Colors } from '@/lib/colors'

export const metadata: Metadata = {
  title: 'Breweries | Hoppenings',
  description: 'Explore local breweries, craft beer makers, and brewery information. Find brewery locations, hours, and featured beers.',
  keywords: 'breweries, craft breweries, local breweries, brewery directory, brewery locations, craft beer',
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

export default async function BreweriesPage() {
  const breweries = await getBreweries()

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {breweries.map((brewery) => (
              <BreweryCard 
                key={brewery.id} 
                brewery={brewery}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

