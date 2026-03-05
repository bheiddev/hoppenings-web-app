import { Metadata } from 'next'
import {
  getAllBreweriesWithSlugs,
  getBreweryEvents,
  getProposedEventsByBreweryId,
  getBreweryReleases,
  getBreweryTaplist,
} from '@/lib/breweries'
import { formatReleaseDate } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { Event, BeerRelease, ProposedEvent, TaplistItem } from '@/types/supabase'
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
  releases: BeerRelease[]
  taplist: TaplistItem[]
}

async function getBreweriesWithEvents(): Promise<BreweryWithData[]> {
  const breweries = await getAllBreweriesWithSlugs()
  const results = await Promise.all(
    breweries.map(async (brewery) => ({
      brewery: { id: brewery.id, name: brewery.name },
      events: await getBreweryEvents(brewery.id),
      proposed: await getProposedEventsByBreweryId(brewery.id),
      releases: await getBreweryReleases(brewery.id),
      taplist: await getBreweryTaplist(brewery.id),
    }))
  )
  return results
}

function BeerReleasesTable({ releases, title }: { releases: BeerRelease[]; title: string }) {
  return (
    <div className="flex flex-col h-64 border rounded-lg overflow-hidden" style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}>
      <div className="flex-shrink-0 px-3 py-2 font-semibold text-sm" style={{ backgroundColor: Colors.backgroundLight, color: Colors.textDark }}>
        {title}
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {releases.length === 0 ? (
          <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>No beer releases</p>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.backgroundLight }}>
              <tr>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>Beer</th>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>Type</th>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>ABV</th>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>Release date</th>
              </tr>
            </thead>
            <tbody style={{ color: Colors.textDark }}>
              {releases.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: Colors.dividerLight }}>
                  <td className="p-2">{r.beer_name || '—'}</td>
                  <td className="p-2">{r.Type || '—'}</td>
                  <td className="p-2">{r.ABV ?? '—'}</td>
                  <td className="p-2">{r.release_date ? formatReleaseDate(r.release_date) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function TaplistTable({ taplist, title }: { taplist: TaplistItem[]; title: string }) {
  return (
    <div className="flex flex-col h-64 border rounded-lg overflow-hidden" style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}>
      <div className="flex-shrink-0 px-3 py-2 font-semibold text-sm" style={{ backgroundColor: Colors.backgroundLight, color: Colors.textDark }}>
        {title}
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {taplist.length === 0 ? (
          <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>No taplist</p>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.backgroundLight }}>
              <tr>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>Beer</th>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>ABV</th>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>Style</th>
              </tr>
            </thead>
            <tbody style={{ color: Colors.textDark }}>
              {taplist.map((t) => (
                <tr key={t.id} className="border-t" style={{ borderColor: Colors.dividerLight }}>
                  <td className="p-2">{t.beer_name || '—'}</td>
                  <td className="p-2">{t.abv ?? '—'}</td>
                  <td className="p-2">{t.style || '—'}</td>
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
          {breweriesWithData.map(({ brewery, events, proposed, releases, taplist }) => (
            <section key={brewery.id}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
                {brewery.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <EventsTableWithDelete events={events} title="Events" />
                <ProposedEventsTable proposed={proposed} title="Proposed events" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BeerReleasesTable releases={releases} title="Beer releases" />
                <TaplistTable taplist={taplist} title="Taplist" />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
