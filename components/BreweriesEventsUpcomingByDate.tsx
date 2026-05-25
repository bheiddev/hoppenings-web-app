import { Colors } from '@/lib/colors'
import { BreweryWithData, breweryAnchorId } from '@/lib/breweriesEventsRegions'
import {
  formatEventDate,
  formatMountainWeekDayHeading,
  formatTime12Hour,
  getMountainDateRangeFromToday,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'
import { Event, BeerRelease } from '@/types/supabase'

const UPCOMING_DAY_COUNT = 3

type EventRow = Event & { breweryName: string; breweryId: string }
type ReleaseRow = BeerRelease & { breweryName: string; breweryId: string }

function normalizeReleaseDate(releaseDate: string | null): string | null {
  if (!releaseDate?.trim()) return null
  return normalizeEventDateToMountainTime(releaseDate)
}

function recurringLabel(event: Event): string | null {
  if (event.is_recurring_monthly) return 'Monthly'
  if (event.is_recurring_biweekly) return 'Biweekly'
  if (event.is_recurring) return 'Weekly'
  return null
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
      const tA = a.start_time ?? ''
      const tB = b.start_time ?? ''
      if (tA !== tB) return tA.localeCompare(tB)
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
  const { dates, eventsByDay, releasesByDay } = collectUpcomingByDate(regionBreweries)
  const rangeEndLabel = formatEventDate(dates[dates.length - 1])

  return (
    <section
      className="mb-10 border rounded-xl p-6 w-full"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}
    >
      <h2
        className="text-xl font-bold mb-1"
        style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
      >
        Next {UPCOMING_DAY_COUNT} days
      </h2>
      <p className="text-sm mb-6" style={{ color: Colors.textSecondary }}>
        Mountain Time · today through {rangeEndLabel}. Use brewery links below each day to jump to
        edit tables.
      </p>

      <div className="space-y-8">
        {dates.map((ymd, index) => {
          const dayEvents = eventsByDay.get(ymd) ?? []
          const dayReleases = releasesByDay.get(ymd) ?? []
          const isEmpty = dayEvents.length === 0 && dayReleases.length === 0

          return (
            <div
              key={ymd}
              className="border-t pt-6 first:border-t-0 first:pt-0"
              style={{ borderColor: Colors.dividerLight }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
              >
                {formatMountainWeekDayHeading(ymd, index)}
              </h3>

              {isEmpty ? (
                <p className="text-sm" style={{ color: Colors.textSecondary }}>
                  Nothing scheduled in this region.
                </p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: Colors.textDark }}>
                      Events ({dayEvents.length})
                    </p>
                    {dayEvents.length === 0 ? (
                      <p className="text-sm" style={{ color: Colors.textSecondary }}>
                        No events
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse min-w-[32rem]">
                          <thead style={{ backgroundColor: Colors.backgroundLight }}>
                            <tr>
                              <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                                Time
                              </th>
                              <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                                Event
                              </th>
                              <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                                Brewery
                              </th>
                              <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody style={{ color: Colors.textDark }}>
                            {dayEvents.map((e) => {
                              const recur = recurringLabel(e)
                              return (
                                <tr
                                  key={`${e.id}-${e.event_date}`}
                                  className="border-t align-top"
                                  style={{ borderColor: Colors.dividerLight }}
                                >
                                  <td className="p-2 whitespace-nowrap">
                                    {e.start_time ? formatTime12Hour(e.start_time) : '—'}
                                    {e.end_time ? (
                                      <span className="text-xs block" style={{ color: Colors.textSecondary }}>
                                        to {formatTime12Hour(e.end_time)}
                                      </span>
                                    ) : null}
                                  </td>
                                  <td className="p-2">
                                    <span className="font-medium">{e.title || '—'}</span>
                                    {e.featured ? (
                                      <span
                                        className="ml-2 text-xs px-1.5 py-0.5 rounded"
                                        style={{
                                          backgroundColor: Colors.primary,
                                          color: Colors.primaryDark,
                                        }}
                                      >
                                        Featured
                                      </span>
                                    ) : null}
                                  </td>
                                  <td className="p-2">
                                    <a
                                      href={`#${breweryAnchorId(e.breweryId)}`}
                                      className="underline hover:opacity-80"
                                      style={{ color: Colors.primary }}
                                    >
                                      {e.breweryName}
                                    </a>
                                  </td>
                                  <td className="p-2 text-xs">
                                    {recur ? (
                                      <span className="block" style={{ color: Colors.textSecondary }}>
                                        {recur}
                                      </span>
                                    ) : null}
                                    {e.cost != null ? (
                                      <span className="block">Cost: {e.cost}</span>
                                    ) : null}
                                    {e.description?.trim() ? (
                                      <span className="block line-clamp-2">{e.description}</span>
                                    ) : null}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: Colors.textDark }}>
                      Beer releases ({dayReleases.length})
                    </p>
                    {dayReleases.length === 0 ? (
                      <p className="text-sm" style={{ color: Colors.textSecondary }}>
                        No beer releases
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse min-w-[28rem]">
                          <thead style={{ backgroundColor: Colors.backgroundLight }}>
                            <tr>
                              <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                                Beer
                              </th>
                              <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                                Brewery
                              </th>
                              <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                                Type / ABV
                              </th>
                            </tr>
                          </thead>
                          <tbody style={{ color: Colors.textDark }}>
                            {dayReleases.map((r) => (
                              <tr
                                key={r.id}
                                className="border-t align-top"
                                style={{ borderColor: Colors.dividerLight }}
                              >
                                <td className="p-2 font-medium">{r.beer_name || '—'}</td>
                                <td className="p-2">
                                  <a
                                    href={`#${breweryAnchorId(r.breweryId)}`}
                                    className="underline hover:opacity-80"
                                    style={{ color: Colors.primary }}
                                  >
                                    {r.breweryName}
                                  </a>
                                </td>
                                <td className="p-2 text-xs">
                                  {[r.Type, r.ABV].filter(Boolean).join(' · ') || '—'}
                                  {r.description?.trim() ? (
                                    <span className="block mt-1 line-clamp-2">{r.description}</span>
                                  ) : null}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
