import { Metadata } from 'next'
import {
  getAllBreweriesWithSlugs,
  getBreweryEvents,
  getProposedEventsByBreweryId,
} from '@/lib/breweries'
import { formatEventDate, formatTime12Hour } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { Event } from '@/types/supabase'
import { ProposedEvent } from '@/types/supabase'
import { ProposedEventsTable } from '@/components/ProposedEventsTable'

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

function EventsTable({ events, title }: { events: Event[]; title: string }) {
  return (
    <div className="flex flex-col h-64 border rounded-lg overflow-hidden" style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}>
      <div className="flex-shrink-0 px-3 py-2 font-semibold text-sm" style={{ backgroundColor: Colors.backgroundLight, color: Colors.textDark }}>
        {title}
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {events.length === 0 ? (
          <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>No events</p>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.backgroundLight }}>
              <tr>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>Title</th>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>Date</th>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>Time</th>
              </tr>
            </thead>
            <tbody style={{ color: Colors.textDark }}>
              {events.map((e) => (
                <tr key={e.id} className="border-t" style={{ borderColor: Colors.dividerLight }}>
                  <td className="p-2">{e.title || '—'}</td>
                  <td className="p-2">{e.event_date ? formatEventDate(e.event_date) : '—'}</td>
                  <td className="p-2">{e.start_time ? formatTime12Hour(e.start_time) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
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
                <EventsTable events={events} title="Events" />
                <ProposedEventsTable proposed={proposed} title="Proposed events" />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
