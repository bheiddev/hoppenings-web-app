'use client'

import Image from 'next/image'
import Link from 'next/link'

export type PoshBreweryImage = {
  src: string
  alt: string
  href: string
}

type PoshBreweryCarouselProps = {
  images: PoshBreweryImage[]
}

function buildLoop(images: PoshBreweryImage[], minTiles = 8): PoshBreweryImage[] {
  if (images.length === 0) return []
  const tiles: PoshBreweryImage[] = []
  while (tiles.length < minTiles) {
    tiles.push(...images)
  }
  // Exact duplicate for seamless -50% translate.
  return [...tiles, ...tiles]
}

/**
 * Dual-column vertical marquee of brewery photos for posh region landings.
 */
export function PoshBreweryCarousel({ images }: PoshBreweryCarouselProps) {
  if (images.length === 0) return null

  const offset = Math.floor(images.length / 2)
  const rotated = [...images.slice(offset), ...images.slice(0, offset)]
  const columnA = buildLoop(images)
  const columnB = buildLoop(rotated.length > 0 ? rotated : images)

  return (
    <div className="relative h-full w-full" aria-hidden>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-24 bg-gradient-to-b from-[#3A1515] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-28 bg-gradient-to-t from-[#3A1515] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-16 bg-gradient-to-r from-[#3A1515]/95 to-transparent" />

      <div className="absolute inset-0 flex gap-3 overflow-hidden px-2 py-4 lg:gap-4 lg:pl-6 lg:pr-0">
        <MarqueeColumn images={columnA} durationSec={42} />
        <MarqueeColumn images={columnB} durationSec={54} reverse className="hidden sm:flex" />
      </div>
    </div>
  )
}

function MarqueeColumn({
  images,
  durationSec,
  reverse = false,
  className = '',
}: {
  images: PoshBreweryImage[]
  durationSec: number
  reverse?: boolean
  className?: string
}) {
  return (
    <div className={`relative flex flex-1 overflow-hidden ${className}`}>
      <div
        className={`hop-brewery-marquee flex w-full flex-col gap-3 lg:gap-4 ${
          reverse ? 'hop-brewery-marquee-reverse' : ''
        }`}
        style={{ animationDuration: `${durationSec}s` }}
      >
        {images.map((image, index) => (
          <Link
            key={`${image.href}-${index}`}
            href={image.href}
            className="group relative block aspect-[3/4] w-full overflow-hidden"
            tabIndex={-1}
          >
            <Image
              src={image.src}
              alt=""
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              sizes="(max-width: 1024px) 40vw, 22vw"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
            <span
              className="absolute bottom-3 left-3 right-3 text-sm font-bold uppercase tracking-wide text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ fontFamily: 'var(--font-fjalla-one)' }}
            >
              {image.alt}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** Compact horizontal scroll for small screens. */
export function PoshBreweryCarouselMobile({ images }: PoshBreweryCarouselProps) {
  if (images.length === 0) return null

  return (
    <div
      className="hop-home-fade hop-home-delay-2 -mx-6 mb-10 flex gap-3 overflow-x-auto px-6 pb-1 sm:-mx-10 sm:px-10 lg:hidden"
      style={{ scrollbarWidth: 'none' }}
      aria-label="Breweries in this region"
    >
      {images.slice(0, 8).map((image) => (
        <Link
          key={image.href}
          href={image.href}
          className="relative h-36 w-28 shrink-0 overflow-hidden sm:h-44 sm:w-32"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            sizes="128px"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </Link>
      ))}
    </div>
  )
}
