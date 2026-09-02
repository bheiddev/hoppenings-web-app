import Image from 'next/image'
import Link from 'next/link'
import { PoshEyebrow, PoshSectionTitle } from '@/components/PoshPageShell'
import { Colors } from '@/lib/colors'

export type OtherBreweryLocationProps = {
  name: string
  /** Neighborhood / site label (e.g. Downtown, Star Ranch Rd). */
  locationLabel: string | null
  address: string | null
  href: string
  imageUrl: string | null
  /** e.g. "Trivia Night · 6 PM" when an event is on today. */
  eventStatus?: string | null
  /** Matched event icon src from BREWERY_EVENT_ICON_SRC. */
  eventIconSrc?: string | null
  /** e.g. "Happy Hour now · 2–5 PM" when happy hour is today / soon. */
  happyHourStatus?: string | null
}

const STATUS_ICON_SIZE = 36

function StatusIcon({ src }: { src: string }) {
  return (
    <span
      className="block shrink-0"
      style={{
        width: STATUS_ICON_SIZE,
        height: STATUS_ICON_SIZE,
        backgroundColor: Colors.textOnDark,
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

function StatusRow({ iconSrc, label }: { iconSrc: string; label: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <StatusIcon src={iconSrc} />
      <span
        className="min-w-0 text-xs font-bold uppercase tracking-[0.08em] sm:text-sm"
        style={{ color: Colors.textOnDark, fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        {label}
      </span>
    </span>
  )
}

export function OtherBreweryLocation({
  name,
  locationLabel,
  address,
  href,
  imageUrl,
  eventStatus = null,
  eventIconSrc = null,
  happyHourStatus = null,
}: OtherBreweryLocationProps) {
  const heading = locationLabel?.trim() || name
  const eventLabel = eventStatus?.trim() || null
  const happyHourLabel = happyHourStatus?.trim() || null

  return (
    <section className="mb-14">
      <PoshEyebrow>Locations</PoshEyebrow>
      <PoshSectionTitle>See our other location</PoshSectionTitle>

      <Link
        href={href}
        className="group flex flex-col gap-5 border-t border-white/10 py-5 transition-opacity hover:opacity-85 sm:flex-row sm:items-start sm:gap-6"
      >
        {imageUrl ? (
          <span className="relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:w-56 md:w-64">
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, 256px"
              unoptimized
              aria-hidden
            />
          </span>
        ) : null}

        <span className="min-w-0 flex-1 pt-0.5">
          <span
            className="block text-lg font-bold uppercase tracking-wide sm:text-xl"
            style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            {heading}
          </span>
          {locationLabel?.trim() && locationLabel.trim() !== name ? (
            <span
              className="mt-1 block text-sm font-semibold"
              style={{
                color: 'rgba(249, 247, 242, 0.78)',
                fontFamily: 'var(--font-be-vietnam-pro)',
              }}
            >
              {name}
            </span>
          ) : null}
          {address?.trim() ? (
            <span
              className="mt-1.5 block text-sm leading-snug"
              style={{
                color: 'rgba(249, 247, 242, 0.62)',
                fontFamily: 'var(--font-be-vietnam-pro)',
              }}
            >
              {address.trim()}
            </span>
          ) : null}

          {eventLabel || happyHourLabel ? (
            <span className="mt-4 flex flex-col gap-2.5">
              {eventLabel ? (
                <StatusRow
                  iconSrc={eventIconSrc || '/event.svg'}
                  label={eventLabel}
                />
              ) : null}
              {happyHourLabel ? (
                <StatusRow iconSrc="/happy-hour.svg" label={happyHourLabel} />
              ) : null}
            </span>
          ) : null}

          <span
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em]"
            style={{
              color: Colors.primaryDark,
              backgroundColor: Colors.accent,
              fontFamily: 'var(--font-fjalla-one)',
              padding: '0.7rem 1.15rem',
            }}
          >
            View location
          </span>
        </span>
      </Link>
    </section>
  )
}
