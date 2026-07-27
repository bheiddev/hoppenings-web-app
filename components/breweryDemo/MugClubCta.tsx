import { Colors } from '@/lib/colors'

const BENEFITS = [
  'Custom 20 oz mug to keep at the brewery',
  'Member pricing on every pour',
  'Early access to limited releases & events',
]

export function MugClubCta() {
  return (
    <section className="mb-10">
      <div
        className="rounded-xl border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6"
        style={{
          backgroundColor: Colors.surface,
          borderColor: Colors.border,
        }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${Colors.primary}18` }}
          aria-hidden
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: Colors.primary }}>
            <path
              d="M5 4h11a1 1 0 011 1v2h1.5A2.5 2.5 0 0121 9.5v1A4.5 4.5 0 0116.5 15H16v3a2 2 0 01-2 2H7a2 2 0 01-2-2V5a1 1 0 011-1zm11 5v4h.5a2.5 2.5 0 002.5-2.5v-1A.5.5 0 0018.5 9H16zM7 6v12h7V6H7z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h2
            className="text-2xl sm:text-3xl font-bold uppercase tracking-wide mb-2"
            style={{ color: '#000000', fontFamily: 'var(--font-fjalla-one)' }}
          >
            Mug Club
          </h2>
          <p
            className="text-sm mb-3"
            style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            Join the Mash Mechanix Mug Club for $95/year and drink like a regular.
          </p>
          <ul className="space-y-1.5">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2 text-sm"
                style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: Colors.primary }} />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm uppercase tracking-wide transition-opacity hover:opacity-90 self-start sm:self-center"
          style={{
            backgroundColor: Colors.primary,
            color: Colors.onPrimary,
            fontFamily: 'var(--font-fjalla-one)',
          }}
        >
          Join Mug Club
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </section>
  )
}
