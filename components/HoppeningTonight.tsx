import Link from 'next/link'
import { Colors } from '@/lib/colors'
import {
  BREWERY_EVENT_ICON_SRC,
  BreweryEventIcon,
} from '@/lib/breweryCardStatus'

export type HoppeningTonightRelease = {
  name: string
  detail: string | null
  href: string | null
} | null

export type HoppeningTonightEvent = {
  title: string
  detail: string | null
  icon: BreweryEventIcon
  href: string | null
} | null

export type HoppeningTonightFood = {
  active: boolean
  label: string
  detail: string | null
}

type HoppeningTonightProps = {
  release: HoppeningTonightRelease
  event: HoppeningTonightEvent
  food: HoppeningTonightFood
}

const ICON_COLORS = {
  release: '#2D5A27',
  event: '#7C4D90',
  food: '#D47C1E',
  inactive: '#9A9188',
} as const

function MaskIcon({
  src,
  color,
  size = 28,
}: {
  src: string
  color: string
  size?: number
}) {
  return (
    <span
      className="block"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
      aria-hidden
    />
  )
}

function TonightCard({
  eyebrow,
  title,
  detail,
  iconSrc,
  iconColor,
  href,
  active,
}: {
  eyebrow: string
  title: string
  detail: string | null
  iconSrc: string
  iconColor: string
  href: string | null
  active: boolean
}) {
  const content = (
    <>
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: active ? `${iconColor}22` : Colors.surfaceLight }}
      >
        <MaskIcon src={iconSrc} color={active ? iconColor : ICON_COLORS.inactive} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-1"
          style={{
            color: active ? iconColor : Colors.textSecondary,
            fontFamily: 'var(--font-be-vietnam-pro)',
          }}
        >
          {eyebrow}
        </p>
        <p
          className="text-lg font-bold leading-snug line-clamp-2"
          style={{
            color: active ? Colors.textDark : Colors.textSecondary,
            fontFamily: 'var(--font-fjalla-one)',
          }}
        >
          {title}
        </p>
        {detail && (
          <p
            className="text-sm mt-1 line-clamp-1"
            style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            {detail}
          </p>
        )}
      </div>
    </>
  )

  const className =
    'flex items-start gap-4 rounded-xl border p-5 h-full transition-opacity'
  const style = {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  }

  if (href && active) {
    return (
      <Link href={href} className={`${className} hover:opacity-90`} style={style}>
        {content}
      </Link>
    )
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  )
}

export function HoppeningTonight({ release, event, food }: HoppeningTonightProps) {
  return (
    <section className="mb-10">
      <h2
        className="text-2xl sm:text-3xl font-bold uppercase tracking-wide mb-5"
        style={{ color: '#000000', fontFamily: 'var(--font-fjalla-one)' }}
      >
        Hoppening Tonight
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TonightCard
          eyebrow="On Tap / New"
          title={release?.name ?? 'No new release'}
          detail={release?.detail ?? null}
          iconSrc="/beer.svg"
          iconColor={ICON_COLORS.release}
          href={release?.href ?? null}
          active={Boolean(release)}
        />

        <TonightCard
          eyebrow="Event"
          title={event?.title ?? 'No events tonight'}
          detail={event?.detail ?? null}
          iconSrc={BREWERY_EVENT_ICON_SRC[event?.icon ?? 'generic']}
          iconColor={ICON_COLORS.event}
          href={event?.href ?? null}
          active={Boolean(event)}
        />

        <TonightCard
          eyebrow="Food"
          title={food.label}
          detail={food.detail}
          iconSrc="/food-truck.svg"
          iconColor={ICON_COLORS.food}
          href={null}
          active={food.active}
        />
      </div>
    </section>
  )
}
