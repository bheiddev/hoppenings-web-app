import Image from 'next/image'
import Link from 'next/link'
import { Colors } from '@/lib/colors'

export type ExploreTeaserBreweryStatus = {
  hoursOpen: boolean
  hoursLabel: string
  /** Live hours copy under the open/closed icon, e.g. "Closes in 2 hours". */
  hoursDetail?: string | null
  /** Today's open–close window (fallback). */
  hoursRange?: string | null
  releaseName?: string | null
  eventTitle?: string | null
  eventIconSrc?: string | null
  happyHourTitle?: string | null
  happyHourActive?: boolean
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
const HOURS_ICON_SIZE = 36

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
  const hasHappyHour = Boolean(status.happyHourTitle)
  if (!hasRelease && !hasEvent && !hasHappyHour) return null

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

      {hasHappyHour ? (
        <span className="flex min-w-0 items-center gap-2">
          <StatusIcon src="/happy-hour.svg" active />
          <span
            className="truncate text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            title={status.happyHourTitle ?? undefined}
          >
            {status.happyHourTitle}
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
          <span className="min-w-0 flex-1">
            <span
              className="block truncate text-lg font-bold uppercase tracking-wide sm:text-xl"
              style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
            >
              {item.title}
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
          </span>
          {item.breweryStatus ? (
            <span className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
              <span
                className="relative"
                style={{ width: HOURS_ICON_SIZE, height: HOURS_ICON_SIZE }}
                title={item.breweryStatus.hoursDetail || item.breweryStatus.hoursLabel}
                aria-label={item.breweryStatus.hoursDetail || item.breweryStatus.hoursLabel}
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
              <span
                className="max-w-[7.5rem] text-right text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] sm:text-[11px]"
                style={{
                  color: item.breweryStatus.hoursOpen ? Colors.accent : 'rgba(249, 247, 242, 0.78)',
                  fontFamily: 'var(--font-be-vietnam-pro)',
                }}
              >
                {item.breweryStatus.hoursDetail ||
                  item.breweryStatus.hoursRange ||
                  item.breweryStatus.hoursLabel}
              </span>
              {item.breweryStatus.happyHourActive ? (
                <span
                  className="max-w-[7.5rem] text-right text-[10px] font-bold uppercase leading-tight tracking-[0.1em]"
                  style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                >
                  Happy Hour now
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
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
