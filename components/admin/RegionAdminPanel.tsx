import { BreweriesEventsBreweryBreakdown } from '@/components/BreweriesEventsBreweryBreakdown'
import { BreweriesEventsRegionContent } from '@/components/BreweriesEventsRegionContent'
import { BreweriesEventsUpcomingByDate } from '@/components/BreweriesEventsUpcomingByDate'
import type { BreweryWithData } from '@/lib/breweriesEventsRegions'

export function RegionAdminPanel({
  regionBreweries,
  regionLabel,
  sectionHeading,
}: {
  regionBreweries: BreweryWithData[]
  regionLabel: string
  sectionHeading: string
}) {
  return (
    <div className="space-y-10">
      <BreweriesEventsUpcomingByDate
        regionBreweries={regionBreweries}
        title={`${regionLabel} · 5-day forecast`}
      />
      <BreweriesEventsBreweryBreakdown regionBreweries={regionBreweries} />
      <BreweriesEventsRegionContent
        regionBreweries={regionBreweries}
        sectionHeading={sectionHeading}
        regionLabel={regionLabel}
      />
    </div>
  )
}
