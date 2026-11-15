import { google } from 'googleapis'

export type SeoRow = {
  label: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type SeoAnalyticsSummary = {
  rangeLabel: string
  siteUrl: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  queries: SeoRow[]
  pages: SeoRow[]
  dates: SeoRow[]
}

export type SeoAnalyticsResult =
  | { ok: true; data: SeoAnalyticsSummary }
  | { ok: false; error: string }

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatRangeLabel(start: string, end: string): string {
  const pretty = (s: string) => {
    const [y, m, day] = s.split('-')
    return `${m}/${day}/${y}`
  }
  return `${pretty(start)} – ${pretty(end)}`
}

function getGscConfig():
  | { error: string }
  | { siteUrl: string; clientEmail: string; privateKey: string } {
  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim()
  const privateKeyRaw = process.env.GA4_PRIVATE_KEY
  const siteUrl =
    process.env.GSC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'sc-domain:hoppeningsco.com'

  if (!clientEmail || !privateKeyRaw) {
    return {
      error:
        'Search Console is not configured. Set GA4_CLIENT_EMAIL and GA4_PRIVATE_KEY (and optionally GSC_SITE_URL).',
    }
  }

  return {
    siteUrl,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
  }
}

type GscApiRow = {
  keys?: string[] | null
  clicks?: number | null
  impressions?: number | null
  ctr?: number | null
  position?: number | null
}

function mapRows(rows: GscApiRow[] | null | undefined): SeoRow[] {
  return (
    rows?.map((row) => ({
      label: row.keys?.[0] || '(not set)',
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    })) ?? []
  )
}

const QUERY_PAGE_SIZE = 25000

type SearchConsoleClient = ReturnType<typeof google.searchconsole>

/**
 * GSC returns query rows sorted by clicks, so a small rowLimit misses most
 * impression volume. Paginate through the full query dimension set, then the
 * admin UI can re-rank by impressions (including zero-click queries).
 */
async function fetchAllQueryRows(
  searchconsole: SearchConsoleClient,
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<GscApiRow[]> {
  const all: GscApiRow[] = []
  let startRow = 0

  for (;;) {
    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: QUERY_PAGE_SIZE,
        startRow,
      },
    })
    const batch = res.data.rows ?? []
    if (batch.length === 0) break
    all.push(...batch)
    if (batch.length < QUERY_PAGE_SIZE) break
    startRow += batch.length
  }

  return all
}

/**
 * Fetch Google Search Console performance for the web property.
 * Uses the same service account as GA4. Data typically lags 2–3 days.
 * Server-only — never call from the browser.
 */
export async function getSeoAnalyticsSummary(): Promise<SeoAnalyticsResult> {
  const config = getGscConfig()
  if ('error' in config) return { ok: false, error: config.error }

  const { siteUrl, clientEmail, privateKey } = config

  // GSC usually lags ~2–3 days; end on day-3 for mostly final data.
  // Last ~90 days (3 months) to match the default Search Console UI window.
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 3)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 89)
  const startDate = isoDate(start)
  const endDate = isoDate(end)

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })
    const searchconsole = google.searchconsole({ version: 'v1', auth })

    const base = { startDate, endDate }
    const [totalsRes, queryRows, pagesRes, datesRes] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { ...base },
      }),
      fetchAllQueryRows(searchconsole, siteUrl, startDate, endDate),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { ...base, dimensions: ['page'], rowLimit: 25 },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { ...base, dimensions: ['date'], rowLimit: 100 },
      }),
    ])

    const totals = totalsRes.data.rows?.[0]
    const queries = mapRows(queryRows).sort(
      (a, b) => b.impressions - a.impressions || b.clicks - a.clicks
    )

    return {
      ok: true,
      data: {
        rangeLabel: formatRangeLabel(startDate, endDate),
        siteUrl,
        clicks: totals?.clicks ?? 0,
        impressions: totals?.impressions ?? 0,
        ctr: totals?.ctr ?? 0,
        position: totals?.position ?? 0,
        queries,
        pages: mapRows(pagesRes.data.rows),
        dates: mapRows(datesRes.data.rows),
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load Search Console analytics'
    return { ok: false, error: message }
  }
}
