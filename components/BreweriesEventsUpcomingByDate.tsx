'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { BeerReleaseFormModal } from '@/components/BeerReleaseFormModal'
import { EventFormModal } from '@/components/EventFormModal'
import { FoodTruckFormModal } from '@/components/FoodTruckFormModal'
import { HappyHourDealFormModal } from '@/components/HappyHourDealFormModal'
import { EditProposedEventModal } from '@/components/ProposedEventsTable'
import {
  AdminColumnScrollBody,
  AdminSectionHeader,
  BeerReleaseAdminCard,
  EventAdminCard,
  FoodTruckAdminCard,
  HappyHourDealAdminCard,
  ProposedBeerReleaseAdminCard,
  ProposedEventAdminCard,
} from '@/components/breweriesEventsAdminCards'
import {
  acceptProposedBeerRelease,
  acceptProposedEvent,
  deleteBeerReleaseFromBase,
  deleteEventFromEventsBase,
  deleteFoodTruck,
  deleteHappyHourDeal,
  rejectProposedBeerRelease,
  rejectProposedEvent,
  updateBeerReleaseInBase,
  updateEventInEventsBase,
  updateFoodTruck,
  updateHappyHourDeal,
  updateProposedBeerRelease,
  updateProposedEvent,
  type UpdateBeerReleasePayload,
  type UpdateProposedBeerReleasePayload,
} from '@/app/admin/actions'
import { BreweryWithData } from '@/lib/breweriesEventsRegions'
import { foodTruckShowsOnDate } from '@/lib/foodTrucks'
import { happyHourDealShowsOnDate } from '@/lib/happyHourDeals'
import {
  formatEventDateShort,
  getMountainDateRangeFromToday,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'
import {
  BeerRelease,
  Event,
  FoodTruck,
  HappyHourDeal,
  ProposedBeerRelease,
  ProposedEvent,
} from '@/types/supabase'

/** Days shown in one carousel page. */
const VISIBLE_DAY_COUNT = 2
/** How far ahead the carousel can page. */
const FORECAST_HORIZON_DAYS = 60

type EventRow = Event & { breweryName: string; breweryId: string }
type ProposedRow = ProposedEvent & { breweryName: string; breweryId: string }
type ProposedBeerRow = ProposedBeerRelease & { breweryName: string; breweryId: string }
type ReleaseRow = BeerRelease & { breweryName: string; breweryId: string }
type FoodTruckRow = FoodTruck & { breweryName: string; breweryId: string }
type HappyHourDealRow = HappyHourDeal & { breweryName: string; breweryId: string }

function acceptProposedKey(id: number) {
  return `accept:proposed:${id}`
}

function rejectProposedKey(id: number) {
  return `reject:proposed:${id}`
}

function acceptProposedBeerKey(id: number) {
  return `accept:proposed-beer:${id}`
}

function rejectProposedBeerKey(id: number) {
  return `reject:proposed-beer:${id}`
}

function proposedBeerAsReleaseShape(proposed: ProposedBeerRelease) {
  return {
    id: String(proposed.id),
    created_at: proposed.created_at,
    beer_name: proposed.beer_name ?? '',
    ABV: proposed.ABV,
    Type: proposed.Type,
    description: proposed.description,
    brewery_id: proposed.brewery_id ?? '',
    brewery_id2: proposed.brewery_id2,
    brewery_id3: proposed.brewery_id3,
    release_date: proposed.release_date,
    breweries: {
      id: proposed.brewery_id ?? '',
      name: '',
    },
  }
}

function normalizeReleaseDate(releaseDate: string | null): string | null {
  if (!releaseDate?.trim()) return null
  return normalizeEventDateToMountainTime(releaseDate)
}

function forecastDayHeading(ymd: string): string {
  return formatEventDateShort(ymd)
}

function ForecastCategoryBlock({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <AdminSectionHeader label={label} />
      <AdminColumnScrollBody>{children}</AdminColumnScrollBody>
    </div>
  )
}

function BreweryPairSection({
  breweryName,
  left,
  right,
}: {
  breweryName: string
  left: ReactNode
  right: ReactNode
}) {
  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <div
        className="px-3 py-2 border-b"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surfaceLight }}
      >
        <h4
          className="text-sm font-semibold leading-snug"
          style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {breweryName}
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:divide-x" style={{ borderColor: Colors.dividerLight }}>
        <div className="min-w-0 border-b sm:border-b-0" style={{ borderColor: Colors.dividerLight }}>
          {left}
        </div>
        <div className="min-w-0">{right}</div>
      </div>
    </div>
  )
}

