import { Colors } from '@/lib/colors'
import { groupHappyHourDealsForDisplay } from '@/lib/happyHourDeals'
import type { HappyHourDeal } from '@/types/supabase'

export function HappyHourDeals({ deals }: { deals: HappyHourDeal[] }) {
  const items = groupHappyHourDealsForDisplay(deals)
  if (items.length === 0) return null

  return (
    <section className="relative left-1/2 mb-14 w-screen -translate-x-1/2 overflow-hidden py-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 85% 65% at 12% 15%, rgba(248, 199, 1, 0.16) 0%, transparent 55%),
              radial-gradient(ellipse 70% 55% at 92% 88%, rgba(93, 37, 37, 0.08) 0%, transparent 52%),
              linear-gradient(165deg, ${Colors.surface} 0%, ${Colors.background} 48%, ${Colors.surfaceLight} 100%)
            `,
          }}
        />
        <div className="hop-posh-noise opacity-60" />
        <div
          className="absolute -right-1/4 bottom-0 h-[45%] w-[55vw] rounded-full opacity-40 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${Colors.primary}14 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative z-[1] mx-auto max-w-4xl px-6 sm:px-10 lg:px-12">
        <h2
          className="mb-6 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
          style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Happy Hour &amp; Deals
        </h2>

        <ul className="flex max-w-2xl flex-col">
          {items.map((item) => (
            <li key={item.key} className="border-t py-4" style={{ borderColor: Colors.border }}>
              <p
                className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: Colors.primary, fontFamily: 'var(--font-be-vietnam-pro)' }}
              >
                {item.badge}
              </p>
              <p
                className="text-base font-bold uppercase tracking-wide"
                style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
              >
                {item.title}
              </p>
              {item.detail ? (
                <p
                  className="mt-1 text-sm"
                  style={{
                    color: Colors.textSecondary,
                    fontFamily: 'var(--font-be-vietnam-pro)',
                  }}
                >
                  {item.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
