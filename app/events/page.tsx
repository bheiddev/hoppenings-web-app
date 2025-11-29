import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types/supabase'
import { expandRecurringEvents, groupEventsByDate, formatEventDate } from '@/lib/utils'
import { EventCard } from '@/components/EventCard'
import { Colors } from '@/lib/colors'

export const metadata: Metadata = {
  title: 'Brewery Events | Hoppenings',
  description: 'Discover the latest brewery events, tastings, and happenings near you. Find craft beer events, brewery tours, and beer festivals.',
  keywords: 'brewery events, beer events, craft beer, brewery tours, beer festivals, beer tastings',
  openGraph: {
    title: 'Brewery Events | Hoppenings',
    description: 'Discover the latest brewery events, tastings, and happenings near you.',
    type: 'website',
  },
}

async function getEvents(): Promise<Event[]> {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Supabase environment variables are missing!')
      return []
    }

    const { data, error } = await supabase
      .from('events_base')
      .select(`
        id,
        created_at,
        title,
        brewery_id,
        event_date,
        start_time,
        end_time,
        cost,
        is_recurring,
        is_recurring_biweekly,
        is_recurring_monthly,
        description,
        featured,
        breweries (
          id,
          name,
          location
        )
      `)
      .order('event_date', { ascending: true })

    if (error) {
      console.error('❌ Error fetching events:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return []
    }

    if (!data) {
      console.warn('⚠️ No data returned from Supabase')
      return []
    }

    console.log(`✅ Fetched ${data.length} events from database`)

    // Expand recurring events and filter to show from today forward
    const events = data.map((event: any) => ({
      id: event.id,
      created_at: event.created_at,
      title: event.title,
      description: event.description,
      brewery_id: event.brewery_id,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      cost: event.cost,
      is_recurring: event.is_recurring || false,
      is_recurring_biweekly: event.is_recurring_biweekly || false,
      is_recurring_monthly: event.is_recurring_monthly || false,
      recurrence_pattern: null,
      featured: event.featured || false,
      breweries: {
        id: event.breweries?.id || '',
        name: event.breweries?.name || '',
        location: event.breweries?.location || null
      }
    })) as Event[]

    const expandedEvents = expandRecurringEvents(events)
    console.log(`✅ Expanded to ${expandedEvents.length} events after filtering`)
    
    return expandedEvents
  } catch (error) {
    console.error('❌ Exception fetching events:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return []
  }
}

export default async function EventsPage() {
  const events = await getEvents()
  const groupedEvents = groupEventsByDate(events)

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
          EVENTS
        </h1>
        
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              No events found. Check back soon for upcoming brewery events!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2" style={{ borderColor: Colors.dividerLight }}>
                  <h2 className="text-2xl font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                    {date}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dateEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      isFeatured={event.featured}
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

