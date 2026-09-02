'use client'

import { Colors } from '@/lib/colors'
import { NearbyBreweriesMap, type NearbyBreweryPin } from '@/components/NearbyBreweriesMap'

export function NearbyBreweriesMapSection({ pins }: { pins: NearbyBreweryPin[] }) {
  if (pins.length === 0) return null

  const nearbyCount = pins.filter((pin) => !pin.isCurrent).length

  return (
    <section className="mb-14">
      <h2
        className="mb-6 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
        style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
      >
        Nearby Breweries
      </h2>
      <p
        className="mb-5 max-w-xl text-sm leading-relaxed sm:text-base"
        style={{ color: 'rgba(249, 247, 242, 0.7)', fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        {nearbyCount > 0
          ? `Taprooms close by — gold pin is this brewery, maroon pins are neighbors within about 20 miles.`
          : `This brewery on the map. More nearby spots will show up as we add coordinates.`}
      </p>
      <div className="overflow-hidden border border-white/10">
        <NearbyBreweriesMap pins={pins} />
      </div>
    </section>
  )
}