function PairColumn({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-0">
      <div
        className="px-3 py-1.5 border-b text-xs font-semibold"
        style={{
          borderColor: Colors.dividerLight,
          color: Colors.textSecondary,
          backgroundColor: Colors.surfaceMedium,
        }}
      >
        {label}
      </div>
      <AdminColumnScrollBody>{children}</AdminColumnScrollBody>
    </div>
  )
}

type WithBrewery = { breweryId: string; breweryName: string }

function groupByBrewery<T extends WithBrewery>(
  items: T[]
): { breweryId: string; breweryName: string; items: T[] }[] {
  const map = new Map<string, { breweryId: string; breweryName: string; items: T[] }>()
  for (const item of items) {
    const existing = map.get(item.breweryId)
    if (existing) {
      existing.items.push(item)
    } else {
      map.set(item.breweryId, {
        breweryId: item.breweryId,
        breweryName: item.breweryName || 'Unknown brewery',
        items: [item],
      })
    }
  }
  return [...map.values()].sort((a, b) => a.breweryName.localeCompare(b.breweryName))
}

function breweryIdsUnion(
  ...groups: { breweryId: string; breweryName: string }[][]
): { breweryId: string; breweryName: string }[] {
  const map = new Map<string, string>()
  for (const group of groups) {
    for (const row of group) {
      if (!map.has(row.breweryId)) map.set(row.breweryId, row.breweryName)
    }
  }
  return [...map.entries()]
    .map(([breweryId, breweryName]) => ({ breweryId, breweryName }))
    .sort((a, b) => a.breweryName.localeCompare(b.breweryName))
}

