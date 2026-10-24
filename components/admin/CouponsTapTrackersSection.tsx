import { Colors } from '@/lib/colors'
import type {
  CouponAwardRow,
  CouponUsagePersonRow,
  CouponsTapTrackersResult,
  TapTrackerCompleterRow,
  TapTrackerProgressRow,
} from '@/lib/adminCouponsTapTrackers'

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

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'redeemed' || status === 'rewarded'
      ? Colors.success
      : status === 'active' || status === 'ready'
        ? Colors.primaryDark
        : status === 'expired' || status === 'closed' || status === 'void'
          ? Colors.textMuted
          : Colors.textSecondary

  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: `${tone}18`,
        color: tone,
        border: `1px solid ${tone}44`,
      }}
    >
      {status}
    </span>
  )
}

function PersonCell({
  displayName,
  email,
  userId,
  deviceId,
}: {
  displayName: string | null
  email: string | null
  userId?: string | null
  deviceId?: string | null
}) {
  return (
    <div>
      <div
        className="font-semibold"
        style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        {displayName?.trim() || (userId ? 'No display name' : 'Guest device')}
      </div>
      {email ? (
        <div className="text-xs mt-0.5" style={{ color: Colors.textSecondary }}>
          {email}
        </div>
      ) : null}
      {userId ? (
        <div
          className="text-[11px] font-mono mt-1 break-all"
          style={{ color: Colors.textMuted }}
        >
          {userId}
        </div>
      ) : deviceId ? (
        <div
          className="text-[11px] font-mono mt-1 break-all"
          style={{ color: Colors.textMuted }}
        >
          device:{deviceId}
        </div>
      ) : null}
    </div>
  )
}

function ProgressBar({ counted, required }: { counted: number; required: number }) {
  const pct = required > 0 ? Math.min(100, Math.round((counted / required) * 100)) : 0
  return (
    <div className="min-w-[7rem]">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-sm font-semibold tabular-nums" style={{ color: Colors.textDark }}>
          {counted}/{required}
        </span>
        <span className="text-[11px] tabular-nums" style={{ color: Colors.textMuted }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: Colors.surfaceLight }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 100 ? Colors.success : Colors.primaryDark,
          }}
        />
      </div>
    </div>
  )
}

