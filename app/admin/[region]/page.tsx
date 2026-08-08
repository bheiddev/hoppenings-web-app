import { Metadata } from 'next'
import { BackLink } from '@/components/BackLink'
import { notFound } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { BreweriesEventsBreweryBreakdown } from '@/components/BreweriesEventsBreweryBreakdown'
import { BreweriesEventsRegionContent } from '@/components/BreweriesEventsRegionContent'
import {
  findRegionBucketBySlug,
  getBreweriesWithEvents,
  getRegionBucketsFromBreweries,
} from '@/lib/breweriesEventsRegions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>
}): Promise<Metadata> {
  const { region: regionSlug } = await params
  const bucket = findRegionBucketBySlug(regionSlug, await getRegionBucketsFromBreweries())
  if (!bucket) return { title: 'Region Not Found | Content Admin' }
  return {
    title: `${bucket.displayLabel} | Content Admin`,
    description: `Manage events and beer releases for breweries in ${bucket.displayLabel}.`,
  }
}

export default async function BreweriesEventsRegionPage({
  params,
}: {
  params: Promise<{ region: string }>
}) {
  const { region: regionSlug } = await params
  const bucket = findRegionBucketBySlug(regionSlug, await getRegionBucketsFromBreweries())
  if (!bucket) notFound()

  // Only load this region's breweries (avoids statewide RSC payload / console floods)
  const regionBreweries = await getBreweriesWithEvents({ regionSlug })

  const eventCount = regionBreweries.reduce((sum, r) => sum + r.events.length, 0)
  const releaseCount = regionBreweries.reduce((sum, r) => sum + r.releases.length, 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.surfaceMedium }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="mb-4">
          <BackLink
            fallbackHref="/admin"
            fallbackLabel="Content Admin"
            showIcon={false}
            className="text-sm underline hover:opacity-80"
            style={{ color: Colors.primaryDark }}
          />
        </p>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {bucket.displayLabel}
        </h1>
        <p className="text-sm mb-8" style={{ color: Colors.textSecondary }}>
          {regionBreweries.length} {regionBreweries.length === 1 ? 'brewery' : 'breweries'} ·{' '}
          {eventCount} events · {releaseCount} beer releases
        </p>

        <BreweriesEventsBreweryBreakdown regionBreweries={regionBreweries} />

        <BreweriesEventsRegionContent
          regionBreweries={regionBreweries}
          sectionHeading={bucket.sectionHeading}
          regionLabel={bucket.displayLabel}
        />
      </div>
    </div>
  )
}
