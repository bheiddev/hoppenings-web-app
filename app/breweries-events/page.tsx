import { Metadata } from 'next'
import Link from 'next/link'
import { Colors } from '@/lib/colors'
import { buildRegionBuckets, getBreweriesWithEvents, groupByRegion } from '@/lib/breweriesEventsRegions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Breweries & Events | Hoppenings',
  description: 'Overview of events and beer releases by region. Open a region to manage brewery content.',
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
      displayLabel: b.displayLabel,
      slug: b.slug,
      breweryCount,
      eventCount,
      releaseCount,
    }
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Breweries & Events
        </h1>
        <p className="text-sm mb-8 max-w-2xl" style={{ color: Colors.textSecondary }}>
          Use the executive view below for counts across regions. Open a region to add, edit, and
          delete events and beer releases for its breweries.
        </p>

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
            <nav className="flex-shrink-0 lg:w-56" aria-label="Regions">
              <p className="text-sm font-semibold mb-3" style={{ color: Colors.textDark }}>
                Regions
              </p>
              <ul className="space-y-2">
                {regionMetrics.map((r) => (
                  <li key={r.normKey}>
                    <Link
                      href={`/breweries-events/${r.slug}`}
                      className="text-sm underline hover:opacity-80"
                      style={{ color: Colors.primary }}
                    >
                      {r.displayLabel}
                    </Link>
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
                    <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                      Manage
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
                      <td className="p-2">
                        <Link
                          href={`/breweries-events/${r.slug}`}
                          className="text-sm underline hover:opacity-80"
                          style={{ color: Colors.primary }}
                        >
                          Open region →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