function CompletersTable({ rows }: { rows: TapTrackerCompleterRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: Colors.textSecondary }}>
        No completed tap trackers yet (closed with full visits).
      </p>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr style={{ backgroundColor: Colors.surfaceLight }}>
            {['Person', 'Completed trackers', 'Breweries', 'Last completed'].map((h) => (
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
                {row.completedRuns}
              </td>
              <td className="px-4 py-3" style={{ color: Colors.textSecondary }}>
                {row.breweryNames.join(', ')}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: Colors.textMuted }}>
                {formatWhen(row.lastCompletedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CouponPeopleTable({ rows }: { rows: CouponUsagePersonRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: Colors.textSecondary }}>
        No users with coupons yet.
      </p>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr style={{ backgroundColor: Colors.surfaceLight }}>
            {['Person', 'Awarded', 'Redeemed', 'Ready', 'Breweries', 'Last redeemed'].map(
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
              <td className="px-4 py-3 tabular-nums" style={{ color: Colors.textDark }}>
                {row.awardedCount}
              </td>
              <td className="px-4 py-3 tabular-nums font-semibold" style={{ color: Colors.primaryDark }}>
                {row.redeemedCount}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: Colors.textSecondary }}>
                {row.readyCount}
              </td>
              <td className="px-4 py-3" style={{ color: Colors.textSecondary }}>
                {row.breweryNames.join(', ')}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: Colors.textMuted }}>
                {formatWhen(row.lastRedeemedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AwardsTable({ rows }: { rows: CouponAwardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: Colors.textSecondary }}>
        No coupon awards yet.
      </p>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border max-h-[28rem] overflow-y-auto"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.surfaceLight }}>
          <tr>
            {['Person', 'Brewery', 'Offer', 'Kind', 'Status', 'Source', 'Awarded', 'Redeemed'].map(
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
              key={row.id}
              className="border-t align-top"
              style={{ borderColor: Colors.dividerLight }}
            >
              <td className="px-4 py-3">
                <PersonCell
                  displayName={row.displayName}
                  email={row.email}
                  userId={row.userId}
                  deviceId={row.deviceId}
                />
              </td>
              <td className="px-4 py-3" style={{ color: Colors.textDark }}>
                {row.breweryName}
              </td>
              <td className="px-4 py-3" style={{ color: Colors.textSecondary }}>
                {row.offerLabel || '—'}
              </td>
              <td className="px-4 py-3" style={{ color: Colors.textSecondary }}>
                {row.kind}
              </td>
              <td className="px-4 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: Colors.textMuted }}>
                {row.source}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: Colors.textMuted }}>
                {formatWhen(row.awardedAt)}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: Colors.textMuted }}>
                {formatWhen(row.redeemedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TapTrackersTable({ rows }: { rows: TapTrackerProgressRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: Colors.textSecondary }}>
        No tap tracker runs yet.
      </p>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border max-h-[32rem] overflow-y-auto"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="sticky top-0 z-10" style={{ backgroundColor: Colors.surfaceLight }}>
          <tr>
            {['Person', 'Brewery', 'Progress', 'Status', 'Started', 'Completed'].map((h) => (
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
              key={row.runId}
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
              <td className="px-4 py-3">
                <div className="font-semibold" style={{ color: Colors.primaryDark }}>
                  {row.breweryName}
                </div>
                {row.couponAwarded ? (
                  <div className="text-[11px] mt-1 font-semibold" style={{ color: Colors.success }}>
                    Coupon awarded (closed + full visits)
                  </div>
                ) : null}
                {row.couponPourCounted ? (
                  <div className="text-[11px] mt-1" style={{ color: Colors.textMuted }}>
                    Coupon pour counted
                  </div>
                ) : null}
                {row.closeReason ? (
                  <div className="text-[11px] mt-0.5" style={{ color: Colors.textMuted }}>
                    Closed: {row.closeReason}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <ProgressBar counted={row.visitsCounted} required={row.visitsRequired} />
              </td>
              <td className="px-4 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: Colors.textMuted }}>
                {formatWhen(row.startedAt)}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: Colors.textMuted }}>
                {formatWhen(row.completedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CouponsTapTrackersSection({ result }: { result: CouponsTapTrackersResult }) {
  const { summary, people, tapTrackerCompleters, recentAwards, tapTrackers, error } = result
  const redeemedPeople = people.filter((p) => p.redeemedCount > 0)

  return (
    <section className="space-y-8">
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Coupons &amp; Tap Trackers
        </h2>
        <p className="mt-1 text-sm max-w-3xl" style={{ color: Colors.textSecondary }}>
          Usage is based on completed tap trackers: status <code className="text-xs">closed</code>{' '}
          with <code className="text-xs">visits_counted = visits_required</code> means a reward
          coupon was awarded. Coupon rows below are supporting detail.
        </p>
      </div>

      {error ? (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: Colors.error, backgroundColor: '#FEE2E2', color: Colors.error }}
        >
          Failed to load coupons / tap trackers: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          label="People used tap tracker"
          value={summary.uniqueUsersTapTrackerCouponAwarded.toLocaleString()}
          hint="Closed + full visits (coupon awarded)"
        />
        <StatCard
          label="Completed trackers"
          value={summary.completedTapTrackersCouponAwarded.toLocaleString()}
          hint="Runs that earned a reward coupon"
        />
        <StatCard
          label="Active tap trackers"
          value={summary.activeTapTrackers.toLocaleString()}
          hint={`${summary.rewardedTapTrackers} rewarded · ${summary.closedTapTrackers} closed`}
        />
        <StatCard
          label="Active enrollments"
          value={summary.activeEnrollments.toLocaleString()}
          hint="Opted in, not opted out"
        />
        <StatCard
          label="Coupons redeemed"
          value={summary.couponsRedeemed.toLocaleString()}
          hint={`${summary.uniqueUsersRedeemed} people · ${summary.couponsAwarded} awarded`}
        />
      </div>

      {summary.guestDeviceCoupons > 0 ? (
        <p className="text-xs" style={{ color: Colors.textMuted }}>
          {summary.guestDeviceCoupons.toLocaleString()} coupon
          {summary.guestDeviceCoupons === 1 ? '' : 's'} tied to a guest device (no profile yet).
        </p>
      ) : null}

      <div className="space-y-3">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            People who completed a tap tracker
          </h3>
          <p className="text-sm" style={{ color: Colors.textSecondary }}>
            {tapTrackerCompleters.length.toLocaleString()} people with at least one closed run at
            full visits (coupon awarded).
          </p>
        </div>
        <CompletersTable rows={tapTrackerCompleters} />
      </div>

      <div className="space-y-3">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Tap tracker progress
          </h3>
          <p className="text-sm" style={{ color: Colors.textSecondary }}>
            All pour-contest runs by person and brewery. Completed (coupon awarded) listed first.
          </p>
        </div>
        <TapTrackersTable rows={tapTrackers} />
      </div>

      <div className="space-y-3">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Coupon redemptions (supporting)
          </h3>
          <p className="text-sm" style={{ color: Colors.textSecondary }}>
            {redeemedPeople.length.toLocaleString()} people with a{' '}
            <code className="text-xs">user_coupons</code> redemption
            {people.length !== redeemedPeople.length
              ? ` · ${people.length.toLocaleString()} with any award`
              : ''}
            .
          </p>
        </div>
        <CouponPeopleTable rows={redeemedPeople.length > 0 ? redeemedPeople : people} />
      </div>

      <div className="space-y-3">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Recent coupon awards
          </h3>
          <p className="text-sm" style={{ color: Colors.textSecondary }}>
            Latest {recentAwards.length.toLocaleString()} awards (including guest devices).
          </p>
        </div>
        <AwardsTable rows={recentAwards} />
      </div>
    </section>
  )
}
