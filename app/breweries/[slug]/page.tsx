import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBreweryBySlug, getAllBreweriesWithSlugs, getBreweryHours, getBreweryEvents, getBreweryReleases } from '@/lib/breweries'
import { formatEventDate } from '@/lib/utils'
import { formatTime, groupHours, formatDays, getBreweryAmenities } from '@/lib/breweryUtils'
import { Colors } from '@/lib/colors'
import Image from 'next/image'
import Link from 'next/link'
import { EventCard } from '@/components/EventCard'
import { BeerReleaseCard } from '@/components/BeerReleaseCard'

export async function generateStaticParams() {
  const breweries = await getAllBreweriesWithSlugs()
  return breweries.map((brewery) => ({
    slug: brewery.slug,
  }))
}

// Revalidate every hour to pick up new data
export const revalidate = 3600

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const brewery = await getBreweryBySlug(params.slug)
  
  if (!brewery) {
    return {
      title: 'Brewery Not Found | Hoppenings',
    }
  }

  const location = brewery.location || ''
  const description = brewery.description 
    ? `${brewery.description.substring(0, 155)}...` 
    : `${brewery.name}${location ? ` in ${location}` : ''} - Craft brewery with events, beer releases, and more.`

  return {
    title: `${brewery.name}${location ? ` - ${location}` : ''} | Hoppenings`,
    description: description,
    keywords: `${brewery.name}, ${location}, brewery, craft beer, brewery events, beer releases${brewery.is_pet_friendly ? ', pet friendly' : ''}${brewery.has_outdoor_seating ? ', outdoor seating' : ''}`,
    openGraph: {
      title: `${brewery.name}${location ? ` - ${location}` : ''}`,
      description: description,
      type: 'website',
      images: brewery.image_url ? [brewery.image_url] : [],
    },
  }
}

export default async function BreweryDetailPage({ params }: { params: { slug: string } }) {
  const brewery = await getBreweryBySlug(params.slug)

  if (!brewery) {
    notFound()
  }

  // Fetch related data
  const [hours, events, releases] = await Promise.all([
    getBreweryHours(brewery.id),
    getBreweryEvents(brewery.id),
    getBreweryReleases(brewery.id)
  ])

  // Group events by date
  const groupedEvents = events.reduce((groups: { [key: string]: typeof events }, event) => {
    const dateString = formatEventDate(event.event_date)
    if (!groups[dateString]) {
      groups[dateString] = []
    }
    groups[dateString].push(event)
    return groups
  }, {})

  const amenities = getBreweryAmenities(brewery)
  const hoursGroups = hours ? groupHours(hours) : []

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/breweries"
            className="inline-flex items-center gap-2 mb-4 text-sm font-medium hover:underline"
            style={{ color: Colors.textPrimary }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
            </svg>
            Back to Breweries
          </Link>
          <h1 className="text-4xl font-bold mb-2" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
            {brewery.name.toUpperCase()}
          </h1>
        </div>

        {/* Brewery Image */}
        {brewery.image_url && (
          <div className="relative w-full h-80 mb-8 rounded-lg overflow-hidden" style={{ backgroundColor: Colors.backgroundDark }}>
            <Image
              src={brewery.image_url}
              alt={brewery.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Information Section */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="mb-4">
              <div className="flex items-start gap-2 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: Colors.primary, marginTop: '4px' }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                </svg>
                <p className="text-sm" style={{ color: Colors.textPrimary, textDecoration: 'underline', fontFamily: 'var(--font-be-vietnam-pro)' }}>
                  {brewery.address}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: Colors.primary }}>
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                </svg>
                <p className="text-sm" style={{ color: Colors.textPrimary, textDecoration: 'underline', fontFamily: 'var(--font-be-vietnam-pro)' }}>
                  {brewery.phone}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
              HOURS OF OPERATION
            </h3>
            {hoursGroups.length > 0 ? (
              <div className="space-y-2">
                {hoursGroups.map((group, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: Colors.textPrimary, width: '70px', fontFamily: 'var(--font-be-vietnam-pro)' }}>
                      {formatDays(group.days)}
                    </span>
                    <span className="text-sm" style={{ color: Colors.textPrimary, textAlign: 'left', fontFamily: 'var(--font-be-vietnam-pro)' }}>
                      {(group.open == null && group.close == null) 
                        ? 'Closed' 
                        : `${formatTime(group.open)} - ${formatTime(group.close)}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                Hours not available
              </p>
            )}
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: Colors.divider, marginBottom: '2rem' }} />

        {/* Description */}
        {brewery.description && (
          <div className="mb-8">
            <p className="text-sm leading-relaxed" style={{ color: Colors.textPrimary, lineHeight: '1.6', fontFamily: 'var(--font-be-vietnam-pro)' }}>
              {brewery.description}
            </p>
          </div>
        )}

        {/* Amenities */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-6">
            {amenities.map((amenity) => (
              <div key={amenity.key} className="flex items-center gap-2">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  style={{ color: amenity.isAvailable ? Colors.primary : Colors.textSecondary }}
                >
                  {amenity.key === 'is_pet_friendly' && (
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                  )}
                  {amenity.key === 'has_na_beer' && (
                    <path d="M6 3h12v2H6V3zm0 16h12v2H6v-2zm6-13v12l-4-2V8l4-2z" fill="currentColor"/>
                  )}
                  {amenity.key === 'has_outdoor_seating' && (
                    <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" fill="currentColor"/>
                  )}
                  {amenity.key === 'has_food_trucks' && (
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="currentColor"/>
                  )}
                  {amenity.key === 'has_wifi' && (
                    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" fill="currentColor"/>
                  )}
                </svg>
                <span 
                  className="text-sm" 
                  style={{ 
                    color: Colors.textPrimary,
                    opacity: amenity.isAvailable ? 1 : 0.6,
                    fontFamily: 'var(--font-be-vietnam-pro)'
                  }}
                >
                  {amenity.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* New Releases Section */}
        {releases.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
              NEW RELEASES
            </h2>
            <div className="space-y-4">
              {releases.map((release, idx) => (
                <div key={release.id}>
                  <BeerReleaseCard beerRelease={release} />
                  {idx < releases.length - 1 && (
                    <div style={{ height: '1.5px', backgroundColor: Colors.textPrimary, margin: '1rem 0', opacity: 0.5 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Section */}
        {events.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
              UPCOMING EVENTS
            </h2>
            <div className="space-y-8">
              {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <div key={date}>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                    {date}
                  </h3>
                  <div style={{ height: '1px', backgroundColor: Colors.textPrimary, marginBottom: '1rem', opacity: 0.5 }} />
                  <div className="space-y-4">
                    {dateEvents.map((event, idx) => (
                      <div key={event.id}>
                        <EventCard event={event} isFeatured={event.featured} />
                        {idx < dateEvents.length - 1 && (
                          <div style={{ height: '1.5px', backgroundColor: Colors.textPrimary, margin: '1rem 0', opacity: 0.5 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

