import { Colors } from '@/lib/colors'

const HAPPY_HOUR = {
  title: 'Happy Hour',
  when: 'Mon–Fri · 3–6 PM',
  items: [
    { label: '$1 off all pints', detail: 'House beers only' },
    { label: '$5 select cans', detail: 'Rotating fridge picks' },
    { label: 'Half-off appetizers', detail: 'With a beer purchase' },
  ],
}

const DEALS = [
  {
    badge: 'Weekly',
    title: 'Trivia Tuesdays',
    detail: '$3 off flights during trivia · starts 6:30 PM',
  },
  {
    badge: 'Weekend',
    title: 'Saturday Flight Deal',
    detail: '4×5 oz pours for $12 · noon to close',
  },
  {
    badge: 'Special',
    title: 'Mug Club Monday',
    detail: 'Members get a free 5 oz pour of the weekly special',
  },
  {
    badge: 'Limited',
    title: 'Barrel-Aged Drop',
    detail: 'Buy a bottle, get a complimentary tasting pour',
  },
]

export function HappyHourDeals() {
  return (
    <section className="mb-10">
      <h2
        className="text-2xl sm:text-3xl font-bold uppercase tracking-wide mb-5"
        style={{ color: '#000000', fontFamily: 'var(--font-fjalla-one)' }}
      >
        Happy Hour &amp; Deals
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${Colors.accent}33` }}
              aria-hidden
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: Colors.info }}>
                <path
                  d="M12 2a1 1 0 011 1v1.07A8.001 8.001 0 0120 12c0 4.42-3.58 8-8 8s-8-3.58-8-8a8.001 8.001 0 017-7.93V3a1 1 0 011-1zm0 5a5 5 0 100 10 5 5 0 000-10zm1 2v3.59l2.3 2.3-1.42 1.41L11 13.41V9h2z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h3
                className="text-xl font-bold uppercase tracking-wide"
                style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                {HAPPY_HOUR.title}
              </h3>
              <p
                className="text-sm font-semibold"
                style={{ color: Colors.primary, fontFamily: 'var(--font-be-vietnam-pro)' }}
              >
                {HAPPY_HOUR.when}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {HAPPY_HOUR.items.map((item) => (
              <li
                key={item.label}
                className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
                style={{ borderColor: Colors.divider }}
              >
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: Colors.textDark, fontFamily: 'var(--font-be-vietnam-pro)' }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}
                  >
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${Colors.primary}18` }}
              aria-hidden
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: Colors.primary }}>
                <path
                  d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.41l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.83zM5.5 7A1.5 1.5 0 117 5.5 1.5 1.5 0 015.5 7z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3
              className="text-xl font-bold uppercase tracking-wide"
              style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
            >
              Deals &amp; Specials
            </h3>
          </div>

          <ul className="space-y-3">
            {DEALS.map((deal) => (
              <li
                key={deal.title}
                className="flex items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                style={{ borderColor: Colors.divider }}
              >
                <span
                  className="shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.primary,
                    fontFamily: 'var(--font-be-vietnam-pro)',
                  }}
                >
                  {deal.badge}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: Colors.textDark, fontFamily: 'var(--font-be-vietnam-pro)' }}
                  >
                    {deal.title}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}
                  >
                    {deal.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
