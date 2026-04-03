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

/** Normalized key for breweries with no Region set (displayed as "Other") */
const UNASSIGNED_REGION_KEY = '__unassigned__'

function bucketForRegion(region: string | null): { normKey: string; displayLabel: string } {
  const trimmed = region?.trim()
  if (!trimmed) {
    return { normKey: UNASSIGNED_REGION_KEY, displayLabel: 'Other' }
  }
  return { normKey: trimmed.toLowerCase(), displayLabel: trimmed }
}

function regionAnchorId(normKey: string, displayLabel: string): string {
  if (normKey === UNASSIGNED_REGION_KEY) return 'region-other'
  const slug = displayLabel
    .trim()
    .toLowerCase()
    .replace(/[/\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (slug) return `region-${slug}`
  return `region-${normKey.replace(/[^a-z0-9]+/gi, '-')}`
}

type RegionBucket = {
  normKey: string
  displayLabel: string
  sectionHeading: string
  anchorId: string
}

/** One section per distinct Region value in the DB (case-insensitive merge); null/empty → Other */
function buildRegionBuckets(breweriesWithData: BreweryWithData[]): RegionBucket[] {
  const labelByNorm = new Map<string, string>()
  for (const row of breweriesWithData) {
    const { normKey, displayLabel } = bucketForRegion(row.brewery.region)
    if (!labelByNorm.has(normKey)) labelByNorm.set(normKey, displayLabel)
  }
  const keys = [...labelByNorm.keys()].sort((a, b) => {
    if (a === UNASSIGNED_REGION_KEY) return 1
    if (b === UNASSIGNED_REGION_KEY) return -1
    return (labelByNorm.get(a) || '').localeCompare(labelByNorm.get(b) || '', undefined, {
      sensitivity: 'base',
    })
  })
  return keys.map((normKey) => {
    const displayLabel = labelByNorm.get(normKey) || 'Other'
    return {
      normKey,
      displayLabel,
      sectionHeading: `${displayLabel} Breweries`,
      anchorId: regionAnchorId(normKey, displayLabel),
    }
  })
}

function groupByRegion(breweriesWithData: BreweryWithData[]): Map<string, BreweryWithData[]> {
  const map = new Map<string, BreweryWithData[]>()
  for (const row of breweriesWithData) {
    const { normKey } = bucketForRegion(row.brewery.region)
    if (!map.has(normKey)) map.set(normKey, [])
    map.get(normKey)!.push(row)
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
  const regionBuckets = buildRegionBuckets(breweriesWithData)

  const regionMetrics = regionBuckets.map((b) => {
    const rows = byRegion.get(b.normKey) ?? []
    const breweryCount = rows.length
    const eventCount = rows.reduce((sum, r) => sum + r.events.length, 0)
    const releaseCount = rows.reduce((sum, r) => sum + r.releases.length, 0)
    return {
      normKey: b.normKey,
      sectionHeading: b.sectionHeading,
      displayLabel: b.displayLabel,
      breweryCount,
      eventCount,
      releaseCount,
      anchorId: b.anchorId,
    }
  })

  const breweryBreakdown: {
    regionTitle: string
    regionKey: string
    breweryName: string
    events: number
    releases: number
  }[] = []
  for (const b of regionBuckets) {
    const rows = [...(byRegion.get(b.normKey) ?? [])].sort((a, bRow) =>
      a.brewery.name.localeCompare(bRow.brewery.name)
    )
    for (const row of rows) {
      breweryBreakdown.push({
        regionTitle: b.sectionHeading,
        regionKey: b.normKey,
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
                  <li key={r.normKey}>
                    <a
                      href={`#${r.anchorId}`}
                      className="text-sm underline hover:opacity-80"
                      style={{ color: Colors.primary }}
                    >
                      {r.displayLabel}
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
                    <tr key={r.normKey} className="border-t" style={{ borderColor: Colors.dividerLight }}>
                      <td className="p-2">{r.displayLabel}</td>
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
          {regionBuckets.map((b) => {
            const regionBreweries = byRegion.get(b.normKey) ?? []
            if (regionBreweries.length === 0) return null
            return (
              <section key={b.normKey} id={b.anchorId} className="scroll-mt-24">
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  {b.sectionHeading}
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
