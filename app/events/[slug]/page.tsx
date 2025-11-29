import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventBySlug, getAllEventsWithSlugs } from '@/lib/events'
import { formatEventDate } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

export async function generateStaticParams() {
  const events = await getAllEventsWithSlugs()
  return events.map((event) => ({
    slug: event.slug,
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = await getEventBySlug(params.slug)
  
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

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h1 className="text-4xl font-bold mb-2" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
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
                <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: Colors.pillBackground }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: Colors.info }}>
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
                  </svg>
                  <span className="text-sm font-medium" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                    {event.start_time}
                  </span>
                </div>
              )}

              {event.cost !== null && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: Colors.pillBackground }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: Colors.textPrimary }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.09 1.05.82 1.87 2 2.05v-4.24h-2V8.5h5.02v1.98c1.83.24 3.15 1.4 3.15 3.1 0 1.72-1.39 2.84-3.15 2.95v.56z" fill="currentColor"/>
                  </svg>
                  <span className="text-sm font-medium" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
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

        <div style={{ height: '1.5px', backgroundColor: Colors.divider, marginBottom: '2rem', opacity: 0.5 }} />

        {/* Brewery Section */}
        <div>
          <Link href={`/breweries/${brewery?.id || event.brewery_id}`}>
            <h2 className="text-2xl font-bold mb-4 hover:underline cursor-pointer" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
              {brewery?.name || event.breweries.name}
            </h2>
          </Link>

          {brewery?.image_url && (
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

          {brewery?.description && (
            <p className="text-base leading-relaxed mb-6" style={{ color: Colors.textPrimary, lineHeight: '1.6', fontFamily: 'var(--font-be-vietnam-pro)' }}>
              {brewery.description}
            </p>
          )}

          <Link
            href={`/breweries/${brewery?.id || event.brewery_id}`}
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
      </div>
    </div>
  )
}

