'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { BeerReleaseFormModal } from '@/components/BeerReleaseFormModal'
import { EventFormModal } from '@/components/EventFormModal'
import { FoodTruckFormModal } from '@/components/FoodTruckFormModal'
import {
  deleteBeerReleaseFromBase,
  deleteEventFromEventsBase,
  deleteFoodTruck,
  updateBeerReleaseInBase,
  updateEventInEventsBase,
  updateFoodTruck,
} from '@/app/breweries-events/actions'
import { BreweryWithData } from '@/lib/breweriesEventsRegions'
import {
  formatMountainWeekDayHeading,
  getMountainDateRangeFromToday,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'
import { BeerRelease, Event, FoodTruck } from '@/types/supabase'

const UPCOMING_DAY_COUNT = 5

type EventRow = Event & { breweryName: string; breweryId: string }
type ReleaseRow = BeerRelease & { breweryName: string; breweryId: string }
type FoodTruckRow = FoodTruck & { breweryName: string; breweryId: string }

function normalizeReleaseDate(releaseDate: string | null): string | null {
  if (!releaseDate?.trim()) return null
  return normalizeEventDateToMountainTime(releaseDate)
}

function isDateSpecificFoodTruck(truck: FoodTruck): boolean {
  return truck.permanent !== true
}

function formatEventCost(cost: number | null): string {
  if (cost == null) return '—'
  return `$${cost.toFixed(2)}`
}

function isEventRecurring(
  event: Pick<Event, 'is_recurring' | 'is_recurring_biweekly' | 'is_recurring_monthly'>
): boolean {
  return !!(event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly)
}

function formatEventRecurrence(
  event: Pick<Event, 'is_recurring' | 'is_recurring_biweekly' | 'is_recurring_monthly'>
): string {
  if (!isEventRecurring(event)) return 'One Time'
  if (event.is_recurring) return 'Weekly'
  if (event.is_recurring_biweekly) return 'Biweekly'
  if (event.is_recurring_monthly) return 'Monthly'
  return 'One Time'
}

const sectionHeaderStyle = {
  color: Colors.textPrimary,
  borderColor: Colors.dividerLight,
  backgroundColor: Colors.backgroundMedium,
} as const

function SectionHeader({ label, className = '' }: { label: string; className?: string }) {
  return (
    <p
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide border-y ${className}`}
      style={sectionHeaderStyle}
    >
      {label}
    </p>
  )
}

function FeaturedIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="flex-shrink-0"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 18.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function RecurringIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="flex-shrink-0"
    >
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  )
}

function foodTruckShowsOnDate(truck: FoodTruck, ymd: string): boolean {
  if (!isDateSpecificFoodTruck(truck) || !truck.date) return false
  return normalizeEventDateToMountainTime(truck.date) === ymd
}

function collectUpcomingByDate(regionBreweries: BreweryWithData[]) {
  const dates = getMountainDateRangeFromToday(UPCOMING_DAY_COUNT)
  const weekStart = dates[0]
  const weekEnd = dates[dates.length - 1]

  const eventsByDay = new Map<string, EventRow[]>()
  const releasesByDay = new Map<string, ReleaseRow[]>()
  const foodTrucksByDay = new Map<string, FoodTruckRow[]>()
  for (const d of dates) {
    eventsByDay.set(d, [])
    releasesByDay.set(d, [])
    foodTrucksByDay.set(d, [])
  }

  for (const { brewery, events, releases, foodTrucks } of regionBreweries) {
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

  return { dates, eventsByDay, releasesByDay, foodTrucksByDay }
}

export function BreweriesEventsUpcomingByDate({
  regionBreweries,
}: {
  regionBreweries: BreweryWithData[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<EventRow | null>(null)
  const [editingRelease, setEditingRelease] = useState<ReleaseRow | null>(null)
  const [editingFoodTruck, setEditingFoodTruck] = useState<FoodTruckRow | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { dates, eventsByDay, releasesByDay, foodTrucksByDay } = useMemo(
    () => collectUpcomingByDate(regionBreweries),
    [regionBreweries]
  )

  async function handleDeleteEvent(eventId: string) {
    setActionError(null)
    setLoadingId(eventId)
    try {
      const result = await deleteEventFromEventsBase(eventId)
      setLoadingId(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setLoadingId(null)
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleDeleteRelease(releaseId: string) {
    setActionError(null)
    setLoadingId(releaseId)
    try {
      const result = await deleteBeerReleaseFromBase(releaseId)
      setLoadingId(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setLoadingId(null)
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleDeleteFoodTruck(foodTruckId: number) {
    setActionError(null)
    const loadingKey = `food-truck-${foodTruckId}`
    setLoadingId(loadingKey)
    try {
      const result = await deleteFoodTruck(foodTruckId)
      setLoadingId(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setLoadingId(null)
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <>
      <section
        className="mb-10 border rounded-xl p-6 w-full"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}
      >
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
          {dates.map((ymd, index) => {
            const dayEvents = eventsByDay.get(ymd) ?? []
            const dayReleases = releasesByDay.get(ymd) ?? []
            const dayFoodTrucks = foodTrucksByDay.get(ymd) ?? []

            return (
              <div
                key={ymd}
                className="flex flex-col min-w-0 border rounded-lg overflow-hidden"
                style={{ borderColor: Colors.dividerLight }}
              >
                <div
                  className="px-3 py-2 border-b"
                  style={{
                    borderColor: Colors.dividerLight,
                    backgroundColor: Colors.backgroundLight,
                  }}
                >
                  <h3
                    className="text-sm font-semibold leading-snug"
                    style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
                  >
                    {formatMountainWeekDayHeading(ymd, index)}
                  </h3>
                </div>

                <SectionHeader label={`Events (${dayEvents.length})`} />

                <div className="flex-1">
                  <div className="divide-y" style={{ borderColor: Colors.dividerLight }}>
                    {dayEvents.length === 0 ? (
                      <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                        No events
                      </p>
                    ) : (
                      dayEvents.map((e) => {
                        const recurring = isEventRecurring(e)
                        return (
                        <div
                          key={`${e.id}-${e.event_date}`}
                          className="p-3 flex gap-3"
                          style={{
                            borderColor: Colors.dividerLight,
                            backgroundColor: e.featured
                              ? 'rgba(248, 199, 1, 0.12)'
                              : Colors.background,
                          }}
                        >
                          <div className="min-w-0 flex-1 flex flex-col gap-2">
                            <div className="min-w-0">
                              <p
                                className="text-xs font-medium truncate"
                                style={{ color: Colors.textSecondary }}
                              >
                                {e.breweryName}
                              </p>
                              <div className="flex items-start gap-1.5">
                                {(e.featured || recurring) && (
                                  <span className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                                    {e.featured && (
                                      <span
                                        title="Featured"
                                        style={{ color: Colors.primary }}
                                      >
                                        <FeaturedIcon />
                                      </span>
                                    )}
                                    {recurring && (
                                      <span
                                        title={formatEventRecurrence(e)}
                                        style={{ color: Colors.info }}
                                      >
                                        <RecurringIcon />
                                      </span>
                                    )}
                                  </span>
                                )}
                                <p
                                  className="text-sm font-semibold break-words min-w-0"
                                  style={{ color: Colors.textDark }}
                                >
                                  {e.title || '—'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => setEditing({ ...e })}
                                disabled={!!loadingId}
                                className="px-2 py-1 text-xs rounded border"
                                style={{
                                  borderColor: Colors.primary,
                                  color: Colors.textDark,
                                  backgroundColor: Colors.background,
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEvent(e.id)}
                                disabled={!!loadingId}
                                className="px-2 py-1 text-xs rounded border"
                                style={{
                                  borderColor: Colors.error,
                                  color: Colors.textDark,
                                  backgroundColor: Colors.background,
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div
                            className="flex flex-col items-end gap-1 flex-shrink-0 text-right"
                            style={{ color: Colors.textSecondary }}
                          >
                            <span className="text-xs font-medium whitespace-nowrap">
                              {formatEventCost(e.cost)}
                            </span>
                            <span className="text-xs whitespace-nowrap">
                              {formatEventRecurrence(e)}
                            </span>
                          </div>
                        </div>
                        )
                      })
                    )}
                  </div>

                  <SectionHeader label={`Beer releases (${dayReleases.length})`} />
                  <div className="divide-y" style={{ borderColor: Colors.dividerLight }}>
                    {dayReleases.length === 0 ? (
                      <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                        No beer releases
                      </p>
                    ) : (
                      dayReleases.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 flex flex-col gap-2"
                          style={{ borderColor: Colors.dividerLight }}
                        >
                          <div className="min-w-0">
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: Colors.textSecondary }}
                            >
                              {r.breweryName}
                            </p>
                            <p
                              className="text-sm font-semibold break-words"
                              style={{ color: Colors.textDark }}
                            >
                              {r.beer_name || '—'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingRelease({ ...r })}
                              disabled={!!loadingId}
                              className="px-2 py-1 text-xs rounded border"
                              style={{
                                borderColor: Colors.primary,
                                color: Colors.textDark,
                                backgroundColor: Colors.background,
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRelease(r.id)}
                              disabled={!!loadingId}
                              className="px-2 py-1 text-xs rounded border"
                              style={{
                                borderColor: Colors.error,
                                color: Colors.textDark,
                                backgroundColor: Colors.background,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <SectionHeader label={`Food trucks (${dayFoodTrucks.length})`} />
                  <div className="divide-y" style={{ borderColor: Colors.dividerLight }}>
                    {dayFoodTrucks.length === 0 ? (
                      <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                        No food trucks
                      </p>
                    ) : (
                      dayFoodTrucks.map((t) => (
                        <div
                          key={`${t.id}-${ymd}`}
                          className="p-3 flex flex-col gap-2"
                          style={{ borderColor: Colors.dividerLight }}
                        >
                          <div className="min-w-0">
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: Colors.textSecondary }}
                            >
                              {t.breweryName}
                            </p>
                            <p
                              className="text-sm font-semibold break-words"
                              style={{ color: Colors.textDark }}
                            >
                              {t.name || '—'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingFoodTruck({ ...t })}
                              disabled={!!loadingId}
                              className="px-2 py-1 text-xs rounded border"
                              style={{
                                borderColor: Colors.primary,
                                color: Colors.textDark,
                                backgroundColor: Colors.background,
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFoodTruck(t.id)}
                              disabled={!!loadingId}
                              className="px-2 py-1 text-xs rounded border"
                              style={{
                                borderColor: Colors.error,
                                color: Colors.textDark,
                                backgroundColor: Colors.background,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