function collectUpcomingByDate(regionBreweries: BreweryWithData[]) {
  const dates = getMountainDateRangeFromToday(FORECAST_HORIZON_DAYS)
  const weekStart = dates[0]
  const weekEnd = dates[dates.length - 1]

  const breweryNameById = new Map(
    regionBreweries.map(({ brewery }) => [brewery.id, brewery.name] as const)
  )
  const eventsByDay = new Map<string, EventRow[]>()
  const proposedByDay = new Map<string, ProposedRow[]>()
  const proposedBeersByDay = new Map<string, ProposedBeerRow[]>()
  const releasesByDay = new Map<string, ReleaseRow[]>()
  const foodTrucksByDay = new Map<string, FoodTruckRow[]>()
  const happyHourDealsByDay = new Map<string, HappyHourDealRow[]>()
  for (const d of dates) {
    eventsByDay.set(d, [])
    proposedByDay.set(d, [])
    proposedBeersByDay.set(d, [])
    releasesByDay.set(d, [])
    foodTrucksByDay.set(d, [])
    happyHourDealsByDay.set(d, [])
  }

  const seenProposedIds = new Set<number>()
  const seenProposedBeerIds = new Set<number>()

  for (const {
    brewery,
    events,
    proposedEvents,
    proposedBeerReleases,
    releases,
    foodTrucks,
    happyHourDeals,
  } of regionBreweries) {
    for (const event of events) {
      const d = normalizeEventDateToMountainTime(event.event_date)
      if (d >= weekStart && d <= weekEnd) {
        eventsByDay.get(d)!.push({
          ...event,
          breweryName: brewery.name,
          breweryId: brewery.id,
        })
      }
    }
    for (const proposed of proposedEvents) {
      if (seenProposedIds.has(proposed.id)) continue
      if (!proposed.event_date?.trim()) continue
      const d = normalizeEventDateToMountainTime(proposed.event_date)
      if (d >= weekStart && d <= weekEnd && proposedByDay.has(d)) {
        seenProposedIds.add(proposed.id)
        const breweryId =
          proposed.brewery_id ?? proposed.brewery_id2 ?? proposed.brewery_id3 ?? brewery.id
        proposedByDay.get(d)!.push({
          ...proposed,
          breweryName: breweryNameById.get(breweryId) ?? brewery.name,
          breweryId,
        })
      }
    }
    for (const proposed of proposedBeerReleases) {
      if (seenProposedBeerIds.has(proposed.id)) continue
      if (!proposed.release_date?.trim()) continue
      const d = normalizeReleaseDate(proposed.release_date)
      if (d && d >= weekStart && d <= weekEnd && proposedBeersByDay.has(d)) {
        seenProposedBeerIds.add(proposed.id)
        const breweryId =
          proposed.brewery_id ?? proposed.brewery_id2 ?? proposed.brewery_id3 ?? brewery.id
        proposedBeersByDay.get(d)!.push({
          ...proposed,
          breweryName: breweryNameById.get(breweryId) ?? brewery.name,
          breweryId,
        })
      }
    }
    for (const release of releases) {
      const d = normalizeReleaseDate(release.release_date)
      if (d && d >= weekStart && d <= weekEnd) {
        releasesByDay.get(d)!.push({
          ...release,
          breweryName: brewery.name,
          breweryId: brewery.id,
        })
      }
    }
    for (const truck of foodTrucks) {
      if (truck.permanent === true) continue
      for (const d of dates) {
        if (foodTruckShowsOnDate(truck, d)) {
          foodTrucksByDay.get(d)!.push({
            ...truck,
            breweryName: brewery.name,
            breweryId: brewery.id,
          })
        }
      }
    }
    for (const deal of happyHourDeals) {
      for (const d of dates) {
        if (happyHourDealShowsOnDate(deal, d)) {
          happyHourDealsByDay.get(d)!.push({
            ...deal,
            breweryName: brewery.name,
            breweryId: brewery.id,
          })
        }
      }
    }
  }

  for (const list of eventsByDay.values()) {
    list.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      const breweryCmp = a.breweryName.localeCompare(b.breweryName)
      if (breweryCmp !== 0) return breweryCmp
      return a.title.localeCompare(b.title)
    })
  }
  for (const list of proposedByDay.values()) {
    list.sort((a, b) => {
      const breweryCmp = a.breweryName.localeCompare(b.breweryName)
      if (breweryCmp !== 0) return breweryCmp
      return (a.title ?? '').localeCompare(b.title ?? '')
    })
  }
  for (const list of proposedBeersByDay.values()) {
    list.sort((a, b) => {
      const breweryCmp = a.breweryName.localeCompare(b.breweryName)
      if (breweryCmp !== 0) return breweryCmp
      return (a.beer_name ?? '').localeCompare(b.beer_name ?? '')
    })
  }
  for (const list of releasesByDay.values()) {
    list.sort((a, b) => {
      const breweryCmp = a.breweryName.localeCompare(b.breweryName)
      if (breweryCmp !== 0) return breweryCmp
      return a.beer_name.localeCompare(b.beer_name)
    })
  }
  for (const list of foodTrucksByDay.values()) {
    list.sort((a, b) => {
      const breweryCmp = a.breweryName.localeCompare(b.breweryName)
      if (breweryCmp !== 0) return breweryCmp
      return (a.name ?? '').localeCompare(b.name ?? '')
    })
  }
  for (const list of happyHourDealsByDay.values()) {
    list.sort((a, b) => {
      const breweryCmp = a.breweryName.localeCompare(b.breweryName)
      if (breweryCmp !== 0) return breweryCmp
      const aStart = a.time_start ?? -1
      const bStart = b.time_start ?? -1
      if (aStart !== bStart) return aStart - bStart
      return a.title.localeCompare(b.title)
    })
  }

  return {
    dates,
    eventsByDay,
    proposedByDay,
    proposedBeersByDay,
    releasesByDay,
    foodTrucksByDay,
    happyHourDealsByDay,
  }
}

