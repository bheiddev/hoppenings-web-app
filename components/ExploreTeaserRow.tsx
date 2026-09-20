import Image from 'next/image'
import Link from 'next/link'
import { Colors } from '@/lib/colors'

export type ExploreTeaserBreweryStatus = {
  hoursOpen: boolean
  hoursLabel: string
  releaseName?: string | null
  eventTitle?: string | null
  eventIconSrc?: string | null
}

export type ExploreTeaserItem = {
  id: string
  title: string
  subtitle?: string
  meta?: string
  description?: string
  href: string
  imageUrl?: string | null
  /** When set, show open/release/event highlights like the region breweries list. */
  breweryStatus?: ExploreTeaserBreweryStatus
}

const STATUS_ICON_SIZE = 16
const HOURS_ICON_SIZE = 22

function StatusIcon({ src, active }: { src: string; active: boolean }) {
  return (
    <span
      className="shrink-0"
      style={{
        width: STATUS_ICON_SIZE,
        height: STATUS_ICON_SIZE,
        backgroundColor: active ? Colors.accent : 'rgba(249, 247, 242, 0.45)',
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

function BreweryStatusBlock({ status }: { status: ExploreTeaserBreweryStatus }) {
  const hasRelease = Boolean(status.releaseName)
  const hasEvent = Boolean(status.eventTitle)
  if (!hasRelease && !hasEvent) return null

  return (
    <span className="mt-2 flex flex-col gap-1.5">
      {hasRelease ? (
        <span className="flex min-w-0 items-center gap-2">
          <StatusIcon src="/beer.svg" active />
          <span
            className="truncate text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            title={status.releaseName ?? undefined}
          >
            {status.releaseName}
          </span>
        </span>
      ) : null}

      {hasEvent ? (
        <span className="flex min-w-0 items-center gap-2">
          <StatusIcon src={status.eventIconSrc || '/event.svg'} active />
          <span
            className="truncate text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            title={status.eventTitle ?? undefined}
          >
            {status.eventTitle}
          </span>
        </span>
      ) : null}
    </span>
  )
}

/** Shared list row used on region hub teasers and full city list pages. */
export function ExploreTeaserRow({ item }: { item: ExploreTeaserItem }) {
  return (
    <Link
      href={item.href}
      className="group flex items-start gap-4 border-t border-white/10 py-4 transition-colors hover:border-white/25"
    >
      {item.imageUrl ? (
        <span className="relative mt-0.5 h-20 w-32 shrink-0 overflow-hidden sm:h-24 sm:w-40">
          <Image
            src={item.imageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="160px"
          />
        </span>
      ) : (
        <span
          className="mt-0.5 flex h-20 w-32 shrink-0 items-center justify-center sm:h-24 sm:w-40"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span
            className="min-w-0 truncate text-lg font-bold uppercase tracking-wide sm:text-xl"
            style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            {item.title}
          </span>
          {item.breweryStatus ? (
            <span
              className="relative mt-0.5 shrink-0"
              style={{ width: HOURS_ICON_SIZE, height: HOURS_ICON_SIZE }}
              title={item.breweryStatus.hoursLabel}
              aria-label={item.breweryStatus.hoursLabel}
            >
              <Image
                src={item.breweryStatus.hoursOpen ? '/open.svg' : '/closed-sign.svg'}
                alt=""
                fill
                className="object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
                aria-hidden
              />
            </span>
          ) : null}
        </span>
        {item.subtitle ? (
          <span
            className="mt-0.5 block truncate text-sm"
            style={{
              color: 'rgba(249, 247, 242, 0.72)',
              fontFamily: 'var(--font-be-vietnam-pro)',
            }}
          >
            {item.subtitle}
          </span>
        ) : null}
        {item.description ? (
          <span
            className="mt-1.5 block text-sm leading-snug line-clamp-2"
            style={{
              color: 'rgba(249, 247, 242, 0.62)',
              fontFamily: 'var(--font-be-vietnam-pro)',
            }}
          >
            {item.description}
          </span>
        ) : null}
        {item.breweryStatus ? (
          <BreweryStatusBlock status={item.breweryStatus} />
        ) : item.meta ? (
          <span
            className="mt-1.5 block text-xs uppercase tracking-[0.14em]"
            style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            {item.meta}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
