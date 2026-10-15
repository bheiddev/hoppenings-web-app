import { Colors } from '@/lib/colors'
import type { BreweryAdminProfileRow } from '@/lib/breweryStaffProfiles'

export function BreweryStaffSection({
  rows,
  error,
}: {
  rows: BreweryAdminProfileRow[]
  error: string | null
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Brewery Staff Privileges
        </h2>
        <p className="mt-1 text-sm max-w-3xl" style={{ color: Colors.textSecondary }}>
          Profiles with <code className="text-xs">brewery_admin</code> and the breweries they can
          edit (<code className="text-xs">profile_staff_breweries</code> membership and/or{' '}
          <code className="text-xs">staff_brewery_id</code>).
        </p>
      </div>

      {error ? (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: Colors.error, backgroundColor: '#FEE2E2', color: Colors.error }}
        >
          Failed to load staff profiles: {error}
        </div>
      ) : null}

      {!error && rows.length === 0 ? (
        <p className="text-sm" style={{ color: Colors.textSecondary }}>
          No profiles currently have brewery_admin enabled.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div
          className="overflow-x-auto rounded-lg border"
          style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
        >
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: Colors.surfaceLight }}>
                <th
                  className="px-4 py-3 font-semibold"
                  style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  Profile
                </th>
                <th
                  className="px-4 py-3 font-semibold"
                  style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  Flags
                </th>
                <th
                  className="px-4 py-3 font-semibold"
                  style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  Staff breweries
                </th>
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
                    <div
                      className="font-semibold"
                      style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
                    >
                      {row.displayName || 'No display name'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: Colors.textSecondary }}>
                      {row.email || 'No email'}
                    </div>
                    <div className="text-[11px] font-mono mt-1 break-all" style={{ color: Colors.textMuted }}>
                      {row.id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <FlagPill label="brewery_admin" active={row.breweryAdmin} />
                      <FlagPill label="admin" active={row.siteAdmin} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.staffBreweries.length === 0 ? (
                      <span style={{ color: Colors.textSecondary }}>
                        No staff brewery assigned
                      </span>
                    ) : (
                      <ul className="space-y-2">
                        {row.staffBreweries.map((brewery) => (
                          <li key={brewery.id} className="leading-snug">
                            <div
                              className="font-semibold"
                              style={{ color: Colors.primaryDark }}
                            >
                              {brewery.name}
                            </div>
                            <div className="text-[11px] font-mono break-all" style={{ color: Colors.textMuted }}>
                              {brewery.id}
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-1">
                              {brewery.isMembership ? (
                                <MiniPill label="membership" />
                              ) : null}
                              {brewery.isActiveSelection ? (
                                <MiniPill label="active selection" />
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

function FlagPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: active ? `${Colors.success}22` : Colors.surfaceLight,
        color: active ? Colors.success : Colors.textMuted,
        border: `1px solid ${active ? Colors.success : Colors.dividerLight}`,
      }}
    >
      {label}
      {active ? '' : ' off'}
    </span>
  )
}

function MiniPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: Colors.surfaceLight,
        color: Colors.textSecondary,
        border: `1px solid ${Colors.dividerLight}`,
      }}
    >
      {label}
    </span>
  )
}
