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
  href?: string | null
}

type HoppeningTonightProps = {
  release: HoppeningTonightRelease
  event: HoppeningTonightEvent
  food: HoppeningTonightFood
}

const ICON_COLORS = {
  release: Colors.accent,
  event: Colors.accent,
  food: Colors.accent,
  inactive: 'rgba(249, 247, 242, 0.35)',
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
        className="flex h-14 w-14 shrink-0 items-center justify-center"
        style={{ backgroundColor: active ? 'rgba(248, 199, 1, 0.12)' : 'rgba(255,255,255,0.06)' }}
      >
        <MaskIcon src={iconSrc} color={active ? iconColor : ICON_COLORS.inactive} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="mb-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            color: active ? Colors.accent : 'rgba(249, 247, 242, 0.45)',
            fontFamily: 'var(--font-be-vietnam-pro)',
          }}
        >
          {eyebrow}
        </p>
        <p
          className="line-clamp-2 text-lg font-bold leading-snug"
          style={{
            color: active ? Colors.textOnDark : 'rgba(249, 247, 242, 0.45)',
            fontFamily: 'var(--font-fjalla-one)',
          }}
        >
          {title}
        </p>
        {detail && (
          <p
            className="mt-1 line-clamp-1 text-sm"
            style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            {detail}
          </p>
        )}
      </div>
    </>
  )

  const className = 'flex h-full items-start gap-4 border border-white/10 p-5 transition-colors'
  const style = { backgroundColor: 'rgba(255,255,255,0.04)' }

  if (href && active) {
    const isExternal = /^https?:\/\//.test(href)
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${className} hover:border-white/25`}
          style={style}
        >
          {content}
        </a>
      )
    }
    return (
      <Link href={href} className={`${className} hover:border-white/25`} style={style}>
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
    <section className="mb-12">
      <h2
        className="mb-5 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
        style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
      >
        Hoppening Tonight
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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
          href={food.href ?? null}
          active={food.active}
        />
      </div>
    </section>
  )
}
