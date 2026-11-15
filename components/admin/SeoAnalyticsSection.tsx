import Link from 'next/link'
import { Colors } from '@/lib/colors'
import { AnalyticsRefreshButton } from '@/components/admin/AnalyticsRefreshButton'
import { NearbyBreweriesMap, type NearbyBreweryPin } from '@/components/NearbyBreweriesMap'
import type { SeoAnalyticsResult, SeoRow } from '@/lib/gsc'
import {
  matchSeoQueriesToBreweries,
  type SeoBreweryRef,
} from '@/lib/seoBreweryQueryMatches'

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surfaceLight }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: Colors.textSecondary }}>
        {label}
      </p>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
      >
        {value}
      </p>
      {hint ? (
        <p className="text-[11px] mt-1 leading-snug" style={{ color: Colors.textMuted }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function formatDateLabel(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const [, m, d] = iso.split('-')
  return `${m}/${d}/${iso.slice(0, 4)}`
}

function shortenPage(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname === '/' ? '/' : u.pathname
  } catch {
    return url
  }
}

function SeoTable({
  title,
  description,
  rows,
  labelHeader,
  formatLabel,
  maxHeightClass = 'max-h-80',
}: {
  title: string
  description: string
  rows: SeoRow[]
  labelHeader: string
  formatLabel?: (value: string) => string
  maxHeightClass?: string
}) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: Colors.dividerLight }}>
      <div className="px-3 py-2" style={{ backgroundColor: Colors.surfaceLight }}>
        <p className="text-sm font-semibold" style={{ color: Colors.textDark }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: Colors.textMuted }}>
          {description}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
          No data yet.
        </p>
      ) : (
        <div className={`overflow-x-auto ${maxHeightClass} overflow-y-auto`}>
          <table className="w-full text-left text-sm border-collapse min-w-[28rem]">
            <thead className="sticky top-0" style={{ backgroundColor: Colors.surface }}>
              <tr>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                  {labelHeader}
                </th>
                <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                  Clicks
                </th>
                <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                  Impr.
                </th>
                <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                  CTR
                </th>
                <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                  Pos.
                </th>
              </tr>
            </thead>
            <tbody style={{ color: Colors.textDark }}>
              {rows.map((row) => (
                <tr key={row.label} className="border-t" style={{ borderColor: Colors.dividerLight }}>
                  <td className="p-2 truncate max-w-[16rem]" title={row.label}>
                    {formatLabel ? formatLabel(row.label) : row.label}
                  </td>
                  <td className="p-2 text-right tabular-nums">{row.clicks.toLocaleString()}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: Colors.textSecondary }}>
                    {row.impressions.toLocaleString()}
                  </td>
                  <td className="p-2 text-right tabular-nums" style={{ color: Colors.textSecondary }}>
                    {formatPercent(row.ctr)}
                  </td>
                  <td className="p-2 text-right tabular-nums" style={{ color: Colors.textSecondary }}>
                    {row.position.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function SeoAnalyticsSection({
  result,
  breweries,
}: {
  result: SeoAnalyticsResult
  breweries: SeoBreweryRef[]
}) {
  const mappedBreweries = breweries.filter(
    (b): b is SeoBreweryRef & { latitude: number; longitude: number } =>
      b.latitude != null && b.longitude != null
  )
  const mapPins: NearbyBreweryPin[] = mappedBreweries.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    latitude: b.latitude,
    longitude: b.longitude,
    location: b.region,
    miles: null,
    isCurrent: false,
  }))

  const queryRows = result.ok ? result.data.queries : []
  const topQueriesByImpressions = queryRows
  const queryImpressionsCovered = topQueriesByImpressions.reduce(
    (sum, row) => sum + row.impressions,
    0
  )
  const totalImpressions = result.ok ? result.data.impressions : 0
  const queryCoveragePct =
    totalImpressions > 0
      ? Math.min(100, Math.round((queryImpressionsCovered / totalImpressions) * 1000) / 10)
      : 0
  const breweryMatches = matchSeoQueriesToBreweries(queryRows, breweries)
  const matchedQueryCount = breweryMatches.reduce((sum, row) => sum + row.queries.length, 0)
  const matchedClickCount = breweryMatches.reduce((sum, row) => sum + row.clicks, 0)

  return (
    <section
      className="border rounded-xl p-6 w-full"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Web SEO performance
          </h2>
          <p className="text-xs mt-1 max-w-xl" style={{ color: Colors.textMuted }}>
            How hoppeningsco.com shows up in Google Search over the last ~3 months — visibility, clicks,
            and which queries and pages are driving traffic. Search Console data typically lags 2–3 days.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {result.ok ? (
            <p className="text-xs" style={{ color: Colors.textMuted }}>
              {result.data.rangeLabel}
            </p>
          ) : null}
          <AnalyticsRefreshButton />
        </div>
      </div>

      {!result.ok ? (
        <p className="text-sm" style={{ color: Colors.error }}>
          {result.error}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatCard
              label="Clicks"
              value={result.data.clicks.toLocaleString()}
              hint="Times someone clicked from Google Search to your site — actual search-driven visits."
            />
            <StatCard
              label="Impressions"
              value={result.data.impressions.toLocaleString()}
              hint="Times your pages appeared in Google results — demand and discoverability, even without a click."
            />
            <StatCard
              label="CTR"
              value={formatPercent(result.data.ctr)}
              hint="Click-through rate: clicks ÷ impressions. Higher means titles/snippets are winning the click."
            />
            <StatCard
              label="Avg position"
              value={result.data.position.toFixed(1)}
              hint="Average rank in Google results (1 is top). Lower is better — closer to page one."
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-6 mb-8">
            <div
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: Colors.dividerLight }}
            >
              <div className="px-3 py-2" style={{ backgroundColor: Colors.surfaceLight }}>
                <p className="text-sm font-semibold" style={{ color: Colors.textDark }}>
                  Brewery map
                </p>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: Colors.textMuted }}>
                  All uploaded breweries with coordinates ({mappedBreweries.length} mapped
                  {breweries.length > mappedBreweries.length
                    ? ` · ${breweries.length - mappedBreweries.length} missing lat/lng`
                    : ''}
                  ).
                </p>
              </div>
              {mapPins.length === 0 ? (
                <p className="p-4 text-sm" style={{ color: Colors.textSecondary }}>
                  No breweries with latitude/longitude yet. Add coordinates when creating or editing a
                  brewery.
                </p>
              ) : (
                <NearbyBreweriesMap pins={mapPins} heightClass="h-[260px] w-full sm:h-[300px]" />
              )}
            </div>

            <div
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: Colors.dividerLight }}
            >
              <div className="px-3 py-2" style={{ backgroundColor: Colors.surfaceLight }}>
                <p className="text-sm font-semibold" style={{ color: Colors.textDark }}>
                  Queries tied to breweries
                </p>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: Colors.textMuted }}>
                  Best-effort name match from Search Console queries (e.g. “redleg run club” → Red Leg
                  Brewing). Not perfect — use as a signal, not a scorecard.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3 border-b" style={{ borderColor: Colors.dividerLight }}>
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: Colors.textMuted }}>
                    Breweries hit
                  </p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: Colors.primaryDark }}>
                    {breweryMatches.length}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: Colors.textMuted }}>
                    Queries matched
                  </p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: Colors.primaryDark }}>
                    {matchedQueryCount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: Colors.textMuted }}>
                    Matched clicks
                  </p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: Colors.primaryDark }}>
                    {matchedClickCount.toLocaleString()}
                  </p>
                </div>
              </div>
              {breweryMatches.length === 0 ? (
                <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                  No query-to-brewery name matches in this range yet.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-sm border-collapse min-w-[22rem]">
                    <thead className="sticky top-0" style={{ backgroundColor: Colors.surface }}>
                      <tr>
                        <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                          Brewery
                        </th>
                        <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                          Sample queries
                        </th>
                        <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                          Clicks
                        </th>
                        <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                          Impr.
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ color: Colors.textDark }}>
                      {breweryMatches.map((row) => (
                        <tr key={row.breweryId} className="border-t align-top" style={{ borderColor: Colors.dividerLight }}>
                          <td className="p-2">
                            <Link
                              href={`/breweries/${row.slug}`}
                              className="font-medium hover:underline"
                              style={{ color: Colors.primaryDark }}
                            >
                              {row.breweryName}
                            </Link>
                            {row.region ? (
                              <p className="text-[11px]" style={{ color: Colors.textMuted }}>
                                {row.region}
                              </p>
                            ) : null}
                          </td>
                          <td className="p-2 text-[12px]" style={{ color: Colors.textSecondary }}>
                            {row.queries
                              .slice(0, 3)
                              .map((q) => q.query)
                              .join(' · ')}
                            {row.queries.length > 3 ? ` · +${row.queries.length - 3} more` : ''}
                          </td>
                          <td className="p-2 text-right tabular-nums">{row.clicks.toLocaleString()}</td>
                          <td className="p-2 text-right tabular-nums" style={{ color: Colors.textSecondary }}>
                            {row.impressions.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <SeoTable
              title="Top queries"
              description={`All ${topQueriesByImpressions.length.toLocaleString()} Search Console queries, ranked by impressions (incl. zero-click). Covering ${queryImpressionsCovered.toLocaleString()} of ${totalImpressions.toLocaleString()} total impressions (${queryCoveragePct}%). Anonymized queries are omitted by Google, so this often won’t reach 100%.`}
              rows={topQueriesByImpressions}
              labelHeader="Query"
              maxHeightClass="max-h-[32rem]"
            />
            <SeoTable
              title="Top pages"
              description="Which URLs Google is sending traffic to — your strongest organic landing pages."
              rows={result.data.pages}
              labelHeader="Page"
              formatLabel={shortenPage}
            />
            <SeoTable
              title="By date"
              description="Day-by-day search clicks and visibility — useful for spotting trends or dips."
              rows={result.data.dates}
              labelHeader="Date"
              formatLabel={formatDateLabel}
            />
          </div>
        </>
      )}
    </section>
  )
}
