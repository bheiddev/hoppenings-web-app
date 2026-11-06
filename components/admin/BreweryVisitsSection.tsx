import { Colors } from '@/lib/colors'
import type {
  BreweryVisitBreweryRow,
  BreweryVisitDayRow,
  BreweryVisitPersonRow,
  BreweryVisitRecentRow,
  BreweryVisitsResult,
} from '@/lib/adminBreweryVisits'

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surfaceLight }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-1"
        style={{ color: Colors.textSecondary }}
      >
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

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    timeZone: 'America/Denver',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function PersonCell({
  displayName,
  email,
  userId,
}: {
  displayName: string | null
  email: string | null
  userId: string
}) {
  return (
    <div>
      <div
        className="font-semibold"
        style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        {displayName?.trim() || 'No display name'}
      </div>
      {email ? (
        <div className="text-xs mt-0.5" style={{ color: Colors.textSecondary }}>
          {email}
        </div>
      ) : null}
      <div className="text-[11px] font-mono mt-1 break-all" style={{ color: Colors.textMuted }}>
        {userId}
      </div>
    </div>
  )
}

function ConfirmedPill({ confirmed }: { confirmed: boolean }) {
  const tone = confirmed ? Colors.success : Colors.textMuted
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: `${tone}18`,
        color: tone,
        border: `1px solid ${tone}44`,
      }}
    >
      {confirmed ? 'confirmed' : 'pending'}
    </span>
  )
}

