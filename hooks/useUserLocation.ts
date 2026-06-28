'use client'

import { useEffect, useState } from 'react'

type Coords = { latitude: number; longitude: number }

let cachedCoords: Coords | null = null
let pendingRequest: Promise<Coords | null> | null = null

function requestUserLocation(): Promise<Coords | null> {
  if (cachedCoords) return Promise.resolve(cachedCoords)
  if (pendingRequest) return pendingRequest

  pendingRequest = new Promise<Coords | null>((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        cachedCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        resolve(cachedCoords)
      },
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10000 }
    )
  }).finally(() => {
    pendingRequest = null
  })

  return pendingRequest
}

export function useUserLocation(): Coords | null {
  const [coords, setCoords] = useState<Coords | null>(cachedCoords)

  useEffect(() => {
    let active = true
    requestUserLocation().then((result) => {
      if (active && result) setCoords(result)
    })
    return () => {
      active = false
    }
  }, [])

  return coords
}
