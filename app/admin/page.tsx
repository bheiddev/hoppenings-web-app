import { Metadata } from 'next'
import { Colors } from '@/lib/colors'
import { AdminHomeTopTabs, type AdminHomeTab } from '@/components/admin/AdminHomeTopTabs'
import { MobileAnalyticsSection } from '@/components/admin/MobileAnalyticsSection'
import { RegionAdminPanel } from '@/components/admin/RegionAdminPanel'
import { SeoAnalyticsSection } from '@/components/admin/SeoAnalyticsSection'
import {
  buildRegionBuckets,
  getBreweriesWithEvents,
  groupByRegion,
  type BreweryWithData,
  type RegionBucket,
} from '@/lib/breweriesEventsRegions'
import { getMobileAnalyticsSummary } from '@/lib/ga4'
import { getSeoAnalyticsSummary } from '@/lib/gsc'

/** Fixed admin tab order for region content panels. */
const REGION_TAB_ORDER: { slug: string; label: string }[] = [
  { slug: 'colorado-springs', label: 'Colorado Springs Content' },
  { slug: 'boulder-longmont', label: 'Boulder & Longmont Content' },
  { slug: 'fort-collins', label: 'Fort Collins Content' },
]

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Content Admin | Hoppenings',
  description: 'Admin overview of events and beer releases by region.',
}

function regionPanel(
  bucket: RegionBucket | undefined,
  byRegion: Map<string, BreweryWithData[]>,
  tabLabel: string
) {
  const regionBreweries = bucket ? (byRegion.get(bucket.normKey) ?? []) : []
  const regionLabel = bucket?.displayLabel ?? tabLabel.replace(/ Content$/, '')
  return (
    <RegionAdminPanel
      regionBreweries={regionBreweries}
      regionLabel={regionLabel}
      sectionHeading={bucket?.sectionHeading ?? `${regionLabel} Breweries`}
    />
  )
}

export default async function AdminPage() {
  const [breweriesWithData, analytics, seo] = await Promise.all([
    getBreweriesWithEvents(),
    getMobileAnalyticsSummary(),
    getSeoAnalyticsSummary(),
  ])
  const byRegion = groupByRegion(breweriesWithData)
  const regionBuckets = buildRegionBuckets(breweriesWithData)
  const bucketBySlug = new Map(regionBuckets.map((b) => [b.slug, b]))

  const tabs: AdminHomeTab[] = [
    {
      id: 'mobile',
      label: 'Mobile App Analytics',
      panel: <MobileAnalyticsSection result={analytics} />,
    },
    {
      id: 'seo',
      label: 'Website Analytics',
      panel: <SeoAnalyticsSection result={seo} />,
    },
    ...REGION_TAB_ORDER.map(({ slug, label }) => ({
      id: `region:${slug}`,
      label,
      panel: regionPanel(bucketBySlug.get(slug), byRegion, label),
    })),
  ]

  for (const bucket of regionBuckets) {
    if (REGION_TAB_ORDER.some((r) => r.slug === bucket.slug)) continue
    tabs.push({
      id: `region:${bucket.slug}`,
      label: `${bucket.displayLabel} Content`,
      panel: regionPanel(bucket, byRegion, `${bucket.displayLabel} Content`),
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.surfaceMedium }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminHomeTopTabs tabs={tabs} defaultTabId="mobile" />
      </div>
    </div>
  )
}
