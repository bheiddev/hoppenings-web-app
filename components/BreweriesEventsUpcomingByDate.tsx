'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { BeerReleaseFormModal } from '@/components/BeerReleaseFormModal'
import { EventFormModal } from '@/components/EventFormModal'
import { FoodTruckFormModal } from '@/components/FoodTruckFormModal'
import { EditProposedEventModal } from '@/components/ProposedEventsTable'
import {
  AdminColumnScrollBody,
  AdminSectionHeader,
  BeerReleaseAdminCard,
  EventAdminCard,
  FoodTruckAdminCard,
  ProposedEventAdminCard,
} from '@/components/breweriesEventsAdminCards'
import {
  acceptProposedEvent,
  deleteBeerReleaseFromBase,
  deleteEventFromEventsBase,
  deleteFoodTruck,
  rejectProposedEvent,
  updateBeerReleaseInBase,
  updateEventInEventsBase,
  updateFoodTruck,
  updateProposedEvent,
} from '@/app/admin/actions'
import { BreweryWithData } from '@/lib/breweriesEventsRegions'
import { foodTruckShowsOnDate, isDateSpecificFoodTruck } from '@/lib/foodTrucks'
import {
  formatEventDateShort,
  formatRelativeEventDateHeading,
  getMountainDateRangeFromToday,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'
import { BeerRelease, Event, FoodTruck, ProposedEvent } from '@/types/supabase'

/** Days shown in one carousel page. */
const VISIBLE_DAY_COUNT = 5
/** How far ahead the carousel can page. */
const FORECAST_HORIZON_DAYS = 60

type EventRow = Event & { breweryName: string; breweryId: string }
type ProposedRow = ProposedEvent & { breweryName: string; breweryId: string }
type ReleaseRow = BeerRelease & { breweryName: string; breweryId: string }
type FoodTruckRow = FoodTruck & { breweryName: string; breweryId: string }

function acceptProposedKey(id: number) {
  return `accept:proposed:${id}`
}

function rejectProposedKey(id: number) {
  return `reject:proposed:${id}`
}

function normalizeReleaseDate(releaseDate: string | null): string | null {
  if (!releaseDate?.trim()) return null
  return normalizeEventDateToMountainTime(releaseDate)
}

function forecastDayHeading(ymd: string): string {
  const relative = formatRelativeEventDateHeading(ymd)
  if (relative === 'Today' || relative === 'Tomorrow') return relative
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

function collectUpcomingByDate(regionBreweries: BreweryWithData[]) {
  const dates = getMountainDateRangeFromToday(FORECAST_HORIZON_DAYS)
  const weekStart = dates[0]
  const weekEnd = dates[dates.length - 1]

  const breweryNameById = new Map(
    regionBreweries.map(({ brewery }) => [brewery.id, brewery.name] as const)
  )
  const eventsByDay = new Map<string, EventRow[]>()
  const proposedByDay = new Map<string, ProposedRow[]>()
  const releasesByDay = new Map<string, ReleaseRow[]>()
  const foodTrucksByDay = new Map<string, FoodTruckRow[]>()
  for (const d of dates) {
    eventsByDay.set(d, [])
    proposedByDay.set(d, [])
    releasesByDay.set(d, [])
    foodTrucksByDay.set(d, [])
  }

  const seenProposedIds = new Set<number>()

  for (const { brewery, events, proposedEvents, releases, foodTrucks } of regionBreweries) {
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
    for (const truck of foodTrucks.filter(isDateSpecificFoodTruck)) {
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

  return { dates, eventsByDay, proposedByDay, releasesByDay, foodTrucksByDay }
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
  const [editingRelease, setEditingRelease] = useState<ReleaseRow | null>(null)
  const [editingFoodTruck, setEditingFoodTruck] = useState<FoodTruckRow | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [windowStart, setWindowStart] = useState(0)
  const { dates, eventsByDay, proposedByDay, releasesByDay, foodTrucksByDay } = useMemo(
    () => collectUpcomingByDate(regionBreweries),
    [regionBreweries]
  )

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
                5-day forecast
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
              aria-label="Previous 5 days"
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
              aria-label="Next 5 days"
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {visibleDates.map((ymd) => {
            const dayEvents = eventsByDay.get(ymd) ?? []
            const dayProposed = proposedByDay.get(ymd) ?? []
            const dayReleases = releasesByDay.get(ymd) ?? []
            const dayFoodTrucks = foodTrucksByDay.get(ymd) ?? []

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
                  <ForecastCategoryBlock label={`Proposed (${dayProposed.length})`}>
                    {dayProposed.length === 0 ? (
                      <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                        No proposed events
                      </p>
                    ) : (
                      dayProposed.map((p) => (
                        <ProposedEventAdminCard
                          key={p.id}
                          proposed={p}
                          breweryName={p.breweryName}
                          showBreweryName
                          onEdit={() => setEditingProposed({ ...p })}
                          onAccept={() => handleAcceptProposed(p)}
                          onReject={() => handleRejectProposed(p.id)}
                          actionsDisabled={pendingKey !== null}
                          acceptLoading={pendingKey === acceptProposedKey(p.id)}
                          rejectLoading={pendingKey === rejectProposedKey(p.id)}
                        />
                      ))
                    )}
                  </ForecastCategoryBlock>

                  <ForecastCategoryBlock label={`Events (${dayEvents.length})`}>
                    {dayEvents.length === 0 ? (
                      <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                        No events
                      </p>
                    ) : (
                      dayEvents.map((e) => (
                        <EventAdminCard
                          key={`${e.id}-${e.event_date}`}
                          event={e}
                          breweryName={e.breweryName}
                          showBreweryName
                          onEdit={() => setEditing({ ...e })}
                          onDelete={() => handleDeleteEvent(e.id)}
                          actionsDisabled={pendingKey !== null}
                          deleteLoading={pendingKey === `delete:event:${e.id}`}
                        />
                      ))
                    )}
                  </ForecastCategoryBlock>

                  <ForecastCategoryBlock label={`Beer releases (${dayReleases.length})`}>
                    {dayReleases.length === 0 ? (
                      <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                        No beer releases
                      </p>
                    ) : (
                      dayReleases.map((r) => (
                        <BeerReleaseAdminCard
                          key={r.id}
                          release={r}
                          breweryName={r.breweryName}
                          showBreweryName
                          onEdit={() => setEditingRelease({ ...r })}
                          onDelete={() => handleDeleteRelease(r.id)}
                          actionsDisabled={pendingKey !== null}
                          deleteLoading={pendingKey === `delete:release:${r.id}`}
                        />
                      ))
                    )}
                  </ForecastCategoryBlock>

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
    </>
  )
}
