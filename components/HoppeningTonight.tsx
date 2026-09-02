import Link from 'next/link'
import { Colors } from '@/lib/colors'
import {
  BREWERY_EVENT_ICON_SRC,
  BreweryEventIcon,
} from '@/lib/breweryCardStatus'

export type HoppeningTonightRelease = {
  name: string
  /** Style / ABV shown on the same row as the name. */
  meta: string | null
  description: string | null
  href: string | null
} | null

export type HoppeningTonightEvent = {
  title: string
  time: string | null
  description: string | null
  icon: BreweryEventIcon
  href: string | null
} | null

export type HoppeningTonightFood = {
  active: boolean
  label: string
  detail: string | null
  href?: string | null
}

type HoppeningTonightDeal = {
  key: string
  title: string
  /** Time window shown on the same row as the title. */
  window: string | null
  detail: string | null
}

type HoppeningTonightProps = {
  release: HoppeningTonightRelease
  event: HoppeningTonightEvent
  food: HoppeningTonightFood
  /** Today's happy hour / deal rows from the DB (exact objects). */
  deals?: HoppeningTonightDeal[]
}

const ICON_COLORS = {
  release: Colors.primary,
  event: Colors.primary,
  food: Colors.primary,
  deal: Colors.primary,
  inactive: 'rgba(45, 41, 38, 0.28)',
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
        WebkitMaskMode: 'alpha',
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskMode: 'alpha',
      }}
      aria-hidden
    />
  )
}

function TonightCard({
  title,
  meta,
  detail,
  detailClamp = 2,
  iconSrc,
  iconColor,
  href,
  active,
}: {
  title: string
  meta?: string | null
  detail: string | null
  /** null = no clamp (e.g. happy hour descriptions). */
  detailClamp?: number | null
  iconSrc: string
  iconColor: string
  href: string | null
  active: boolean
}) {
  const iconSize = 40
  const heading = meta ? `${title} ${meta}` : title
  // Happy hour / deal titles (with timing) should wrap fully, not clamp.
  const clampTitle = !meta

  const content = (
    <div className="min-w-0 flex-1">
      <div className={`flex gap-3 sm:gap-4 ${clampTitle ? 'items-center' : 'items-start'}`}>
        <span className="shrink-0">
          <MaskIcon
            src={iconSrc}
            color={active ? iconColor : ICON_COLORS.inactive}
            size={iconSize}
          />
        </span>
        <p
          className={`min-w-0 text-lg font-bold leading-snug sm:text-xl ${clampTitle ? 'line-clamp-2' : ''}`}
          style={{
            color: active ? Colors.textPrimary : 'rgba(45, 41, 38, 0.4)',
            fontFamily: 'var(--font-fjalla-one)',
          }}
        >
          {heading}
        </p>
      </div>
      {detail ? (
        <p
          className="mt-2 text-sm"
          style={{
            color: Colors.textSecondary,
            fontFamily: 'var(--font-be-vietnam-pro)',
            paddingLeft: `calc(${iconSize}px + 0.75rem)`,
            ...(detailClamp == null
              ? {}
              : {
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical' as const,
                  WebkitLineClamp: detailClamp,
                  overflow: 'hidden',
                }),
          }}
        >
          {detail}
        </p>
      ) : null}
    </div>
  )

  const className = 'block h-full p-5 transition-opacity'

  if (href && active) {
    const isExternal = /^https?:\/\//.test(href)
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${className} hover:opacity-85`}
        >
          {content}
        </a>
      )
    }
    return (
      <Link href={href} className={`${className} hover:opacity-85`}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

export function HoppeningTonight({ release, event, food, deals = [] }: HoppeningTonightProps) {
  const cards = [
    release
      ? {
          key: 'release',
          title: release.name,
          meta: release.meta,
          detail: release.description,
          detailClamp: 3 as number | null,
          iconSrc: '/beer.svg',
          iconColor: ICON_COLORS.release,
          href: release.href,
        }
      : null,
    event
      ? {
          key: 'event',
          title: event.title,
          meta: event.time,
          detail: event.description,
          detailClamp: 2 as number | null,
          iconSrc: BREWERY_EVENT_ICON_SRC[event.icon],
          iconColor: ICON_COLORS.event,
          href: event.href,
        }
      : null,
    food.active
      ? {
          key: 'food',
          title: food.label,
          meta: null as string | null,
          detail: food.detail,
          detailClamp: 2 as number | null,
          iconSrc: '/food-truck.svg',
          iconColor: ICON_COLORS.food,
          href: food.href ?? null,
        }
      : null,
    ...deals.map((deal) => ({
      key: deal.key,
      title: deal.title,
      meta: deal.window,
      detail: deal.detail,
      detailClamp: null as number | null,
      iconSrc: '/happy-hour.svg',
      iconColor: ICON_COLORS.deal,
      href: null as string | null,
    })),
  ].filter((card): card is NonNullable<typeof card> => card != null)

  if (cards.length === 0) return null

  const gridCols =
    cards.length === 1
      ? 'grid-cols-1'
      : cards.length === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : cards.length === 3
          ? 'grid-cols-1 sm:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <section className="relative mb-0 w-full overflow-hidden py-10 sm:py-12">
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
          className="mb-5 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
          style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Hoppening Tonight
        </h2>

        <div className={`grid gap-3 sm:gap-4 ${gridCols}`}>
          {cards.map((card) => (
            <TonightCard
              key={card.key}
              title={card.title}
              meta={card.meta}
              detail={card.detail}
              detailClamp={card.detailClamp}
              iconSrc={card.iconSrc}
              iconColor={card.iconColor}
              href={card.href}
              active
            />
          ))}
        </div>
      </div>
    </section>
  )
}
