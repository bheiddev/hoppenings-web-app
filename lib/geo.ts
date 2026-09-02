const EARTH_RADIUS_MILES = 3958.8

export function milesBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatMilesAway(miles: number): string {
  if (miles < 0.1) return '< 0.1 mi away'
  if (miles < 10) return `${miles.toFixed(1)} mi away`
  return `${Math.round(miles)} mi away`
}

export type GeoPoint = {
  latitude: number
  longitude: number
}

export type NearbyCandidate<T extends GeoPoint> = T & {
  miles: number
}

/** Nearest points within `maxMiles`, sorted closest-first, capped by `limit`. */
export function findNearbyPoints<T extends GeoPoint>(
  origin: GeoPoint,
  candidates: T[],
  options: { maxMiles?: number; limit?: number } = {}
): NearbyCandidate<T>[] {
  const maxMiles = options.maxMiles ?? 20
  const limit = options.limit ?? 12

  return candidates
    .map((candidate) => ({
      ...candidate,
      miles: milesBetween(
        origin.latitude,
        origin.longitude,
        candidate.latitude,
        candidate.longitude
      ),
    }))
    .filter((candidate) => candidate.miles <= maxMiles)
    .sort((a, b) => a.miles - b.miles)
    .slice(0, limit)
}
