'use client'

import Link from 'next/link'
import { Colors } from '@/lib/colors'
import { CardCarousel } from '@/components/CardCarousel'
import { BreweryCardContext } from '@/lib/breweryCardContext'
import { BreweryShowcaseCard } from '@/components/BreweryShowcaseCard'

export type TodayBreweryCarouselItem = {
  id: string
  breweryName: string
  href: string
  imageUrl: string | null
  latitude?: number | null
  longitude?: number | null
  context: BreweryCardContext
}

export function TodayBreweriesCarousel({ items }: { items: TodayBreweryCarouselItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
        No brewery events listed for today. Check the full{' '}
        <Link href="/events" className="underline font-semibold" style={{ color: Colors.primary }}>
          events calendar
        </Link>
        .
      </p>
    )
  }

  return (
    <CardCarousel itemClassName="w-[min(85vw,300px)] sm:w-[320px]">
      {items.map((item) => (
        <BreweryShowcaseCard
          key={item.id}
          href={item.href}
          breweryName={item.breweryName}
          imageUrl={item.imageUrl}
          latitude={item.latitude}
          longitude={item.longitude}
          context={item.context}
        />
      ))}
    </CardCarousel>
  )
}
