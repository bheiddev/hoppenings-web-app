import { Colors } from '@/lib/colors'
import { BreweryWithData, breweryAnchorId } from '@/lib/breweriesEventsRegions'

interface BreweriesEventsBreweryBreakdownProps {
  regionBreweries: BreweryWithData[]
}

interface BreweryBreakdownRow {
  breweryId: string
  breweryName: string
  events: number
  releases: number
}

const COLUMN_COUNT = 4

function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
  if (items.length === 0) return Array.from({ length: columnCount }, () => [])

  const perColumn = Math.ceil(items.length / columnCount)
  return Array.from({ length: columnCount }, (_, columnIndex) =>
    items.slice(columnIndex * perColumn, (columnIndex + 1) * perColumn)
  )
}

function BreweryBreakdownEntry({ row }: { row: BreweryBreakdownRow }) {
  return (
    <div
      className="border-b py-2.5 last:border-b-0"
      style={{ borderColor: Colors.dividerLight }}
    >
      <a
        href={`#${breweryAnchorId(row.breweryId)}`}
        className="text-sm font-medium underline hover:opacity-80 leading-snug"
        style={{ color: Colors.primary }}
      >
        {row.breweryName}
      </a>
      <div
        className="text-xs font-mono mt-0.5 truncate"
        style={{ color: Colors.textSecondary }}
        title="Brewery UUID"
      >
        {row.breweryId}
      </div>
      <div className="mt-1.5 flex gap-3 text-xs tabular-nums" style={{ color: Colors.textDark }}>
        <span>
          <span style={{ color: Colors.textSecondary }}>Events </span>
          {row.events}
        </span>
        <span>
          <span style={{ color: Colors.textSecondary }}>Releases </span>
          {row.releases}
        </span>
      </div>
    </div>
  )
}

export function BreweriesEventsBreweryBreakdown({
  regionBreweries,
}: BreweriesEventsBreweryBreakdownProps) {
  const rows: BreweryBreakdownRow[] = [...regionBreweries]
    .sort((a, b) => a.brewery.name.localeCompare(b.brewery.name))
    .map((row) => ({
      breweryId: row.brewery.id,
      breweryName: row.brewery.name,
      events: row.events.length,
      releases: row.releases.length,
    }))

  const columns = splitIntoColumns(rows, COLUMN_COUNT)

  return (
    <section
      className="mb-10 border rounded-xl p-6 w-full"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <p className="text-sm font-semibold mb-4" style={{ color: Colors.textDark }}>
        Events &amp; releases by brewery
      </p>
      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: Colors.textSecondary }}>
          No breweries in this region.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-0">
          {columns.map((columnRows, columnIndex) => (
            <div key={columnIndex} className="min-w-0">
              {columnRows.map((row) => (
                <BreweryBreakdownEntry key={row.breweryId} row={row} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
