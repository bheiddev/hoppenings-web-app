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

function mapRows(
  rows: {
    keys?: string[] | null
    clicks?: number | null
    impressions?: number | null
    ctr?: number | null
    position?: number | null
  }[] | null | undefined
): SeoRow[] {
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
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 3)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 27)
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
    const [totalsRes, queriesRes, pagesRes, datesRes] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { ...base },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { ...base, dimensions: ['query'], rowLimit: 15 },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { ...base, dimensions: ['page'], rowLimit: 15 },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { ...base, dimensions: ['date'], rowLimit: 40 },
      }),
    ])

    const totals = totalsRes.data.rows?.[0]

    return {
      ok: true,
      data: {
        rangeLabel: formatRangeLabel(startDate, endDate),
        siteUrl,
        clicks: totals?.clicks ?? 0,
        impressions: totals?.impressions ?? 0,
        ctr: totals?.ctr ?? 0,
        position: totals?.position ?? 0,
        queries: mapRows(queriesRes.data.rows),
        pages: mapRows(pagesRes.data.rows),
        dates: mapRows(datesRes.data.rows),
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load Search Console analytics'
    return { ok: false, error: message }
  }
}
