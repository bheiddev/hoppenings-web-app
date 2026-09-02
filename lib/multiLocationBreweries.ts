/**
 * Hardcoded multi-location brewery pairs.
 * Replace with a DB field when sibling locations are modeled reliably.
 */
const MULTI_LOCATION_PAIRS: ReadonlyArray<readonly [string, string]> = [
  [
    '3fbe5036-c274-4fc7-96d5-af4a6cf66630', // Urban Animal — Downtown
    'cbe9715f-89f3-4360-8dc5-44e654ad6be5', // Urban Animal — Star Ranch Rd
  ],
]

/** Returns the sibling brewery id when this brewery is part of a hardcoded multi-location pair. */
export function getSiblingBreweryId(breweryId: string): string | null {
  for (const [a, b] of MULTI_LOCATION_PAIRS) {
    if (a === breweryId) return b
    if (b === breweryId) return a
  }
  return null
}
