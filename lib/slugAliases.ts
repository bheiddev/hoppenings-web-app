/**
 * Old location tokens that appeared in public URLs before neighborhood slugs were
 * shortened (east-cos → east, old-colorado-city → occ, …). Used only for *resolution*
 * so Google’s old URLs 301 to the current canonical — not for generating new slugs.
 */

/** old segment → current segment(s) to try when looking up a URL */
export const LOCATION_SLUG_ALIASES: Record<string, string[]> = {
  'east-cos': ['east'],
  'north-cos': ['north'],
  'south-cos': ['south'],
  'west-cos': ['west'],
  'old-colorado-city': ['occ'],
  'lincoln-cen-lincoln-center': ['lincoln-cen-north', 'lincoln-cen'],
  'lincoln-center': ['lincoln-cen-north', 'lincoln-cen'],
  'tutt-north-cos': ['tutt-east', 'tutt'],
  'tutt-north': ['tutt-east', 'tutt'],
  'route-24': ['occ'],
  'east-colorado-springs': ['east'],
  'north-colorado-springs': ['north'],
  'downtown-cos': ['downtown'],
  'north-downtown-cos': ['north-downtown'],
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Replace `from` as a hyphen-bounded slug segment. */
function replaceSegment(slug: string, from: string, to: string): string {
  return slug.replace(new RegExp(`(^|-)${escapeRe(from)}(?=-|$)`, 'g'), `$1${to}`)
}

function hasSegment(slug: string, segment: string): boolean {
  return new RegExp(`(^|-)${escapeRe(segment)}(?=-|$)`).test(slug)
}

/** Longest old tokens first so `tutt-north-cos` wins over `north-cos`. */
const ALIAS_ENTRIES = Object.entries(LOCATION_SLUG_ALIASES).sort(
  (a, b) => b[0].length - a[0].length
)

/** Request-time: rewrite old location tokens → current forms. */
export function expandLocationSlugAliasesForward(slug: string): string[] {
  const out = new Set<string>([slug])
  let changed = true
  while (changed) {
    changed = false
    for (const s of [...out]) {
      for (const [from, tos] of ALIAS_ENTRIES) {
        if (!hasSegment(s, from)) continue
        for (const to of tos) {
          const next = replaceSegment(s, from, to)
          if (!out.has(next)) {
            out.add(next)
            changed = true
          }
        }
      }
    }
  }
  return [...out]
}

/**
 * Index-time: from a current canonical slug, also register the old tokens Google
 * may still request (east → also east-cos).
 */
export function expandLocationSlugAliasesReverse(slug: string): string[] {
  const out = new Set<string>([slug])
  for (const s of [slug]) {
    for (const [from, tos] of ALIAS_ENTRIES) {
      for (const to of tos) {
        if (!to || !hasSegment(s, to)) continue
        // Don't reverse a short token that is only a prefix of a longer current segment
        // already present (e.g. leave `lincoln-cen-north` alone when matching `north`).
        const longerCurrent = tos.some(
          (other) => other !== to && other.length > to.length && hasSegment(s, other)
        )
        if (longerCurrent) continue
        out.add(replaceSegment(s, to, from))
      }
    }
  }
  return [...out]
}

/** All keys to register for a stored canonical/legacy slug. */
export function slugIndexKeys(slug: string): string[] {
  const keys = new Set<string>()
  for (const forward of expandLocationSlugAliasesForward(slug)) {
    keys.add(forward)
    for (const reverse of expandLocationSlugAliasesReverse(forward)) keys.add(reverse)
  }
  for (const reverse of expandLocationSlugAliasesReverse(slug)) {
    keys.add(reverse)
    for (const forward of expandLocationSlugAliasesForward(reverse)) keys.add(forward)
  }
  return [...keys]
}

/** Trailing 8-char hex from legacy brewery/release slugs (`…-e38a1fd4`). */
export function extractLegacyIdSuffix(slug: string): string | null {
  const m = slug.match(/-([a-f0-9]{8})$/i)
  return m?.[1]?.toLowerCase() ?? null
}

export function idMatchesLegacySuffix(id: string, suffix: string): boolean {
  const tail = (String(id).split('-').pop() || '').toLowerCase()
  return (
    tail.startsWith(suffix.toLowerCase()) ||
    String(id).toLowerCase().includes(suffix.toLowerCase())
  )
}

/** Look up in a map, trying forward location-alias variants of the request slug. */
export function mapGetWithSlugAliases<T>(map: Map<string, T>, slug: string): T | null {
  for (const variant of expandLocationSlugAliasesForward(slug)) {
    const hit = map.get(variant)
    if (hit) return hit
  }
  // Exact key may already be an old form registered via reverse indexing.
  return map.get(slug) ?? null
}

/** @deprecated Prefer expandLocationSlugAliasesForward / slugIndexKeys */
export function expandLocationSlugAliases(slug: string): string[] {
  return expandLocationSlugAliasesForward(slug)
}
