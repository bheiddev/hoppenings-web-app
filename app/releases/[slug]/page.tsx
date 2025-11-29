import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getReleaseBySlug, getAllReleasesWithSlugs, getReleaseBreweries } from '@/lib/releases'
import { formatReleaseDate } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

export async function generateStaticParams() {
  const releases = await getAllReleasesWithSlugs()
  return releases.map((release) => ({
    slug: release.slug,
  }))
}

// Revalidate every hour to pick up new releases
export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const release = await getReleaseBySlug(slug)
  
  if (!release) {
    return {
      title: 'Beer Release Not Found | Hoppenings',
    }
  }

  const breweryName = release.breweries.name
  const location = release.breweries.location || ''
  const releaseDate = release.release_date ? formatReleaseDate(release.release_date) : ''
  const description = release.description 
    ? `${release.description.substring(0, 155)}...` 
    : `New ${release.beer_name}${release.Type ? ` ${release.Type}` : ''} release${releaseDate ? ` on ${releaseDate}` : ''} at ${breweryName}.`

  return {
    title: `${release.beer_name}${release.Type ? ` - ${release.Type}` : ''} | Hoppenings`,
    description: description,
    keywords: `${release.beer_name}, ${release.Type || 'beer'}, ${breweryName}, ${location}, beer release, craft beer${releaseDate ? `, ${releaseDate}` : ''}`,
    openGraph: {
      title: `${release.beer_name}${release.Type ? ` - ${release.Type}` : ''} at ${breweryName}`,
      description: description,
      type: 'article',
    },
  }
}

export default async function ReleaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const release = await getReleaseBySlug(slug)

  if (!release) {
    notFound()
  }

  // Fetch all associated breweries (can have up to 3)
  const associatedBreweries = await getReleaseBreweries(release)

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/releases"
            className="inline-flex items-center gap-2 mb-4 text-sm font-medium hover:underline"
            style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
            </svg>
            Back to Releases
          </Link>
          <h1 className="text-4xl font-bold mb-2" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
            {release.beer_name}
          </h1>
          {release.Type && (
            <p className="text-xl mb-2" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              {release.Type}
            </p>
          )}
        </div>

        {/* Release Details Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
            {release.description && (
              <div className="flex-1">
                <p className="text-base leading-relaxed" style={{ color: Colors.textPrimary, lineHeight: '1.6', fontFamily: 'var(--font-be-vietnam-pro)' }}>
                  {release.description}
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-3 md:flex-shrink-0">
              {release.ABV && (
                <div className="flex items-center justify-center px-3 py-2 rounded-full" style={{ backgroundColor: Colors.backgroundLight }}>
                  <span className="text-sm font-medium leading-none" style={{ color: Colors.textDark, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                    ABV: {release.ABV}
                  </span>
                </div>
              )}

              {release.release_date && (
                <div className="flex items-center justify-center px-3 py-2 rounded-full" style={{ backgroundColor: Colors.backgroundLight }}>
                  <span className="text-sm font-medium leading-none" style={{ color: Colors.textDark, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                    {formatReleaseDate(release.release_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Available At Section */}
        {associatedBreweries.length > 0 && (
          <>
            <div style={{ height: '1.5px', backgroundColor: Colors.divider, marginBottom: '2rem', opacity: 0.5 }} />
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
                AVAILABLE AT
              </h2>

              <div className="space-y-8">
                {associatedBreweries.map((brewery) => (
                  <div key={brewery.id} className="mb-8">
                    <Link href={`/breweries/${brewery.id}`}>
                      <h3 className="text-2xl font-bold mb-4 hover:underline cursor-pointer" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                        {brewery.name}
                      </h3>
                    </Link>

                    {brewery.image_url && (
                      <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden" style={{ backgroundColor: Colors.backgroundDark }}>
                        <Image
                          src={brewery.image_url}
                          alt={brewery.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    {brewery.description && (
                    <p className="text-base leading-relaxed mb-6" style={{ color: Colors.textPrimary, lineHeight: '1.6', fontFamily: 'var(--font-be-vietnam-pro)' }}>
                      {brewery.description}
                    </p>
                    )}

                    <Link
                      href={`/breweries/${brewery.id}`}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-base transition-colors hover:opacity-90"
            style={{ 
              backgroundColor: Colors.primary,
              color: Colors.primaryDark,
              fontFamily: 'var(--font-fjalla-one)',
            }}
                    >
                      VIEW BREWERY
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

