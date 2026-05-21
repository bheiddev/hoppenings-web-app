import { Colors } from '@/lib/colors'
import { BreweryWithData, breweryAnchorId } from '@/lib/breweriesEventsRegions'

interface BreweriesEventsBreweryBreakdownProps {
  regionBreweries: BreweryWithData[]
}

export function BreweriesEventsBreweryBreakdown({
  regionBreweries,
}: BreweriesEventsBreweryBreakdownProps) {
  const rows = [...regionBreweries]
    .sort((a, b) => a.brewery.name.localeCompare(b.brewery.name))
    .map((row) => ({
      breweryId: row.brewery.id,
      breweryName: row.brewery.name,
      events: row.events.length,
      releases: row.releases.length,
    }))

  return (
    <section
      className="mb-10 border rounded-xl p-6 w-full"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}
    >
      <p className="text-sm font-semibold mb-3" style={{ color: Colors.textDark }}>
        Events &amp; releases by brewery
      </p>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm border-collapse min-w-[28rem]">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.backgroundLight }}>
            <tr>
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                  No breweries in this region.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.breweryId}
                  className="border-t"
                  style={{ borderColor: Colors.dividerLight }}
                >
                  <td className="p-2">
                    <a
                      href={`#${breweryAnchorId(row.breweryId)}`}
                      className="underline hover:opacity-80"
                      style={{ color: Colors.primary }}
                    >
                      {row.breweryName}
                    </a>
                    <div
                      className="text-xs font-mono mt-1"
                      style={{ color: Colors.textSecondary }}
                      title="Brewery UUID"
                    >
                      {row.breweryId}
                    </div>
                  </td>
                  <td className="p-2 text-right tabular-nums">{row.events}</td>
                  <td className="p-2 text-right tabular-nums">{row.releases}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
