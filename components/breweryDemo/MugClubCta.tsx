import { Colors } from '@/lib/colors'

const BENEFITS = [
  'Custom 20 oz mug to keep at the brewery',
  'Member pricing on every pour',
  'Early access to limited releases & events',
]

export function MugClubCta() {
  return (
    <section className="mb-14 border-t border-white/10 pt-12">
      <p
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
        style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        Members
      </p>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-xl flex-1">
          <h2
            className="mb-3 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
            style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Mug Club
          </h2>
          <p
            className="mb-5 text-base leading-relaxed"
            style={{ color: 'rgba(249, 247, 242, 0.75)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            Join the Mash Mechanix Mug Club for $95/year and drink like a regular.
          </p>
          <ul className="flex flex-col">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="border-t border-white/10 py-3">
                <p
                  className="text-sm"
                  style={{
                    color: 'rgba(249, 247, 242, 0.85)',
                    fontFamily: 'var(--font-be-vietnam-pro)',
                  }}
                >
                  {benefit}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 self-start text-sm font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-85 sm:self-end"
          style={{
            color: Colors.primaryDark,
            backgroundColor: Colors.accent,
            fontFamily: 'var(--font-fjalla-one)',
            padding: '0.7rem 1.15rem',
          }}
        >
          Join Mug Club
        </button>
      </div>
    </section>
  )
}
