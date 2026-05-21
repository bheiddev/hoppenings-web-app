import { Colors } from '@/lib/colors'
import { BreweryWithData, breweryAnchorId } from '@/lib/breweriesEventsRegions'
import { EventsTableWithDelete } from '@/components/EventsTableWithDelete'
import { BeerReleasesTableWithActions } from '@/components/BeerReleasesTableWithActions'

interface BreweriesEventsRegionContentProps {
  regionBreweries: BreweryWithData[]
  sectionHeading: string
}

export function BreweriesEventsRegionContent({
  regionBreweries,
  sectionHeading,
}: BreweriesEventsRegionContentProps) {
  const sorted = [...regionBreweries].sort((a, b) =>
    a.brewery.name.localeCompare(b.brewery.name)
  )

  if (sorted.length === 0) {
    return (
      <p className="text-sm" style={{ color: Colors.textSecondary }}>
        No breweries in this region.
      </p>
    )
  }

  return (
    <div className="space-y-10">
      <h2
        className="text-2xl font-bold"
        style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
      >
        {sectionHeading}
      </h2>
      {sorted.map(({ brewery, events, releases }) => (
        <div key={brewery.id} id={breweryAnchorId(brewery.id)} className="space-y-6 scroll-mt-24">
          <h3
            className="text-xl font-semibold flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
            style={{ color: Colors.textPrimary }}
          >
            <span>{brewery.name}</span>
            <span
              className="text-xs font-mono font-normal shrink-0"
              style={{ color: Colors.textSecondary }}
              title="Brewery UUID"
            >
              {brewery.id}
            </span>
          </h3>
          <EventsTableWithDelete events={events} title="Events" breweryId={brewery.id} />
          <BeerReleasesTableWithActions
            releases={releases}
            title="Beer releases"
            breweryId={brewery.id}
          />
        </div>
      ))}
    </div>
  )
}
