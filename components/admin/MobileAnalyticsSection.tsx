import { Colors } from '@/lib/colors'
import type { BreakdownRow, MobileAnalyticsResult } from '@/lib/ga4'

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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    return `${hrs}h ${mins % 60}m`
  }
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function formatDateLabel(yyyymmdd: string): string {
  if (!/^\d{8}$/.test(yyyymmdd)) return yyyymmdd
  return `${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(0, 4)}`
}

function BreakdownTable({
  title,
  description,
  rows,
  labelHeader,
  formatLabel,
}: {
  title: string
  description: string
  rows: BreakdownRow[]
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
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0" style={{ backgroundColor: Colors.surface }}>
              <tr>
                <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                  {labelHeader}
                </th>
                <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                  Users
                </th>
                <th className="p-2 font-medium text-right" style={{ color: Colors.textDark }}>
                  Events
                </th>
              </tr>
            </thead>
            <tbody style={{ color: Colors.textDark }}>
              {rows.map((row) => (
                <tr key={row.value} className="border-t" style={{ borderColor: Colors.dividerLight }}>
                  <td className="p-2 truncate max-w-[16rem]" title={row.value}>
                    {formatLabel ? formatLabel(row.value) : row.value}
                  </td>
                  <td className="p-2 text-right tabular-nums">{row.activeUsers.toLocaleString()}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: Colors.textSecondary }}>
                    {row.eventCount.toLocaleString()}
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

export function MobileAnalyticsSection({ result }: { result: MobileAnalyticsResult }) {
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
            Mobile app analytics
          </h2>
          <p className="text-xs mt-1 max-w-xl" style={{ color: Colors.textMuted }}>
            How people are opening and using the Hoppenings iOS/Android app. Active-user cards use
            rolling windows; sessions, events, cities, and dates are for the last 7 days unless noted.
          </p>
        </div>
        {result.ok ? (
          <p className="text-xs" style={{ color: Colors.textMuted }}>
            GA4 · {result.data.rangeLabel}
          </p>
        ) : null}
      </div>

      {!result.ok ? (
        <p className="text-sm" style={{ color: Colors.error }}>
          {result.error}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Daily active"
              value={result.data.dau.toLocaleString()}
              hint="Unique people who opened the app yesterday — a pulse of day-to-day demand."
            />
            <StatCard
              label="Weekly active"
              value={result.data.wau.toLocaleString()}
              hint="Unique people active in the last 7 days — short-term habit and retention."
            />
            <StatCard
              label="Monthly active"
              value={result.data.mau.toLocaleString()}
              hint="Unique people active in the last 28 days — the size of your regular audience."
            />
            <StatCard
              label="App opens"
              value={result.data.appOpens.toLocaleString()}
              hint="Times the app was launched in the last 28 days — repeat opens from the same person count again."
            />
          </div>

          <p
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: Colors.textSecondary }}
          >
            Sessions & events
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatCard
              label="Total events"
              value={result.data.eventCount.toLocaleString()}
              hint="Every tracked action in the last 7 days — taps, screens, opens, and custom events."
            />
            <StatCard
              label="Sessions"
              value={result.data.sessions.toLocaleString()}
              hint="Separate visits in the last 7 days. A new session starts after ~30 minutes idle or a fresh open."
            />
            <StatCard
              label="Engaged sessions"
              value={result.data.engagedSessions.toLocaleString()}
              hint="Visits that lasted 10+ seconds, had a key event, or viewed 2+ screens — not bounce-and-leave."
            />
            <StatCard
              label="Engagement rate"
              value={formatPercent(result.data.engagementRate)}
              hint="Share of sessions that were engaged. Higher means people are sticking around once they open."
            />
            <StatCard
              label="Avg session"
              value={formatDuration(result.data.averageSessionDuration)}
              hint="Typical time spent in the app per visit over the last 7 days."
            />
            <StatCard
              label="Bounce rate"
              value={formatPercent(result.data.bounceRate)}
              hint="Share of sessions that weren’t engaged — quick open-and-close visits."
            />
            <StatCard
              label="Sessions / user"
              value={result.data.sessionsPerUser.toFixed(2)}
              hint="How often the same person comes back within the week. Above ~1 means repeat visits."
            />
            <StatCard
              label="Events / session"
              value={result.data.eventsPerSession.toFixed(1)}
              hint="How much activity happens in a typical visit — higher means more browsing and tapping."
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <BreakdownTable
              title="Events"
              description="What people are actually doing in the app — ranked by how often each event fired."
              rows={result.data.events}
              labelHeader="Event"
            />
            <BreakdownTable
              title="Cities"
              description="Where active users are located (last 7 days). Useful for spotting regional demand."
              rows={result.data.cities}
              labelHeader="City"
            />
            <BreakdownTable
              title="By date"
              description="Day-by-day users and event volume — good for spotting weekends, launches, or dips."
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
