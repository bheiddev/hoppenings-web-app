import { Colors } from '@/lib/colors'
import type { SeoAnalyticsResult, SeoRow } from '@/lib/gsc'

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
}: {
  title: string
  description: string
  rows: SeoRow[]
  labelHeader: string
  formatLabel?: (value: string) => string
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
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
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

export function SeoAnalyticsSection({ result }: { result: SeoAnalyticsResult }) {
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
            How hoppeningsco.com shows up in Google Search — visibility, clicks, and which queries and
            pages are driving traffic. Search Console data typically lags 2–3 days.
          </p>
        </div>
        {result.ok ? (
          <p className="text-xs" style={{ color: Colors.textMuted }}>
            {result.data.rangeLabel}
          </p>
        ) : null}
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <SeoTable
              title="Top queries"
              description="Search phrases people typed that led to your site — ranked by clicks."
              rows={result.data.queries}
              labelHeader="Query"
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