function PeopleTable({ rows }: { rows: BreweryVisitPersonRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: Colors.textSecondary }}>
        No brewery visits logged yet.
      </p>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border max-h-[36rem] overflow-y-auto"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.surfaceLight }}>
          <tr>
            {['Person', 'Visits', 'Confirmed', 'Breweries', 'Top breweries', 'Last visit'].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-semibold"
                  style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.userId}
              className="border-t align-top"
              style={{ borderColor: Colors.dividerLight }}
            >
              <td className="px-4 py-3">
                <PersonCell
                  displayName={row.displayName}
                  email={row.email}
                  userId={row.userId}
                />
              </td>
              <td
                className="px-4 py-3 tabular-nums font-semibold"
                style={{ color: Colors.primaryDark }}
              >
                {row.totalVisits}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: Colors.textDark }}>
                {row.confirmedVisits}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: Colors.textSecondary }}>
                {row.uniqueBreweries}
              </td>
              <td className="px-4 py-3" style={{ color: Colors.textSecondary }}>
                {row.breweryBreakdown
                  .slice(0, 5)
                  .map((b) => `${b.breweryName} (${b.count})`)
                  .join(', ')}
                {row.breweryBreakdown.length > 5
                  ? ` · +${row.breweryBreakdown.length - 5} more`
                  : ''}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: Colors.textMuted }}>
                {formatWhen(row.lastVisitedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DaysTable({ rows }: { rows: BreweryVisitDayRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: Colors.textSecondary }}>
        No daily visit activity yet.
      </p>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border max-h-[28rem] overflow-y-auto"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.surfaceLight }}>
          <tr>
            {['Day', 'Visits', 'Confirmed', 'People', 'Breweries'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-semibold"
                style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.ymd}
              className="border-t align-top"
              style={{ borderColor: Colors.dividerLight }}
            >
              <td className="px-4 py-3 font-semibold" style={{ color: Colors.textDark }}>
                {row.dateLabel}
              </td>
              <td
                className="px-4 py-3 tabular-nums font-semibold"
                style={{ color: Colors.primaryDark }}
              >
                {row.totalVisits}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: Colors.textDark }}>
                {row.confirmedVisits}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: Colors.textSecondary }}>
                {row.uniqueUsers}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: Colors.textSecondary }}>
                {row.uniqueBreweries}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BreweriesTable({ rows }: { rows: BreweryVisitBreweryRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: Colors.textSecondary }}>
        No brewery visit totals yet.
      </p>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border max-h-[28rem] overflow-y-auto"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.surfaceLight }}>
          <tr>
            {['Brewery', 'Visits', 'Confirmed', 'People'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-semibold"
                style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.breweryId}
              className="border-t align-top"
              style={{ borderColor: Colors.dividerLight }}
            >
              <td className="px-4 py-3 font-semibold" style={{ color: Colors.textDark }}>
                {row.breweryName}
              </td>
              <td
                className="px-4 py-3 tabular-nums font-semibold"
                style={{ color: Colors.primaryDark }}
              >
                {row.totalVisits}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: Colors.textDark }}>
                {row.confirmedVisits}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: Colors.textSecondary }}>
                {row.uniqueUsers}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RecentTable({ rows }: { rows: BreweryVisitRecentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: Colors.textSecondary }}>
        No recent visits.
      </p>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border max-h-[28rem] overflow-y-auto"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.surfaceLight }}>
          <tr>
            {['When', 'Person', 'Brewery', 'Status', 'Source'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-semibold"
                style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-t align-top"
              style={{ borderColor: Colors.dividerLight }}
            >
              <td className="px-4 py-3 text-xs" style={{ color: Colors.textMuted }}>
                {formatWhen(row.visitedAt)}
              </td>
              <td className="px-4 py-3">
                <PersonCell
                  displayName={row.displayName}
                  email={row.email}
                  userId={row.userId}
                />
              </td>
              <td className="px-4 py-3" style={{ color: Colors.textDark }}>
                {row.breweryName}
              </td>
              <td className="px-4 py-3">
                <ConfirmedPill confirmed={row.confirmed} />
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: Colors.textMuted }}>
                {row.source || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function BreweryVisitsSection({ result }: { result: BreweryVisitsResult }) {
  const { summary, people, byDay, byBrewery, recent, error } = result

  return (
    <section className="space-y-8">
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Brewery Visits
        </h2>
        <p className="mt-1 text-sm max-w-3xl" style={{ color: Colors.textSecondary }}>
          Check-ins from <code className="text-xs">brewery_visits</code>. People are sorted by
          total visits. Days use Mountain Time. Showing up to the latest 8,000 visit rows.
        </p>
      </div>

      {error ? (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: Colors.error, backgroundColor: '#FEE2E2', color: Colors.error }}
        >
          Failed to load brewery visits: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total visits" value={summary.totalVisits.toLocaleString()} />
        <StatCard
          label="Confirmed"
          value={summary.confirmedVisits.toLocaleString()}
          hint={`${summary.totalVisits - summary.confirmedVisits} pending`}
        />
        <StatCard label="People" value={summary.uniqueUsers.toLocaleString()} />
        <StatCard label="Breweries" value={summary.uniqueBreweries.toLocaleString()} />
        <StatCard
          label="Today"
          value={summary.visitsToday.toLocaleString()}
          hint={`${summary.confirmedToday} confirmed`}
        />
        <StatCard
          label="Avg / person"
          value={
            summary.uniqueUsers > 0
              ? (summary.totalVisits / summary.uniqueUsers).toFixed(1)
              : '0'
          }
        />
      </div>

      <div className="space-y-3">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            People by visit count
          </h3>
          <p className="text-sm" style={{ color: Colors.textSecondary }}>
            {people.length.toLocaleString()} people · sorted by most visits.
          </p>
        </div>
        <PeopleTable rows={people} />
      </div>

      <div className="space-y-3">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Visits by day
          </h3>
          <p className="text-sm" style={{ color: Colors.textSecondary }}>
            {byDay.length.toLocaleString()} days with activity (newest first).
          </p>
        </div>
        <DaysTable rows={byDay} />
      </div>

      <div className="space-y-3">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Visits by brewery
          </h3>
          <p className="text-sm" style={{ color: Colors.textSecondary }}>
            {byBrewery.length.toLocaleString()} breweries · sorted by visit count.
          </p>
        </div>
        <BreweriesTable rows={byBrewery} />
      </div>

      <div className="space-y-3">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Recent visits
          </h3>
          <p className="text-sm" style={{ color: Colors.textSecondary }}>
            Latest {recent.length.toLocaleString()} individual check-ins.
          </p>
        </div>
        <RecentTable rows={recent} />
      </div>
    </section>
  )
}
