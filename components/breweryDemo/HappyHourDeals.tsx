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
    <section className="mb-14">
      <h2
        className="mb-6 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
        style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
      >
        Happy Hour &amp; Deals
      </h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <p
            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
            style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            {HAPPY_HOUR.when}
          </p>
          <h3
            className="mb-4 text-xl font-bold uppercase tracking-wide sm:text-2xl"
            style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            {HAPPY_HOUR.title}
          </h3>

          <ul className="flex flex-col">
            {HAPPY_HOUR.items.map((item) => (
              <li key={item.label} className="border-t border-white/10 py-4">
                <p
                  className="text-base font-bold uppercase tracking-wide"
                  style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  {item.label}
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{
                    color: 'rgba(249, 247, 242, 0.65)',
                    fontFamily: 'var(--font-be-vietnam-pro)',
                  }}
                >
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p
            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
            style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            This week
          </p>
          <h3
            className="mb-4 text-xl font-bold uppercase tracking-wide sm:text-2xl"
            style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Deals &amp; Specials
          </h3>

          <ul className="flex flex-col">
            {DEALS.map((deal) => (
              <li key={deal.title} className="border-t border-white/10 py-4">
                <p
                  className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                >
                  {deal.badge}
                </p>
                <p
                  className="text-base font-bold uppercase tracking-wide"
                  style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  {deal.title}
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{
                    color: 'rgba(249, 247, 242, 0.65)',
                    fontFamily: 'var(--font-be-vietnam-pro)',
                  }}
                >
                  {deal.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
