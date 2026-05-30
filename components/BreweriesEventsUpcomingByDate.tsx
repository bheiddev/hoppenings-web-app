'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { BeerReleaseFormModal } from '@/components/BeerReleaseFormModal'
import { EventFormModal } from '@/components/EventFormModal'
import {
  deleteBeerReleaseFromBase,
  deleteEventFromEventsBase,
  updateBeerReleaseInBase,
  updateEventInEventsBase,
} from '@/app/breweries-events/actions'
import { BreweryWithData } from '@/lib/breweriesEventsRegions'
import {
  formatMountainWeekDayHeading,
  getMountainDateRangeFromToday,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'
import { BeerRelease, Event } from '@/types/supabase'

const UPCOMING_DAY_COUNT = 3

type EventRow = Event & { breweryName: string; breweryId: string }
type ReleaseRow = BeerRelease & { breweryName: string; breweryId: string }

function normalizeReleaseDate(releaseDate: string | null): string | null {
  if (!releaseDate?.trim()) return null
  return normalizeEventDateToMountainTime(releaseDate)
}

function collectUpcomingByDate(regionBreweries: BreweryWithData[]) {
  const dates = getMountainDateRangeFromToday(UPCOMING_DAY_COUNT)
  const weekStart = dates[0]
  const weekEnd = dates[dates.length - 1]

  const eventsByDay = new Map<string, EventRow[]>()
  const releasesByDay = new Map<string, ReleaseRow[]>()
  for (const d of dates) {
    eventsByDay.set(d, [])
    releasesByDay.set(d, [])
  }

  for (const { brewery, events, releases } of regionBreweries) {
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

  return { dates, eventsByDay, releasesByDay }
}

export function BreweriesEventsUpcomingByDate({
  regionBreweries,
}: {
  regionBreweries: BreweryWithData[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<EventRow | null>(null)
  const [editingRelease, setEditingRelease] = useState<ReleaseRow | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { dates, eventsByDay, releasesByDay } = useMemo(
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

  return (
    <>
      <section
        className="mb-10 border rounded-xl p-6 w-full"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Next {UPCOMING_DAY_COUNT} days
        </h2>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dates.map((ymd, index) => {
            const dayEvents = eventsByDay.get(ymd) ?? []
            const dayReleases = releasesByDay.get(ymd) ?? []

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

                <div className="flex-1">
                  <p
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wide border-b"
                    style={{
                      color: Colors.textSecondary,
                      borderColor: Colors.dividerLight,
                      backgroundColor: Colors.background,
                    }}
                  >
                    Events ({dayEvents.length})
                  </p>
                  <div className="divide-y" style={{ borderColor: Colors.dividerLight }}>
                    {dayEvents.length === 0 ? (
                      <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                        No events
                      </p>
                    ) : (
                      dayEvents.map((e) => (
                        <div
                          key={`${e.id}-${e.event_date}`}
                          className="p-3 flex flex-col gap-2"
                          style={{ borderColor: Colors.dividerLight }}
                        >
                          <div className="min-w-0">
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: Colors.textSecondary }}
                            >
                              {e.breweryName}
                            </p>
                            <p
                              className="text-sm font-semibold break-words"
                              style={{ color: Colors.textDark }}
                            >
                              {e.title || '—'}
                            </p>
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
                      ))
                    )}
                  </div>

                  <p
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wide border-y"
                    style={{
                      color: Colors.textSecondary,
                      borderColor: Colors.dividerLight,
                      backgroundColor: Colors.background,
                    }}
                  >
                    Beer releases ({dayReleases.length})
                  </p>
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
    </>
  )
}
