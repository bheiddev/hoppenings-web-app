import type { BeerRelease } from '@/types/supabase'
import {
  addDaysToDateString,
  getTodayMountainDateString,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'

/** Same 4 buckets + Other as the mobile Releases screen. */
export const RELEASE_CATEGORY_LABELS = [
  'Hoppy & Bitter',
  'Light & Crisp',
  'Malty & Dark',
  'Funky, Tart & Specialty',
  'Other',
] as const

export type ReleaseCategoryLabel = (typeof RELEASE_CATEGORY_LABELS)[number]

const HOPPY_BITTER_TYPES = ['pale ale', 'ipa']
const LIGHT_CRISP_TYPES = ['lager', 'pilsner', 'wheat', 'blonde']
const MALTY_DARK_TYPES = ['amber', 'porter', 'stout']
const FUNKY_TART_SPECIALTY_TYPES = ['sour', 'belgian', 'specialty', 'speciality', 'saison']

export function releaseDateYmd(releaseDate: string | null | undefined): string | null {
  if (!releaseDate?.trim()) return null
  return normalizeEventDateToMountainTime(releaseDate.trim())
}

export function getCategoryForReleaseType(type: string | null | undefined): ReleaseCategoryLabel {
  const t = (type || '').toLowerCase().trim()
  if (!t) return 'Other'
  if (HOPPY_BITTER_TYPES.includes(t)) return 'Hoppy & Bitter'
  if (LIGHT_CRISP_TYPES.includes(t)) return 'Light & Crisp'
  if (MALTY_DARK_TYPES.includes(t)) return 'Malty & Dark'
  if (FUNKY_TART_SPECIALTY_TYPES.includes(t)) return 'Funky, Tart & Specialty'
  return 'Other'
}

function compareBreweryThenBeer(a: BeerRelease, b: BeerRelease): number {
  const brewery = (a.breweries?.name ?? '').localeCompare(b.breweries?.name ?? '')
  if (brewery !== 0) return brewery
  return a.beer_name.localeCompare(b.beer_name)
}

export type ReleaseListSection<T extends BeerRelease = BeerRelease> = {
  id: string
  /** Just Dropped still has a label for web; callers may hide the heading. */
  title: string | null
  releases: T[]
}

/**
 * Split releases like the mobile Releases screen:
 * Just Dropped (today back through today-2) → Coming Soon (after today) → type categories.
 */
export function splitReleasesForDisplay<T extends BeerRelease>(
  releases: T[],
  todayYmd = getTodayMountainDateString()
): ReleaseListSection<T>[] {
  const windowStartYmd = addDaysToDateString(todayYmd, -2)

  const justDropped = releases
    .filter((release) => {
      const ymd = releaseDateYmd(release.release_date)
      return !!ymd && ymd >= windowStartYmd && ymd <= todayYmd
    })
    .sort((a, b) => {
      const date = (releaseDateYmd(b.release_date) ?? '').localeCompare(
        releaseDateYmd(a.release_date) ?? ''
      )
      if (date !== 0) return date
      return compareBreweryThenBeer(a, b)
    })

  const justDroppedIds = new Set(justDropped.map((r) => r.id))
  const notJustDropped = releases.filter((r) => !justDroppedIds.has(r.id))

  const comingSoon = notJustDropped
    .filter((release) => {
      const ymd = releaseDateYmd(release.release_date)
      return !!ymd && ymd > todayYmd
    })
    .sort((a, b) => {
      const date = (releaseDateYmd(a.release_date) ?? '').localeCompare(
        releaseDateYmd(b.release_date) ?? ''
      )
      if (date !== 0) return date
      return compareBreweryThenBeer(a, b)
    })

  const comingSoonIds = new Set(comingSoon.map((r) => r.id))
  const remaining = notJustDropped.filter((r) => !comingSoonIds.has(r.id))

  const byCategory = new Map<ReleaseCategoryLabel, T[]>()
  for (const release of remaining) {
    const category = getCategoryForReleaseType(release.Type)
    const list = byCategory.get(category) ?? []
    list.push(release)
    byCategory.set(category, list)
  }

  for (const list of byCategory.values()) {
    list.sort((a, b) => {
      const date = (releaseDateYmd(b.release_date) ?? '').localeCompare(
        releaseDateYmd(a.release_date) ?? ''
      )
      if (date !== 0) return date
      return compareBreweryThenBeer(a, b)
    })
  }

  const sections: ReleaseListSection<T>[] = []
  if (justDropped.length > 0) {
    sections.push({ id: 'just-dropped', title: 'Just Dropped', releases: justDropped })
  }
  if (comingSoon.length > 0) {
    sections.push({ id: 'coming-soon', title: 'Coming Soon', releases: comingSoon })
  }
  for (const label of RELEASE_CATEGORY_LABELS) {
    const list = byCategory.get(label)
    if (list?.length) {
      sections.push({ id: `type-${label}`, title: label, releases: list })
    }
  }
  return sections
}

/** Flat order used for teasers / “latest” picks: Just Dropped, Coming Soon, then types. */
export function flattenReleaseSections<T extends BeerRelease>(
  sections: ReleaseListSection<T>[]
): T[] {
  return sections.flatMap((section) => section.releases)
}
