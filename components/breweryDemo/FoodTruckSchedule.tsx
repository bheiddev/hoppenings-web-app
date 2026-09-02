import { Colors } from '@/lib/colors'
import { foodTrucksForDisplay } from '@/lib/foodTrucks'
import type { FoodTruck } from '@/types/supabase'

export function FoodTruckSchedule({ trucks }: { trucks: FoodTruck[] }) {
  const items = foodTrucksForDisplay(trucks)
  if (items.length === 0) return null

  return (
    <section className="mb-14">
      <h2
        className="mb-6 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
        style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
      >
        Food Truck Schedule
      </h2>

      <ul className="flex max-w-2xl flex-col">
        {items.map((item) => (
          <li key={item.key} className="border-t border-white/10 py-4">
            <p
              className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              {item.badge}
            </p>
            <p
              className="text-base font-bold uppercase tracking-wide"
              style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
            >
              {item.title}
            </p>
            {item.detail ? (
              <p
                className="mt-1 text-sm"
                style={{
                  color: 'rgba(249, 247, 242, 0.65)',
                  fontFamily: 'var(--font-be-vietnam-pro)',
                }}
              >
                {item.detail}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