export function BreweriesEventsUpcomingByDate({
  regionBreweries,
  title,
  subtitle,
}: {
  regionBreweries: BreweryWithData[]
  title?: string
  subtitle?: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<EventRow | null>(null)
  const [editingProposed, setEditingProposed] = useState<ProposedRow | null>(null)
  const [editingProposedBeer, setEditingProposedBeer] = useState<ProposedBeerRow | null>(null)
  const [editingRelease, setEditingRelease] = useState<ReleaseRow | null>(null)
  const [editingFoodTruck, setEditingFoodTruck] = useState<FoodTruckRow | null>(null)
  const [editingHappyHourDeal, setEditingHappyHourDeal] = useState<HappyHourDealRow | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [windowStart, setWindowStart] = useState(0)
  const {
    dates,
    eventsByDay,
    proposedByDay,
    proposedBeersByDay,
    releasesByDay,
    foodTrucksByDay,
    happyHourDealsByDay,
  } = useMemo(() => collectUpcomingByDate(regionBreweries), [regionBreweries])

  const maxWindowStart = Math.max(0, dates.length - VISIBLE_DAY_COUNT)
  const safeWindowStart = Math.min(windowStart, maxWindowStart)
  const visibleDates = dates.slice(safeWindowStart, safeWindowStart + VISIBLE_DAY_COUNT)
  const canGoPrev = safeWindowStart > 0
  const canGoNext = safeWindowStart < maxWindowStart

  function shiftWindow(delta: number) {
    setWindowStart((current) => {
      const next = current + delta
      if (next < 0) return 0
      if (next > maxWindowStart) return maxWindowStart
      return next
    })
  }

  async function handleAcceptProposed(proposed: ProposedEvent) {
    setActionError(null)
    setPendingKey(acceptProposedKey(proposed.id))
    try {
      const result = await acceptProposedEvent(proposed)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to accept')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Accept failed')
    }
  }

  async function handleRejectProposed(id: number) {
    setActionError(null)
    setPendingKey(rejectProposedKey(id))
    try {
      const result = await rejectProposedEvent(id)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to reject')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Reject failed')
    }
  }

  async function handleAcceptProposedBeer(proposed: ProposedBeerRelease) {
    setActionError(null)
    setPendingKey(acceptProposedBeerKey(proposed.id))
    try {
      const result = await acceptProposedBeerRelease(proposed)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to accept')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Accept failed')
    }
  }

  async function handleRejectProposedBeer(id: number) {
    setActionError(null)
    setPendingKey(rejectProposedBeerKey(id))
    try {
      const result = await rejectProposedBeerRelease(id)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to reject')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Reject failed')
    }
  }

  async function handleDeleteEvent(eventId: string) {
    setActionError(null)
    setPendingKey(`delete:event:${eventId}`)
    try {
      const result = await deleteEventFromEventsBase(eventId)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleDeleteRelease(releaseId: string) {
    setActionError(null)
    setPendingKey(`delete:release:${releaseId}`)
    try {
      const result = await deleteBeerReleaseFromBase(releaseId)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleDeleteFoodTruck(foodTruckId: number) {
    setActionError(null)
    const loadingKey = `delete:food-truck:${foodTruckId}`
    setPendingKey(loadingKey)
    try {
      const result = await deleteFoodTruck(foodTruckId)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleDeleteHappyHourDeal(dealId: string) {
    setActionError(null)
    const loadingKey = `delete:happy-hour:${dealId}`
    setPendingKey(loadingKey)
    try {
      const result = await deleteHappyHourDeal(dealId)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <>
      <section
        className="border rounded-xl p-6 w-full"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div className="min-w-0">
            {title ? (
              <h2
                className="text-xl font-bold"
                style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                {title}
              </h2>
            ) : (
              <h2
                className="text-xl font-bold"
                style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                2-day forecast
              </h2>
            )}
            {subtitle ? (
              <p className="text-xs mt-1" style={{ color: Colors.textMuted }}>
                {subtitle}
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: Colors.textMuted }}>
                Showing{' '}
                {visibleDates[0] ? formatEventDateShort(visibleDates[0]) : '—'}
                {' – '}
                {visibleDates[visibleDates.length - 1]
                  ? formatEventDateShort(visibleDates[visibleDates.length - 1])
                  : '—'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous 2 days"
              disabled={!canGoPrev}
              onClick={() => shiftWindow(-VISIBLE_DAY_COUNT)}
              className="px-3 py-1.5 text-sm font-semibold border disabled:opacity-40"
              style={{
                borderColor: Colors.dividerLight,
                backgroundColor: Colors.surfaceLight,
                color: Colors.textDark,
                fontFamily: 'var(--font-fjalla-one)',
              }}
            >
              ← Prev
            </button>
            <button
              type="button"
              aria-label="Next 2 days"
              disabled={!canGoNext}
              onClick={() => shiftWindow(VISIBLE_DAY_COUNT)}
              className="px-3 py-1.5 text-sm font-semibold border disabled:opacity-40"
              style={{
                borderColor: Colors.primaryDark,
                backgroundColor: Colors.primaryDark,
                color: Colors.onPrimary,
                fontFamily: 'var(--font-fjalla-one)',
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {actionError && (
          <div
            className="mb-4 px-3 py-2 rounded text-sm"
            style={{ backgroundColor: '#FEE2E2', color: Colors.error }}
          >
            {actionError}
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {visibleDates.map((ymd) => {
            const dayEvents = eventsByDay.get(ymd) ?? []
            const dayProposed = proposedByDay.get(ymd) ?? []
            const dayProposedBeers = proposedBeersByDay.get(ymd) ?? []
            const dayReleases = releasesByDay.get(ymd) ?? []
            const dayFoodTrucks = foodTrucksByDay.get(ymd) ?? []
            const dayHappyHourDeals = happyHourDealsByDay.get(ymd) ?? []

            return (
              <div
                key={ymd}
                className="flex flex-col min-w-0 border rounded-lg overflow-hidden"
                style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
              >
                <div
                  className="px-3 py-2 border-b"
                  style={{
                    borderColor: Colors.dividerLight,
                    backgroundColor: Colors.surfaceLight,
                  }}
                >
                  <h3
                    className="text-sm font-semibold leading-snug"
                    style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
                  >
                    {forecastDayHeading(ymd)}
                  </h3>
                </div>

                <div
                  className="flex-1 flex flex-col gap-3 p-3"
                  style={{ backgroundColor: Colors.surfaceMedium }}
                >
                  {(() => {
                    const proposedByBrewery = groupByBrewery(dayProposed)
                    const eventsByBrewery = groupByBrewery(dayEvents)
                    const proposedMap = new Map(proposedByBrewery.map((g) => [g.breweryId, g.items]))
                    const eventsMap = new Map(eventsByBrewery.map((g) => [g.breweryId, g.items]))
                    const eventBreweries = breweryIdsUnion(proposedByBrewery, eventsByBrewery)

                    if (eventBreweries.length === 0) {
                      return (
                        <p className="text-sm px-1" style={{ color: Colors.textSecondary }}>
                          No proposed or live events
                        </p>
                      )
                    }

                    return (
                      <div className="flex flex-col gap-3">
                        {eventBreweries.map(({ breweryId, breweryName }) => {
                          const proposed = proposedMap.get(breweryId) ?? []
                          const events = eventsMap.get(breweryId) ?? []
                          return (
                            <BreweryPairSection
                              key={`events-${breweryId}`}
                              breweryName={breweryName}
                              left={
                                <PairColumn label={`Proposed (${proposed.length})`}>
                                  {proposed.length === 0 ? (
                                    <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                                      None
                                    </p>
                                  ) : (
                                    proposed.map((p) => (
                                      <ProposedEventAdminCard
                                        key={p.id}
                                        proposed={p}
                                        breweryName={p.breweryName}
                                        onEdit={() => setEditingProposed({ ...p })}
                                        onAccept={() => handleAcceptProposed(p)}
                                        onReject={() => handleRejectProposed(p.id)}
                                        actionsDisabled={pendingKey !== null}
                                        acceptLoading={pendingKey === acceptProposedKey(p.id)}
                                        rejectLoading={pendingKey === rejectProposedKey(p.id)}
                                      />
                                    ))
                                  )}
                                </PairColumn>
                              }
                              right={
                                <PairColumn label={`Events (${events.length})`}>
                                  {events.length === 0 ? (
                                    <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                                      None
                                    </p>
                                  ) : (
                                    events.map((e) => (
                                      <EventAdminCard
                                        key={`${e.id}-${e.event_date}`}
                                        event={e}
                                        breweryName={e.breweryName}
                                        onEdit={() => setEditing({ ...e })}
                                        onDelete={() => handleDeleteEvent(e.id)}
                                        actionsDisabled={pendingKey !== null}
                                        deleteLoading={pendingKey === `delete:event:${e.id}`}
                                      />
                                    ))
                                  )}
                                </PairColumn>
                              }
                            />
                          )
                        })}
                      </div>
                    )
                  })()}

                  {(() => {
                    const proposedByBrewery = groupByBrewery(dayProposedBeers)
                    const releasesByBrewery = groupByBrewery(dayReleases)
                    const proposedMap = new Map(proposedByBrewery.map((g) => [g.breweryId, g.items]))
                    const releasesMap = new Map(releasesByBrewery.map((g) => [g.breweryId, g.items]))
                    const beerBreweries = breweryIdsUnion(proposedByBrewery, releasesByBrewery)

                    if (beerBreweries.length === 0) {
                      return (
                        <p className="text-sm px-1" style={{ color: Colors.textSecondary }}>
                          No proposed or live beer releases
                        </p>
                      )
                    }

                    return (
                      <div className="flex flex-col gap-3">
                        {beerBreweries.map(({ breweryId, breweryName }) => {
                          const proposed = proposedMap.get(breweryId) ?? []
                          const releases = releasesMap.get(breweryId) ?? []
                          return (
                            <BreweryPairSection
                              key={`beers-${breweryId}`}
                              breweryName={breweryName}
                              left={
                                <PairColumn label={`Proposed beers (${proposed.length})`}>
                                  {proposed.length === 0 ? (
                                    <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                                      None
                                    </p>
                                  ) : (
                                    proposed.map((p) => (
                                      <ProposedBeerReleaseAdminCard
                                        key={p.id}
                                        proposed={p}
                                        breweryName={p.breweryName}
                                        onEdit={() => setEditingProposedBeer({ ...p })}
                                        onAccept={() => handleAcceptProposedBeer(p)}
                                        onReject={() => handleRejectProposedBeer(p.id)}
                                        actionsDisabled={pendingKey !== null}
                                        acceptLoading={pendingKey === acceptProposedBeerKey(p.id)}
                                        rejectLoading={pendingKey === rejectProposedBeerKey(p.id)}
                                      />
                                    ))
                                  )}
                                </PairColumn>
                              }
                              right={
                                <PairColumn label={`Beer releases (${releases.length})`}>
                                  {releases.length === 0 ? (
                                    <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                                      None
                                    </p>
                                  ) : (
                                    releases.map((r) => (
                                      <BeerReleaseAdminCard
                                        key={r.id}
                                        release={r}
                                        breweryName={r.breweryName}
                                        onEdit={() => setEditingRelease({ ...r })}
                                        onDelete={() => handleDeleteRelease(r.id)}
                                        actionsDisabled={pendingKey !== null}
                                        deleteLoading={pendingKey === `delete:release:${r.id}`}
                                      />
                                    ))
                                  )}
                                </PairColumn>
                              }
                            />
                          )
                        })}
                      </div>
                    )
                  })()}

                  <ForecastCategoryBlock label={`Food trucks (${dayFoodTrucks.length})`}>
                    {dayFoodTrucks.length === 0 ? (
                      <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                        No food trucks
                      </p>
                    ) : (
                      dayFoodTrucks.map((t) => (
                        <FoodTruckAdminCard
                          key={`${t.id}-${ymd}`}
                          foodTruck={t}
                          breweryName={t.breweryName}
                          showBreweryName
                          onEdit={() => setEditingFoodTruck({ ...t })}
                          onDelete={() => handleDeleteFoodTruck(t.id)}
                          actionsDisabled={pendingKey !== null}
                          deleteLoading={pendingKey === `delete:food-truck:${t.id}`}
                        />
                      ))
                    )}
                  </ForecastCategoryBlock>

                  <ForecastCategoryBlock label={`Happy hour & deals (${dayHappyHourDeals.length})`}>
                    {dayHappyHourDeals.length === 0 ? (
                      <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                        No happy hour / deals
                      </p>
                    ) : (
                      dayHappyHourDeals.map((deal) => (
                        <HappyHourDealAdminCard
                          key={`${deal.id}-${ymd}`}
                          deal={deal}
                          breweryName={deal.breweryName}
                          showBreweryName
                          onEdit={() => setEditingHappyHourDeal({ ...deal })}
                          onDelete={() => handleDeleteHappyHourDeal(deal.id)}
                          actionsDisabled={pendingKey !== null}
                          deleteLoading={pendingKey === `delete:happy-hour:${deal.id}`}
                        />
                      ))
                    )}
                  </ForecastCategoryBlock>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {editing && (
        <EventFormModal
          modalTitle="Edit event"
          event={editing}
          onSave={async (data) => {
            const result = await updateEventInEventsBase(editing.id, data)
            if (result.ok) {
              setEditing(null)
              router.refresh()
            }
            return result
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {editingProposed && (
        <EditProposedEventModal
          proposed={editingProposed}
          onSave={async (data) => {
            const result = await updateProposedEvent(editingProposed.id, data)
            if (result.ok) {
              setEditingProposed(null)
              router.refresh()
            }
            return result
          }}
          onClose={() => setEditingProposed(null)}
        />
      )}

      {editingProposedBeer && (
        <BeerReleaseFormModal
          modalTitle="Edit proposed beer release"
          release={proposedBeerAsReleaseShape(editingProposedBeer)}
          defaultBreweryId={editingProposedBeer.breweryId}
          onSave={async (data: UpdateBeerReleasePayload) => {
            const payload: UpdateProposedBeerReleasePayload = {
              beer_name: data.beer_name,
              description: data.description,
              brewery_id: data.brewery_id,
              ABV: data.ABV,
              Type: data.Type,
              release_date: data.release_date,
              brewery_id2: data.brewery_id2,
              brewery_id3: data.brewery_id3,
            }
            const result = await updateProposedBeerRelease(editingProposedBeer.id, payload)
            if (result.ok) {
              setEditingProposedBeer(null)
              router.refresh()
            }
            return result
          }}
          onClose={() => setEditingProposedBeer(null)}
        />
      )}

      {editingRelease && (
        <BeerReleaseFormModal
          modalTitle="Edit beer release"
          release={editingRelease}
          defaultBreweryId={editingRelease.breweryId}
          onSave={async (data) => {
            const result = await updateBeerReleaseInBase(editingRelease.id, data)
            if (result.ok) {
              setEditingRelease(null)
              router.refresh()
            }
            return result
          }}
          onClose={() => setEditingRelease(null)}
        />
      )}

      {editingFoodTruck && (
        <FoodTruckFormModal
          modalTitle="Edit food truck"
          foodTruck={editingFoodTruck}
          defaultBreweryId={editingFoodTruck.breweryId}
          onSave={async (data) => {
            const result = await updateFoodTruck(editingFoodTruck.id, data)
            if (result.ok) {
              setEditingFoodTruck(null)
              router.refresh()
            }
            return result
          }}
          onClose={() => setEditingFoodTruck(null)}
        />
      )}

      {editingHappyHourDeal && (
        <HappyHourDealFormModal
          modalTitle="Edit happy hour / deal"
          deal={editingHappyHourDeal}
          defaultBreweryId={editingHappyHourDeal.breweryId}
          onSave={async (data) => {
            const result = await updateHappyHourDeal(editingHappyHourDeal.id, data)
            if (result.ok) {
              setEditingHappyHourDeal(null)
              router.refresh()
            }
            return result
          }}
          onClose={() => setEditingHappyHourDeal(null)}
        />
      )}
    </>
  )
}
