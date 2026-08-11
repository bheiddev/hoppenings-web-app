import { Colors } from '@/lib/colors'
import { BreweryWithData, breweryAnchorId } from '@/lib/breweriesEventsRegions'
import { AddBreweryControl } from '@/components/AddBreweryControl'
import { BreweryAdminDetails } from '@/components/BreweryAdminDetails'
import { EventsTableWithDelete } from '@/components/EventsTableWithDelete'
import { ProposedEventsTable } from '@/components/ProposedEventsTable'
import { BeerReleasesTableWithActions } from '@/components/BeerReleasesTableWithActions'
import { FoodTrucksTableWithActions } from '@/components/FoodTrucksTableWithActions'

interface BreweriesEventsRegionContentProps {
  regionBreweries: BreweryWithData[]
  sectionHeading: string
  regionLabel: string
}

export function BreweriesEventsRegionContent({
  regionBreweries,
  sectionHeading,
  regionLabel,
}: BreweriesEventsRegionContentProps) {
  const sorted = [...regionBreweries].sort((a, b) =>
    a.brewery.name.localeCompare(b.brewery.name)
  )

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-2xl font-bold"
          style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {sectionHeading}
        </h2>
        <AddBreweryControl regionLabel={regionLabel} />
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm" style={{ color: Colors.textSecondary }}>
          No breweries in this region yet. Use Add brewery to create one.
        </p>
      ) : (
        sorted.map(({ brewery, hours, events, proposedEvents, releases, foodTrucks }) => (
          <div key={brewery.id} id={breweryAnchorId(brewery.id)} className="space-y-4 scroll-mt-24">
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

            <BreweryAdminDetails brewery={brewery} hours={hours} />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start overflow-x-hidden">
              <div className="min-w-0">
                <EventsTableWithDelete
                  events={events}
                  title="Events (events_base)"
                  breweryId={brewery.id}
                />
              </div>
              <div className="min-w-0">
                <ProposedEventsTable
                  proposed={proposedEvents}
                  title="Proposed events (proposed_events)"
                />
              </div>
              <div className="min-w-0">
                <BeerReleasesTableWithActions
                  releases={releases}
                  title="Beer releases"
                  breweryId={brewery.id}
                />
              </div>
              <div className="min-w-0">
                <FoodTrucksTableWithActions
                  foodTrucks={foodTrucks}
                  title="Food trucks"
                  breweryId={brewery.id}
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
