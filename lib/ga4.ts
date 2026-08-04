import { BetaAnalyticsDataClient } from '@google-analytics/data'

export type BreakdownRow = {
  value: string
  activeUsers: number
  eventCount: number
}

export type MobileAnalyticsSummary = {
  rangeLabel: string
  dau: number
  wau: number
  mau: number
  appOpens: number
  eventCount: number
  sessions: number
  engagedSessions: number
  engagementRate: number
  averageSessionDuration: number
  bounceRate: number
  sessionsPerUser: number
  eventsPerSession: number
  events: BreakdownRow[]
  cities: BreakdownRow[]
  dates: BreakdownRow[]
}

export type MobileAnalyticsResult =
  | { ok: true; data: MobileAnalyticsSummary }
  | { ok: false; error: string }

type Ga4Client = BetaAnalyticsDataClient

const DATE_RANGES = [{ startDate: '7daysAgo', endDate: 'today' }] as const

function getGa4Credentials():
  | { error: string }
  | { propertyId: string; clientEmail: string; privateKey: string; projectId: string } {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim()
  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim()
  const privateKeyRaw = process.env.GA4_PRIVATE_KEY
  const projectId = process.env.GA4_PROJECT_ID?.trim() || 'hoppenings-ef48c'

  if (!propertyId || !clientEmail || !privateKeyRaw) {
    return {
      error:
        'GA4 is not configured. Set GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, and GA4_PRIVATE_KEY in the server environment.',
    }
  }

  return {
    propertyId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
    projectId,
  }
}

function createClient(creds: {
  projectId: string
  clientEmail: string
  privateKey: string
}): Ga4Client {
  return new BetaAnalyticsDataClient({
    projectId: creds.projectId,
    credentials: {
      client_email: creds.clientEmail,
      private_key: creds.privateKey,
    },
  })
}

function parseMetricNumber(raw: string | null | undefined): number {
  if (raw == null || raw === '') return 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function metricAt(
  rows: { metricValues?: { value?: string | null }[] | null }[] | null | undefined,
  index: number
): number {
  return parseMetricNumber(rows?.[0]?.metricValues?.[index]?.value)
}

function mapBreakdownRows(
  rows: {
    dimensionValues?: { value?: string | null }[] | null
    metricValues?: { value?: string | null }[] | null
  }[] | null | undefined
): BreakdownRow[] {
  return (
    rows
      ?.map((row) => ({
        value: row.dimensionValues?.[0]?.value?.trim() || '(not set)',
        activeUsers: parseMetricNumber(row.metricValues?.[0]?.value),
        eventCount: parseMetricNumber(row.metricValues?.[1]?.value),
      }))
      .filter((r) => r.activeUsers > 0 || r.eventCount > 0) ?? []
  )
}

/**
 * Fetch last-7-day mobile app analytics from GA4 (Firebase Analytics property).
 * Server-only — uses a service account; never call from the browser.
 */
export async function getMobileAnalyticsSummary(): Promise<MobileAnalyticsResult> {
  const creds = getGa4Credentials()
  if ('error' in creds) return { ok: false, error: creds.error }

  const { propertyId, clientEmail, privateKey, projectId } = creds
  const client = createClient({ projectId, clientEmail, privateKey })
  const property = `properties/${propertyId}`
  const dateRanges = [...DATE_RANGES]

  try {
    // Rolling DAU/WAU/MAU must use a single-day range or GA4 sums across days.
    const rollingDay = [{ startDate: 'yesterday', endDate: 'yesterday' }]

    const [
      [rollingRes],
      [totalsRes],
      [sessionRes],
      [appOpenRes],
      [eventsRes],
      [citiesRes],
      [datesRes],
    ] = await Promise.all([
      client.runReport({
        property,
        dateRanges: rollingDay,
        metrics: [
          { name: 'active1DayUsers' },
          { name: 'active7DayUsers' },
          { name: 'active28DayUsers' },
        ],
      }),
      client.runReport({
        property,
        dateRanges,
        metrics: [{ name: 'eventCount' }],
      }),
      client.runReport({
        property,
        dateRanges,
        metrics: [
          { name: 'sessions' },
          { name: 'engagedSessions' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'sessionsPerUser' },
          { name: 'eventsPerSession' },
        ],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'app_open', matchType: 'EXACT' },
          },
        },
      }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'activeUsers' }, { name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 25,
      }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: 'city' }],
        metrics: [{ name: 'activeUsers' }, { name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 15,
      }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'eventCount' }],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        limit: 31,
      }),
    ])

    return {
      ok: true,
      data: {
        rangeLabel: 'Last 7 days',
        dau: metricAt(rollingRes.rows, 0),
        wau: metricAt(rollingRes.rows, 1),
        mau: metricAt(rollingRes.rows, 2),
        eventCount: metricAt(totalsRes.rows, 0),
        appOpens: metricAt(appOpenRes.rows, 0),
        sessions: metricAt(sessionRes.rows, 0),
        engagedSessions: metricAt(sessionRes.rows, 1),
        engagementRate: metricAt(sessionRes.rows, 2),
        averageSessionDuration: metricAt(sessionRes.rows, 3),
        bounceRate: metricAt(sessionRes.rows, 4),
        sessionsPerUser: metricAt(sessionRes.rows, 5),
        eventsPerSession: metricAt(sessionRes.rows, 6),
        events: mapBreakdownRows(eventsRes.rows),
        cities: mapBreakdownRows(citiesRes.rows),
        dates: mapBreakdownRows(datesRes.rows),
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load GA4 analytics'
    return { ok: false, error: message }
  }
}
