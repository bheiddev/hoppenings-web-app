import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { BreweriesEventsBreweryBreakdown } from '@/components/BreweriesEventsBreweryBreakdown'
import { BreweriesEventsRegionContent } from '@/components/BreweriesEventsRegionContent'
import { BreweriesEventsUpcomingByDate } from '@/components/BreweriesEventsUpcomingByDate'
import {
  buildRegionBuckets,
  findRegionBucketBySlug,
  getBreweriesWithEvents,
  groupByRegion,
} from '@/lib/breweriesEventsRegions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>
}): Promise<Metadata> {
  const { region: regionSlug } = await params
  const breweriesWithData = await getBreweriesWithEvents()
  const bucket = findRegionBucketBySlug(regionSlug, buildRegionBuckets(breweriesWithData))
  if (!bucket) return { title: 'Region Not Found | Breweries & Events' }
  return {
    title: `${bucket.displayLabel} | Breweries & Events`,
    description: `Manage events and beer releases for breweries in ${bucket.displayLabel}.`,
  }
}

export default async function BreweriesEventsRegionPage({
  params,
}: {
  params: Promise<{ region: string }>
}) {
  const { region: regionSlug } = await params
  const breweriesWithData = await getBreweriesWithEvents()
  const regionBuckets = buildRegionBuckets(breweriesWithData)
  const bucket = findRegionBucketBySlug(regionSlug, regionBuckets)
  if (!bucket) notFound()

  const byRegion = groupByRegion(breweriesWithData)
  const regionBreweries = byRegion.get(bucket.normKey) ?? []

  const eventCount = regionBreweries.reduce((sum, r) => sum + r.events.length, 0)
  const releaseCount = regionBreweries.reduce((sum, r) => sum + r.releases.length, 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="mb-4">
          <Link
            href="/breweries-events"
            className="text-sm underline hover:opacity-80"
            style={{ color: Colors.primary }}
          >
            ← All regions
          </Link>
        </p>
        <h1
          className="text-4xl font-bold mb-2"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {bucket.displayLabel}
        </h1>
        <p className="text-sm mb-8" style={{ color: Colors.textSecondary }}>
          {regionBreweries.length} {regionBreweries.length === 1 ? 'brewery' : 'breweries'} ·{' '}
          {eventCount} events · {releaseCount} beer releases
        </p>

        <BreweriesEventsUpcomingByDate regionBreweries={regionBreweries} />

        <BreweriesEventsBreweryBreakdown regionBreweries={regionBreweries} />

        <BreweriesEventsRegionContent
          regionBreweries={regionBreweries}
          sectionHeading={bucket.sectionHeading}
        />
      </div>
    </div>
  )
}
