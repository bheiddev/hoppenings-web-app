'use client'

import Image from 'next/image'
import { Colors } from '@/lib/colors'
import { formatMilesAway, milesBetween } from '@/lib/geo'
import { useUserLocation } from '@/hooks/useUserLocation'

export function BreweryCardDistance({
  latitude,
  longitude,
}: {
  latitude: number | null | undefined
  longitude: number | null | undefined
}) {
  const userLocation = useUserLocation()

  if (latitude == null || longitude == null || !userLocation) {
    return null
  }

  const miles = milesBetween(
    userLocation.latitude,
    userLocation.longitude,
    latitude,
    longitude
  )

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Image src="/PinIcon.svg" alt="" width={14} height={14} unoptimized aria-hidden />
      <span
        className="text-xs font-semibold whitespace-nowrap"
        style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        {formatMilesAway(miles)}
      </span>
    </div>
  )
}
