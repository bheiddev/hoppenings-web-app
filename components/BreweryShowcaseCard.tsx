'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Colors } from '@/lib/colors'
import { BreweryCardContext } from '@/lib/breweryCardContext'
import {
  BREWERY_EVENT_ICON_SRC,
  getBreweryHoursStatusLabel,
  isBreweryOpenIconStatus,
} from '@/lib/breweryCardStatus'
import { BreweryCardDistance } from '@/components/BreweryCardDistance'

const ICON_SIZE = 32
const ICON_INACTIVE = '#000000'

function CardDetailIcon({ src, active }: { src: string; active: boolean }) {
  return (
    <span
      className="shrink-0 inline-block"
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: active ? Colors.primary : ICON_INACTIVE,
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

function DetailCell({
  src,
  alt,
  label,
  active,
}: {
  src: string
  alt: string
  label: string
  active: boolean
}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <CardDetailIcon src={src} active={active} />
      <span
        className="text-sm font-bold leading-snug line-clamp-2 pt-1 min-w-0"
        style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        aria-label={alt}
      >
        {label}
      </span>
    </div>
  )
}

export function BreweryCardDetails({ context }: { context: BreweryCardContext }) {
  const hoursLabel = getBreweryHoursStatusLabel(context.hoursStatus)
  const hoursIcon = isBreweryOpenIconStatus(context.hoursStatus) ? '/open.svg' : '/closed-sign.svg'
  const isOpen = isBreweryOpenIconStatus(context.hoursStatus)
  const hasBeer = Boolean(context.hasNewRelease && context.releaseName)
  const hasEvent = Boolean(context.todayEventTitle)
  const hasFoodTruck = context.hasFoodTruckToday

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 pb-5">
      <DetailCell
        src="/beer.svg"
        alt="Beer release"
        label={hasBeer ? context.releaseName!.toUpperCase() : ''}
        active={hasBeer}
      />

      <DetailCell src={hoursIcon} alt={hoursLabel} label={hoursLabel} active={isOpen} />

      <DetailCell
        src={BREWERY_EVENT_ICON_SRC[context.todayEventIcon]}
        alt="Today's event"
        label={context.todayEventTitle ?? 'No events today'}
        active={hasEvent}
      />

      <DetailCell
        src="/food-truck.svg"
        alt="Food truck"
        label={hasFoodTruck ? (context.foodTruckName ?? 'Food truck') : ''}
        active={hasFoodTruck}
      />
    </div>
  )
}

type BreweryShowcaseCardProps = {
  href: string
  breweryName: string
  imageUrl: string | null
  latitude?: number | null
  longitude?: number | null
  context: BreweryCardContext
  className?: string
}

export function BreweryShowcaseCard({
  href,
  breweryName,
  imageUrl,
  latitude,
  longitude,
  context,
  className = '',
}: BreweryShowcaseCardProps) {
  return (
    <Link
      href={href}
      className={`block h-full rounded-lg overflow-hidden shadow-sm transition-opacity hover:opacity-90 ${className}`}
      style={{ backgroundColor: Colors.surfaceMedium }}
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <h3
          className="text-lg font-bold truncate flex-1 min-w-0"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {breweryName}
        </h3>
        <BreweryCardDistance latitude={latitude} longitude={longitude} />
      </div>

      <div
        className="relative w-full aspect-[4/3] mx-4 mb-4 rounded-md overflow-hidden"
        style={{ backgroundColor: Colors.backgroundMedium, width: 'calc(100% - 2rem)' }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={breweryName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : null}
      </div>

      <BreweryCardDetails context={context} />
    </Link>
  )
}
