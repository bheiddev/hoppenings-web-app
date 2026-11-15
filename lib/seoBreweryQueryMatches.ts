import type { SeoRow } from '@/lib/gsc'

export type SeoBreweryRef = {
  id: string
  name: string
  region: string | null
  latitude: number | null
  longitude: number | null
  slug: string
}

export type BreweryQueryMatch = {
  breweryId: string
  breweryName: string
  region: string | null
  slug: string
  latitude: number | null
  longitude: number | null
  queries: { query: string; clicks: number; impressions: number; score: number }[]
  clicks: number
  impressions: number
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function compact(value: string): string {
  return value.replace(/\s+/g, '')
}

/** Strip common brewery noise so "Red Leg Brewing" → "red leg". */
function breweryCoreName(name: string): string {
  return normalize(name)
    .replace(
      /\b(brewing|brewery|breweries|brewpub|brew|co|company|llc|inc|taproom|taprooms|tap|room|beer|craft|the|pubs?|house)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Rough relevance of a search query to a brewery name.
 * Higher is better; 0 = no useful match.
 */
export function scoreQueryAgainstBrewery(query: string, breweryName: string): number {
  const q = normalize(query)
  const qCompact = compact(q)
  const core = breweryCoreName(breweryName)
  if (!core || core.length < 3) return 0

  const coreCompact = compact(core)
  if (q.includes(core) || qCompact.includes(coreCompact)) return 3

  const tokens = core.split(' ').filter((token) => token.length >= 3)
  if (tokens.length === 0) {
    // Short cores like "ods" — require compact containment only
    return qCompact.includes(coreCompact) ? 2 : 0
  }

  const hits = tokens.filter((token) => q.includes(token) || qCompact.includes(token))
  if (hits.length === tokens.length) return 2
  if (tokens.length === 1 && hits.length === 1) return 2
  if (hits.length >= Math.ceil(tokens.length * 0.6)) return 1
  return 0
}

/**
 * Tie Search Console queries to uploaded breweries by name (best-effort).
 * Each query maps to at most one brewery (highest score, then clicks).
 */
export function matchSeoQueriesToBreweries(
  queries: SeoRow[],
  breweries: SeoBreweryRef[]
): BreweryQueryMatch[] {
  const byBrewery = new Map<string, BreweryQueryMatch>()

  for (const row of queries) {
    let best: { brewery: SeoBreweryRef; score: number } | null = null
    for (const brewery of breweries) {
      const score = scoreQueryAgainstBrewery(row.label, brewery.name)
      if (score <= 0) continue
      if (
        !best ||
        score > best.score ||
        (score === best.score && brewery.name.length < best.brewery.name.length)
      ) {
        best = { brewery, score }
      }
    }
    if (!best) continue

    const existing = byBrewery.get(best.brewery.id) ?? {
      breweryId: best.brewery.id,
      breweryName: best.brewery.name,
      region: best.brewery.region,
      slug: best.brewery.slug,
      latitude: best.brewery.latitude,
      longitude: best.brewery.longitude,
      queries: [],
      clicks: 0,
      impressions: 0,
    }
    existing.queries.push({
      query: row.label,
      clicks: row.clicks,
      impressions: row.impressions,
      score: best.score,
    })
    existing.clicks += row.clicks
    existing.impressions += row.impressions
    byBrewery.set(best.brewery.id, existing)
  }

  return Array.from(byBrewery.values())
    .map((row) => ({
      ...row,
      queries: row.queries.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions),
    }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions || a.breweryName.localeCompare(b.breweryName))
}
