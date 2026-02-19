import { Metadata } from 'next'
import {
  getAllBreweriesWithSlugs,
  getBreweryEvents,
  getProposedEventsByBreweryId,
} from '@/lib/breweries'
import { Colors } from '@/lib/colors'
import { Event } from '@/types/supabase'
import { ProposedEvent } from '@/types/supabase'
import { ProposedEventsTable } from '@/components/ProposedEventsTable'
import { EventsTableWithDelete } from '@/components/EventsTableWithDelete'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Breweries & Events | Hoppenings',
  description: 'View events and proposed events by brewery.',
}

type BreweryWithData = {
  brewery: { id: string; name: string }
  events: Event[]
  proposed: ProposedEvent[]
}

async function getBreweriesWithEvents(): Promise<BreweryWithData[]> {
  const breweries = await getAllBreweriesWithSlugs()
  const results = await Promise.all(
    breweries.map(async (brewery) => ({
      brewery: { id: brewery.id, name: brewery.name },
      events: await getBreweryEvents(brewery.id),
      proposed: await getProposedEventsByBreweryId(brewery.id),
    }))
  )
  return results
}

export default async function BreweriesEventsPage() {
  const breweriesWithData = await getBreweriesWithEvents()

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
          Breweries & Events
        </h1>

        <div className="space-y-10">
          {breweriesWithData.map(({ brewery, events, proposed }) => (
            <section key={brewery.id}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
                {brewery.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EventsTableWithDelete events={events} title="Events" />
                <ProposedEventsTable proposed={proposed} title="Proposed events" />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
