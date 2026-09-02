'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  APIProvider,
  InfoWindow,
  Map,
  Marker,
  useApiIsLoaded,
  useMap,
} from '@vis.gl/react-google-maps'
import { Colors } from '@/lib/colors'
import { formatMilesAway } from '@/lib/geo'

export type NearbyBreweryPin = {
  id: string
  name: string
  slug: string
  latitude: number
  longitude: number
  location: string | null
  miles: number | null
  isCurrent: boolean
}

function buildPinIcon(isCurrent: boolean): google.maps.Icon {
  const fill = isCurrent ? Colors.accent : Colors.primary
  const size = isCurrent ? 34 : 28
  const height = Math.round(size * 1.375)
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 16 22" fill="none">
      <path fill="${fill}" d="M7.99989 0.5C3.85835 0.5 0.5 3.98812 0.5 8.2897C0.5 13.4039 5.62899 19.3371 7.40417 21.2379C7.73022 21.5874 8.26978 21.5874 8.59583 21.2379C10.3708 19.3381 15.5 13.4039 15.5 8.2897C15.5 3.98812 12.1414 0.5 7.99989 0.5ZM7.99989 11.7518C6.15931 11.7518 4.66661 10.2014 4.66661 8.2897C4.66661 6.37799 6.15931 4.82761 7.99989 4.82761C9.84048 4.82761 11.3332 6.37799 11.3332 8.2897C11.3332 10.2025 9.84048 11.7518 7.99989 11.7518Z"/>
    </svg>`
  )

  return {
    url: `data:image/svg+xml;charset=utf-8,${svg}`,
    scaledSize: new google.maps.Size(size, height),
    anchor: new google.maps.Point(size / 2, height),
  }
}

function FitPins({ pins }: { pins: NearbyBreweryPin[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || pins.length === 0) return

    if (pins.length === 1) {
      map.setCenter({ lat: pins[0].latitude, lng: pins[0].longitude })
      map.setZoom(13)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    for (const pin of pins) {
      bounds.extend({ lat: pin.latitude, lng: pin.longitude })
    }
    map.fitBounds(bounds, 40)
  }, [map, pins])

  return null
}

function NearbyBreweriesMapInner({ pins }: { pins: NearbyBreweryPin[] }) {
  const apiIsLoaded = useApiIsLoaded()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const center = useMemo(() => {
    const current = pins.find((pin) => pin.isCurrent) ?? pins[0]
    return { lat: current.latitude, lng: current.longitude }
  }, [pins])

  const currentIcon = useMemo(
    () => (apiIsLoaded ? buildPinIcon(true) : undefined),
    [apiIsLoaded]
  )
  const nearbyIcon = useMemo(
    () => (apiIsLoaded ? buildPinIcon(false) : undefined),
    [apiIsLoaded]
  )
  const selected = pins.find((pin) => pin.id === selectedId) ?? null

  return (
    <Map
      defaultCenter={center}
      defaultZoom={12}
      gestureHandling="cooperative"
      disableDefaultUI={false}
      mapTypeControl={false}
      streetViewControl={false}
      fullscreenControl={false}
      style={{ width: '100%', height: '100%', background: Colors.surfaceDark }}
      onClick={() => setSelectedId(null)}
    >
      <FitPins pins={pins} />
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={{ lat: pin.latitude, lng: pin.longitude }}
          icon={pin.isCurrent ? currentIcon : nearbyIcon}
          zIndex={pin.isCurrent ? 1000 : undefined}
          onClick={() => setSelectedId(pin.id)}
          title={pin.name}
        />
      ))}
      {selected ? (
        <InfoWindow
          position={{ lat: selected.latitude, lng: selected.longitude }}
          onCloseClick={() => setSelectedId(null)}
          maxWidth={240}
        >
          <div style={{ fontFamily: 'var(--font-be-vietnam-pro)', minWidth: 140, padding: 2 }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-fjalla-one)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: Colors.textPrimary,
              }}
            >
              {selected.name}
            </p>
            {selected.miles != null && !selected.isCurrent ? (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: Colors.textSecondary }}>
                {formatMilesAway(selected.miles)}
              </p>
            ) : selected.isCurrent ? (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: Colors.textSecondary }}>
                You are here
              </p>
            ) : null}
            {!selected.isCurrent ? (
              <Link
                href={`/breweries/${selected.slug}`}
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: Colors.primary,
                }}
              >
                View brewery
              </Link>
            ) : null}
          </div>
        </InfoWindow>
      ) : null}
    </Map>
  )
}

export function NearbyBreweriesMap({ pins }: { pins: NearbyBreweryPin[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (pins.length === 0) return null

  if (!apiKey) {
    return (
      <div
        className="flex h-[320px] w-full items-center justify-center px-6 text-center sm:h-[380px]"
        style={{ backgroundColor: Colors.surfaceDark, color: 'rgba(249,247,242,0.65)' }}
      >
        <p className="text-sm" style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}>
          Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
        </p>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[320px] w-full sm:h-[380px]">
        <NearbyBreweriesMapInner pins={pins} />
      </div>
    </APIProvider>
  )
}
