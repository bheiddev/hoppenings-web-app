import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventBySlug, getAllEventsWithSlugs } from '@/lib/events'
import { formatEventDate, formatTime12Hour } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
import { generateBrewerySlug } from '@/lib/slug'
import Image from 'next/image'
import Link from 'next/link'

export async function generateStaticParams() {
  const events = await getAllEventsWithSlugs()
  return events.map((event) => ({
    slug: event.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  
  if (!event) {
    return {
      title: 'Event Not Found | Hoppenings',
    }
  }

  const breweryName = event.breweries.name
  const location = event.breweries.location || ''
  const eventDate = formatEventDate(event.event_date)
  const description = event.description 
    ? `${event.description.substring(0, 155)}...` 
    : `Join us for ${event.title} at ${breweryName} on ${eventDate}.`

  return {
    title: `${event.title} at ${breweryName} | Hoppenings`,
    description: description,
    keywords: `${event.title}, ${breweryName}, ${location}, brewery event, craft beer, ${eventDate}`,
    openGraph: {
      title: `${event.title} at ${breweryName}`,
      description: description,
      type: 'website',
    },
  }
}

// Revalidate every hour to pick up new events
export const revalidate = 3600

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  // Fetch full brewery data for the detail page
  let brewery = null
  try {
    const { data } = await supabase
      .from('breweries')
      .select('*')
      .eq('id', event.brewery_id)
      .single()
    brewery = data
  } catch (error) {
    console.error('Error fetching brewery:', error)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/events"
            className="inline-flex items-center gap-2 mb-4 text-sm font-medium hover:underline"
            style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
            </svg>
            Back to Events
          </Link>
          <h1 className="text-4xl font-bold mb-2" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
            {event.title}
          </h1>
          <p className="text-xl" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
            {formatEventDate(event.event_date)}
          </p>
        </div>

        <div style={{ height: '1px', backgroundColor: Colors.textPrimary, marginBottom: '2rem' }} />

        {/* Event Details Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
            {event.description && (
              <div className="flex-1">
                <p className="text-base leading-relaxed" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                  {event.description}
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-3 md:flex-shrink-0">
              {event.start_time && (
                <div className="flex items-center justify-center px-3 py-2 rounded-full" style={{ backgroundColor: Colors.backgroundLight }}>
                  <span className="text-sm font-medium leading-none" style={{ color: Colors.textDark, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                    {formatTime12Hour(event.start_time)}
                  </span>
                </div>
              )}

              {event.cost !== null && (
                <div className="flex items-center justify-center px-3 py-2 rounded-full" style={{ backgroundColor: Colors.backgroundLight }}>
                  <span className="text-sm font-medium leading-none" style={{ color: Colors.textDark, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                    ${event.cost.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {event.is_recurring && event.recurrence_pattern && (
            <div className="mb-4">
              <p className="text-sm" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                {event.recurrence_pattern}
              </p>
            </div>
          )}
        </div>

        {/* Brewery Section */}
        <div>
          {(() => {
            const breweryName = brewery?.name || event.breweries.name
            const breweryLocation = brewery?.location || event.breweries.location
            const breweryId = brewery?.id || event.brewery_id
            const brewerySlug = generateBrewerySlug(breweryName, breweryLocation, breweryId)
            return (
              <Link href={`/breweries/${brewerySlug}`}>
                <h2 className="text-2xl font-bold mb-4 hover:underline cursor-pointer" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                  {breweryName}
                </h2>
              </Link>
            )
          })()}

          {brewery?.image_url && (
            <div className="relative w-full h-80 mb-6 rounded-lg overflow-hidden" style={{ backgroundColor: Colors.backgroundDark }}>
              <Image
                src={brewery.image_url}
                alt={brewery.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {brewery?.description && (
            <p className="text-base leading-relaxed mb-6" style={{ color: Colors.textPrimary, lineHeight: '1.6', fontFamily: 'var(--font-be-vietnam-pro)' }}>
              {brewery.description}
            </p>
          )}

          {(() => {
            const breweryName = brewery?.name || event.breweries.name
            const breweryLocation = brewery?.location || event.breweries.location
            const breweryId = brewery?.id || event.brewery_id
            const brewerySlug = generateBrewerySlug(breweryName, breweryLocation, breweryId)
            return (
              <Link
                href={`/breweries/${brewerySlug}`}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-base transition-colors hover:opacity-90"
                style={{ 
                  backgroundColor: Colors.background,
                  color: Colors.textDark,
                  fontFamily: 'var(--font-fjalla-one)',
                }}
              >
                VIEW BREWERY
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                </svg>
              </Link>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

