import { Metadata } from 'next'
import {
  getAllBreweriesWithSlugs,
  getBreweryEvents,
  getProposedEventsByBreweryId,
  getBreweryReleases,
} from '@/lib/breweries'
import { formatReleaseDate } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { Event, BeerRelease, ProposedEvent } from '@/types/supabase'
import { ProposedEventsTable } from '@/components/ProposedEventsTable'
import { EventsTableWithDelete } from '@/components/EventsTableWithDelete'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Breweries & Events | Hoppenings',
  description: 'View events and proposed events by brewery.',
}

type BreweryWithData = {
  brewery: { id: string; name: string; region: string | null }
  events: Event[]
  proposed: ProposedEvent[]
  releases: BeerRelease[]
}

const REGION_SECTIONS: { key: string; title: string }[] = [
  { key: 'Colorado Springs', title: 'Colorado Springs Breweries' },
  { key: 'Fort Collins', title: 'Fort Collins Breweries' },
  { key: '__other__', title: 'Other Breweries' },
]

function regionSectionId(key: string) {
  if (key === '__other__') return 'region-other'
  return `region-${key.toLowerCase().replace(/\s+/g, '-')}`
}

function groupByRegion(breweriesWithData: BreweryWithData[]): Map<string, BreweryWithData[]> {
  const map = new Map<string, BreweryWithData[]>()
  for (const { key } of REGION_SECTIONS) {
    map.set(key, [])
  }
  for (const row of breweriesWithData) {
    const region = row.brewery.region?.trim().toLowerCase() ?? ''
    const section = REGION_SECTIONS.find(
      (s) => s.key !== '__other__' && s.key.toLowerCase() === region
    )
    if (section) {
      map.get(section.key)!.push(row)
    } else {
      map.get('__other__')!.push(row)
    }
  }
  return map
}

async function getBreweriesWithEvents(): Promise<BreweryWithData[]> {
  const breweries = await getAllBreweriesWithSlugs()
  const results = await Promise.all(
    breweries.map(async (brewery) => ({
      brewery: { id: brewery.id, name: brewery.name, region: brewery.Region ?? null },
      events: await getBreweryEvents(brewery.id),
      proposed: await getProposedEventsByBreweryId(brewery.id),
      releases: await getBreweryReleases(brewery.id),
    }))
  )
  return results
}

function formatCreatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/Denver',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function BeerReleasesTable({ releases, title }: { releases: BeerRelease[]; title: string }) {
  return (
    <div
      className="flex flex-col min-h-[18rem] max-h-[36rem] border rounded-lg overflow-hidden w-full"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}
    >
      <div
        className="flex-shrink-0 px-3 py-2 font-semibold text-sm"
        style={{ backgroundColor: Colors.backgroundLight, color: Colors.textDark }}
      >
        {title}
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {releases.length === 0 ? (
          <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
            No beer releases
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[72rem]">
              <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.backgroundLight }}>
                <tr>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    ID
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Created
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Beer
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Type
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    ABV
                  </th>
                  <th className="p-2 font-medium min-w-[12rem]" style={{ color: Colors.textDark }}>
                    Description
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Brewery (join)
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    brewery_id
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    brewery_id2
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    brewery_id3
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Release date
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: Colors.textDark }}>
                {releases.map((r) => (
                  <tr key={r.id} className="border-t align-top" style={{ borderColor: Colors.dividerLight }}>
                    <td className="p-2 font-mono text-xs whitespace-nowrap">{r.id}</td>
                    <td className="p-2 whitespace-nowrap">{formatCreatedAt(r.created_at)}</td>
                    <td className="p-2">{r.beer_name || '—'}</td>
                    <td className="p-2">{r.Type || '—'}</td>
                    <td className="p-2">{r.ABV ?? '—'}</td>
                    <td className="p-2 text-xs break-words whitespace-pre-wrap max-w-md">
                      {r.description?.trim() ? r.description : '—'}
                    </td>
                    <td className="p-2">{r.breweries?.name || '—'}</td>
                    <td className="p-2 font-mono text-xs">{r.brewery_id}</td>
                    <td className="p-2 font-mono text-xs">{r.brewery_id2 ?? '—'}</td>
                    <td className="p-2 font-mono text-xs">{r.brewery_id3 ?? '—'}</td>
                    <td className="p-2 whitespace-nowrap">
                      {r.release_date ? formatReleaseDate(r.release_date) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default async function BreweriesEventsPage() {
  const breweriesWithData = await getBreweriesWithEvents()
  const byRegion = groupByRegion(breweriesWithData)

  const regionMetrics = REGION_SECTIONS.map(({ key, title }) => {
    const rows = byRegion.get(key) ?? []
    const breweryCount = rows.length
    const eventCount = rows.reduce((sum, r) => sum + r.events.length, 0)
    const releaseCount = rows.reduce((sum, r) => sum + r.releases.length, 0)
    return { key, title, breweryCount, eventCount, releaseCount, anchorId: regionSectionId(key) }
  })

  const breweryBreakdown: {
    regionTitle: string
    regionKey: string
    breweryName: string
    events: number
    releases: number
  }[] = []
  for (const { key, title } of REGION_SECTIONS) {
    const rows = [...(byRegion.get(key) ?? [])].sort((a, b) =>
      a.brewery.name.localeCompare(b.brewery.name)
    )
    for (const row of rows) {
      breweryBreakdown.push({
        regionTitle: title,
        regionKey: key,
        breweryName: row.brewery.name,
        events: row.events.length,
        releases: row.releases.length,
      })
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1
          className="text-4xl font-bold mb-8"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Breweries & Events
        </h1>

        <section
          className="mb-10 border rounded-xl p-6 w-full"
          style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}
        >
          <h2
            className="text-xl font-bold mb-6"
            style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Executive view
          </h2>

          <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
            <nav className="flex-shrink-0 lg:w-56" aria-label="Jump to region">
              <p className="text-sm font-semibold mb-3" style={{ color: Colors.textDark }}>
                Regions
              </p>
              <ul className="space-y-2">
                {regionMetrics.map((r) => (
                  <li key={r.key}>
                    <a
                      href={`#${r.anchorId}`}
                      className="text-sm underline hover:opacity-80"
                      style={{ color: Colors.primary }}
                    >
                      {r.title.replace(' Breweries', '')}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex-1 min-w-0 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[28rem]">
                <thead style={{ backgroundColor: Colors.backgroundLight }}>
                  <tr>
                    <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                      Region
                    </th>
                    <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                      Breweries
                    </th>
                    <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                      Events
                    </th>
                    <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                      Beer releases
                    </th>
                  </tr>
                </thead>
                <tbody style={{ color: Colors.textDark }}>
                  {regionMetrics.map((r) => (
                    <tr key={r.key} className="border-t" style={{ borderColor: Colors.dividerLight }}>
                      <td className="p-2">{r.title.replace(' Breweries', '')}</td>
                      <td className="p-2 text-right tabular-nums">{r.breweryCount}</td>
                      <td className="p-2 text-right tabular-nums">{r.eventCount}</td>
                      <td className="p-2 text-right tabular-nums">{r.releaseCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t" style={{ borderColor: Colors.dividerLight }}>
            <p className="text-sm font-semibold mb-3" style={{ color: Colors.textDark }}>
              Events &amp; releases by brewery
            </p>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse min-w-[36rem]">
                <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.backgroundLight }}>
                  <tr>
                    <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                      Region
                    </th>
                    <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                      Brewery
                    </th>
                    <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                      Events
                    </th>
                    <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                      Beer releases
                    </th>
                  </tr>
                </thead>
                <tbody style={{ color: Colors.textDark }}>
                  {breweryBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                        No breweries loaded.
                      </td>
                    </tr>
                  ) : (
                    breweryBreakdown.map((row, i) => (
                      <tr key={`${row.regionKey}-${row.breweryName}-${i}`} className="border-t" style={{ borderColor: Colors.dividerLight }}>
                        <td className="p-2 whitespace-nowrap">{row.regionTitle.replace(' Breweries', '')}</td>
                        <td className="p-2">{row.breweryName}</td>
                        <td className="p-2 text-right tabular-nums">{row.events}</td>
                        <td className="p-2 text-right tabular-nums">{row.releases}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="space-y-12">
          {REGION_SECTIONS.map(({ key, title }) => {
            const regionBreweries = byRegion.get(key) ?? []
            if (regionBreweries.length === 0) return null
            return (
              <section key={key} id={regionSectionId(key)} className="scroll-mt-24">
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  {title}
                </h2>
                <div className="space-y-10">
                  {regionBreweries.map(({ brewery, events, proposed, releases }) => (
                    <div key={brewery.id} className="space-y-6">
                      <h3 className="text-xl font-semibold" style={{ color: Colors.textPrimary }}>
                        {brewery.name}
                      </h3>
                      <EventsTableWithDelete events={events} title="Events" />
                      <ProposedEventsTable proposed={proposed} title="Proposed events" />
                      <BeerReleasesTable releases={releases} title="Beer releases" />
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
