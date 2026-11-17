'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { BeerReleaseFormModal } from '@/components/BeerReleaseFormModal'
import { EventFormModal } from '@/components/EventFormModal'
import { FoodTruckFormModal } from '@/components/FoodTruckFormModal'
import { HappyHourDealFormModal } from '@/components/HappyHourDealFormModal'
import { EditProposedEventModal } from '@/components/ProposedEventsTable'
import { AdminDeleteAllButton } from '@/components/breweriesEventsAdminButtons'
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
  deleteBeerReleasesFromBase,
  deleteEventFromEventsBase,
  deleteEventsFromEventsBase,
  deleteFoodTruck,
  deleteFoodTrucks,
  deleteHappyHourDeal,
  deleteHappyHourDeals,
  rejectProposedBeerRelease,
  rejectProposedBeerReleases,
  rejectProposedEvent,
  rejectProposedEvents,
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
import {
  happyHourDealIsTodayOrFuture,
  happyHourDealShowsOnDate,
} from '@/lib/happyHourDeals'
import {
  formatEventDateShort,
  formatRelativeEventDateHeading,
  getMountainDateRangeFromToday,
  normalizeEventDateToMountainTime,
  shouldShowEventOnListings,
} from '@/lib/utils'
import {
  BeerRelease,
  Event,
  FoodTruck,
  HappyHourDeal,
  ProposedBeerRelease,
  ProposedEvent,
} from '@/types/supabase'

/** Today + next 6 Mountain days for the week glance strip. */
const WEEK_HORIZON_DAYS = 7

type EventRow = Event & { breweryName: string; breweryId: string }
type ProposedRow = ProposedEvent & { breweryName: string; breweryId: string }
type ProposedBeerRow = ProposedBeerRelease & { breweryName: string; breweryId: string }
type ReleaseRow = BeerRelease & { breweryName: string; breweryId: string }
type FoodTruckRow = FoodTruck & { breweryName: string; breweryId: string }
type HappyHourDealRow = HappyHourDeal & { breweryName: string; breweryId: string }

type DayCounts = {
  proposedEvents: number
  proposedBeers: number
  events: number
  releases: number
  happyHours: number
  foodTrucks: number
}

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

function dayBoardHeading(ymd: string): string {
  return formatRelativeEventDateHeading(ymd)
}

function CategoryBlock({
  label,
  action,
  children,
}: {
  label: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className="border rounded-lg overflow-hidden min-w-0"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <AdminSectionHeader label={label} action={action} />
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
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:divide-x"
        style={{ borderColor: Colors.dividerLight }}
      >
        <div className="min-w-0 border-b sm:border-b-0" style={{ borderColor: Colors.dividerLight }}>
          {left}
        </div>
        <div className="min-w-0">{right}</div>
      </div>
    </div>
  )
}

function PairColumn({
  label,
  action,
  children,
}: {
  label: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col min-h-0">
      <div
        className="px-3 py-1.5 border-b text-xs font-semibold flex items-center justify-between gap-2"
        style={{
          borderColor: Colors.dividerLight,
          color: Colors.textSecondary,
          backgroundColor: Colors.surfaceMedium,
        }}
      >
        <span className="min-w-0">{label}</span>
        {action}
      </div>
      <AdminColumnScrollBody>{children}</AdminColumnScrollBody>
    </div>
  )
}

function CountStat({
  label,
  value,
  emphasize,
}: {
  label: string
  value: number
  emphasize?: boolean
}) {
  return (
    <span
      className="tabular-nums"
      style={{
        color: emphasize && value > 0 ? Colors.primaryDark : Colors.textSecondary,
        fontWeight: emphasize && value > 0 ? 600 : 400,
      }}
    >
      <span style={{ color: Colors.textMuted }}>{label} </span>
      {value}
    </span>
  )
}

function WeekGlanceStrip({
  dates,
  selectedDate,
  onSelect,
  countsByDay,
}: {
  dates: string[]
  selectedDate: string
  onSelect: (ymd: string) => void
  countsByDay: Map<string, DayCounts>
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2 mb-6">
      {dates.map((ymd, index) => {
        const counts = countsByDay.get(ymd) ?? {
          proposedEvents: 0,
          proposedBeers: 0,
          events: 0,
          releases: 0,
          happyHours: 0,
          foodTrucks: 0,
        }
        const selected = ymd === selectedDate
        const needsReview = counts.proposedEvents + counts.proposedBeers
        const title =
          index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : formatEventDateShort(ymd).split(',')[0]
        const subtitle = formatEventDateShort(ymd)

        return (
          <button
            key={ymd}
            type="button"
            onClick={() => onSelect(ymd)}
            className="text-left rounded-lg border px-2.5 py-2 transition-opacity hover:opacity-90"
            style={{
              borderColor: selected ? Colors.primaryDark : Colors.dividerLight,
              backgroundColor: selected ? Colors.surfaceLight : Colors.surface,
              boxShadow: selected ? `inset 0 0 0 1px ${Colors.primaryDark}` : undefined,
            }}
          >
            <div className="flex items-baseline justify-between gap-1 mb-1">
              <span
                className="text-sm font-semibold leading-tight"
                style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                {title}
              </span>
              {needsReview > 0 ? (
                <span
                  className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: Colors.accent, color: Colors.primaryDark }}
                >
                  {needsReview} review
                </span>
              ) : null}
            </div>
            <p className="text-[10px] mb-1.5 leading-tight" style={{ color: Colors.textMuted }}>
              {subtitle}
            </p>
            <div className="flex flex-col gap-0.5 text-[11px] leading-snug">
              <CountStat label="Prop. events" value={counts.proposedEvents} emphasize />
              <CountStat label="Prop. beers" value={counts.proposedBeers} emphasize />
              <CountStat label="Events" value={counts.events} />
              <CountStat label="Beers" value={counts.releases} />
              <CountStat label="HH / deals" value={counts.happyHours} />
              <CountStat label="Food trucks" value={counts.foodTrucks} />
            </div>
          </button>
        )
      })}
    </div>
  )
}

function collectUpcomingByDate(regionBreweries: BreweryWithData[]) {
  const dates = getMountainDateRangeFromToday(WEEK_HORIZON_DAYS)
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
      if (!shouldShowEventOnListings(event)) continue
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
      if (
        !shouldShowEventOnListings({
          event_date: proposed.event_date,
          is_recurring: Boolean(proposed.is_recurring),
          is_recurring_biweekly: Boolean(proposed.is_recurring_biweekly),
          is_recurring_monthly: Boolean(proposed.is_recurring_monthly),
        })
      ) {
        continue
      }
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
      if (!happyHourDealIsTodayOrFuture(deal, weekStart)) continue
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

  const countsByDay = new Map<string, DayCounts>()
  for (const d of dates) {
    countsByDay.set(d, {
      proposedEvents: proposedByDay.get(d)?.length ?? 0,
      proposedBeers: proposedBeersByDay.get(d)?.length ?? 0,
      events: eventsByDay.get(d)?.length ?? 0,
      releases: releasesByDay.get(d)?.length ?? 0,
      happyHours: happyHourDealsByDay.get(d)?.length ?? 0,
      foodTrucks: foodTrucksByDay.get(d)?.length ?? 0,
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
    countsByDay,
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
  const {
    dates,
    eventsByDay,
    proposedByDay,
    proposedBeersByDay,
    releasesByDay,
    foodTrucksByDay,
    happyHourDealsByDay,
    countsByDay,
  } = useMemo(() => collectUpcomingByDate(regionBreweries), [regionBreweries])

  const todayYmd = dates[0] ?? ''
  const [selectedDate, setSelectedDate] = useState(todayYmd)
  const ymd = dates.includes(selectedDate) ? selectedDate : todayYmd

  const dayEvents = eventsByDay.get(ymd) ?? []
  const dayProposed = proposedByDay.get(ymd) ?? []
  const dayProposedBeers = proposedBeersByDay.get(ymd) ?? []
  const dayReleases = releasesByDay.get(ymd) ?? []
  const dayFoodTrucks = foodTrucksByDay.get(ymd) ?? []
  const dayHappyHourDeals = happyHourDealsByDay.get(ymd) ?? []
  const needsReviewCount = dayProposed.length + dayProposedBeers.length

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

  async function handleRejectAllProposed(ids: number[], pendingKeyForAll: string) {
    if (ids.length === 0) return
    setActionError(null)
    setPendingKey(pendingKeyForAll)
    try {
      const result = await rejectProposedEvents(ids)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete proposed events')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete all failed')
    }
  }

  async function handleRejectAllProposedBeers(ids: number[], pendingKeyForAll: string) {
    if (ids.length === 0) return
    setActionError(null)
    setPendingKey(pendingKeyForAll)
    try {
      const result = await rejectProposedBeerReleases(ids)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete proposed beer releases')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete all failed')
    }
  }

  async function handleDeleteAllEvents(ids: string[], pendingKeyForAll: string) {
    if (ids.length === 0) return
    setActionError(null)
    setPendingKey(pendingKeyForAll)
    try {
      const result = await deleteEventsFromEventsBase(ids)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete events')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete all failed')
    }
  }

  async function handleDeleteAllReleases(ids: string[], pendingKeyForAll: string) {
    if (ids.length === 0) return
    setActionError(null)
    setPendingKey(pendingKeyForAll)
    try {
      const result = await deleteBeerReleasesFromBase(ids)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete beer releases')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete all failed')
    }
  }

  async function handleDeleteAllFoodTrucks(ids: number[], pendingKeyForAll: string) {
    if (ids.length === 0) return
    setActionError(null)
    setPendingKey(pendingKeyForAll)
    try {
      const result = await deleteFoodTrucks(ids)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete food trucks')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete all failed')
    }
  }

  async function handleDeleteAllHappyHourDeals(ids: string[], pendingKeyForAll: string) {
    if (ids.length === 0) return
    setActionError(null)
    setPendingKey(pendingKeyForAll)
    try {
      const result = await deleteHappyHourDeals(ids)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete happy hour deals')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete all failed')
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

  const rejectAllProposedKey = `reject-all:proposed:${ymd}`
  const rejectAllProposedBeersKey = `reject-all:proposed-beer:${ymd}`

  return (
    <>
      <section
        className="border rounded-xl p-6 w-full"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
      >
        <div className="mb-4">
          <h2
            className="text-xl font-bold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            {title ?? 'Today'}
          </h2>
          <p className="text-xs mt-1" style={{ color: Colors.textMuted }}>
            {subtitle ??
              'Week at a glance — pick a day, clear proposed approvals, then scan live content.'}
          </p>
        </div>

        <WeekGlanceStrip
          dates={dates}
          selectedDate={ymd}
          onSelect={setSelectedDate}
          countsByDay={countsByDay}
        />

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

        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surfaceMedium }}
        >
          <div
            className="px-4 py-3 border-b flex flex-wrap items-baseline justify-between gap-2"
            style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surfaceLight }}
          >
            <h3
              className="text-base font-semibold"
              style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
            >
              {dayBoardHeading(ymd)}
            </h3>
            <p className="text-xs" style={{ color: Colors.textMuted }}>
              {formatEventDateShort(ymd)}
              {needsReviewCount > 0
                ? ` · ${needsReviewCount} need${needsReviewCount === 1 ? 's' : ''} review`
                : ' · inbox clear'}
            </p>
          </div>

          <div className="p-4 flex flex-col gap-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4
                  className="text-sm font-semibold"
                  style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  Needs review
                </h4>
                {needsReviewCount === 0 ? (
                  <span className="text-xs" style={{ color: Colors.success }}>
                    Inbox clear
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div
                  className="border rounded-lg overflow-hidden min-w-0"
                  style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
                >
                  <AdminSectionHeader
                    label={`Proposed events (${dayProposed.length})`}
                    action={
                      <AdminDeleteAllButton
                        count={dayProposed.length}
                        itemLabel="proposed events"
                        disabled={pendingKey !== null}
                        loading={pendingKey === rejectAllProposedKey}
                        onConfirm={() =>
                          handleRejectAllProposed(
                            dayProposed.map((p) => p.id),
                            rejectAllProposedKey
                          )
                        }
                      />
                    }
                  />
                  <div
                    className="p-3 flex flex-col gap-3 max-h-[32rem] overflow-y-auto"
                    style={{ backgroundColor: Colors.surfaceMedium }}
                  >
                    {dayProposed.length === 0 ? (
                      <p className="text-sm px-1" style={{ color: Colors.textSecondary }}>
                        No proposed events
                      </p>
                    ) : (
                      groupByBrewery(dayProposed).map(({ breweryId, breweryName, items: proposed }) => {
                        const liveEvents = dayEvents.filter((e) => e.breweryId === breweryId)
                        const rejectBreweryKey = `reject-all:proposed:${breweryId}:${ymd}`
                        return (
                          <BreweryPairSection
                            key={`proposed-events-${breweryId}`}
                            breweryName={breweryName}
                            left={
                              <PairColumn
                                label={`Proposed (${proposed.length})`}
                                action={
                                  <AdminDeleteAllButton
                                    count={proposed.length}
                                    itemLabel="proposed events"
                                    scopeLabel={breweryName}
                                    disabled={pendingKey !== null}
                                    loading={pendingKey === rejectBreweryKey}
                                    onConfirm={() =>
                                      handleRejectAllProposed(
                                        proposed.map((p) => p.id),
                                        rejectBreweryKey
                                      )
                                    }
                                  />
                                }
                              >
                                {proposed.map((p) => (
                                  <ProposedEventAdminCard
                                    key={p.id}
                                    proposed={p}
                                    onEdit={() => setEditingProposed({ ...p })}
                                    onAccept={() => handleAcceptProposed(p)}
                                    onReject={() => handleRejectProposed(p.id)}
                                    actionsDisabled={pendingKey !== null}
                                    acceptLoading={pendingKey === acceptProposedKey(p.id)}
                                    rejectLoading={pendingKey === rejectProposedKey(p.id)}
                                  />
                                ))}
                              </PairColumn>
                            }
                            right={
                              <PairColumn label={`Also live today (${liveEvents.length})`}>
                                {liveEvents.length === 0 ? (
                                  <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                                    No other events today
                                  </p>
                                ) : (
                                  liveEvents.map((e) => (
                                    <EventAdminCard
                                      key={`compare-event-${e.id}-${e.event_date}`}
                                      event={e}
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
                      })
                    )}
                  </div>
                </div>

                <div
                  className="border rounded-lg overflow-hidden min-w-0"
                  style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
                >
                  <AdminSectionHeader
                    label={`Proposed beers (${dayProposedBeers.length})`}
                    action={
                      <AdminDeleteAllButton
                        count={dayProposedBeers.length}
                        itemLabel="proposed beer releases"
                        disabled={pendingKey !== null}
                        loading={pendingKey === rejectAllProposedBeersKey}
                        onConfirm={() =>
                          handleRejectAllProposedBeers(
                            dayProposedBeers.map((p) => p.id),
                            rejectAllProposedBeersKey
                          )
                        }
                      />
                    }
                  />
                  <div
                    className="p-3 flex flex-col gap-3 max-h-[32rem] overflow-y-auto"
                    style={{ backgroundColor: Colors.surfaceMedium }}
                  >
                    {dayProposedBeers.length === 0 ? (
                      <p className="text-sm px-1" style={{ color: Colors.textSecondary }}>
                        No proposed beer releases
                      </p>
                    ) : (
                      groupByBrewery(dayProposedBeers).map(
                        ({ breweryId, breweryName, items: proposed }) => {
                          const liveReleases = dayReleases.filter((r) => r.breweryId === breweryId)
                          const rejectBreweryKey = `reject-all:proposed-beer:${breweryId}:${ymd}`
                          return (
                            <BreweryPairSection
                              key={`proposed-beers-${breweryId}`}
                              breweryName={breweryName}
                              left={
                                <PairColumn
                                  label={`Proposed (${proposed.length})`}
                                  action={
                                    <AdminDeleteAllButton
                                      count={proposed.length}
                                      itemLabel="proposed beer releases"
                                      scopeLabel={breweryName}
                                      disabled={pendingKey !== null}
                                      loading={pendingKey === rejectBreweryKey}
                                      onConfirm={() =>
                                        handleRejectAllProposedBeers(
                                          proposed.map((p) => p.id),
                                          rejectBreweryKey
                                        )
                                      }
                                    />
                                  }
                                >
                                  {proposed.map((p) => (
                                    <ProposedBeerReleaseAdminCard
                                      key={p.id}
                                      proposed={p}
                                      onEdit={() => setEditingProposedBeer({ ...p })}
                                      onAccept={() => handleAcceptProposedBeer(p)}
                                      onReject={() => handleRejectProposedBeer(p.id)}
                                      actionsDisabled={pendingKey !== null}
                                      acceptLoading={pendingKey === acceptProposedBeerKey(p.id)}
                                      rejectLoading={pendingKey === rejectProposedBeerKey(p.id)}
                                    />
                                  ))}
                                </PairColumn>
                              }
                              right={
                                <PairColumn label={`Also live today (${liveReleases.length})`}>
                                  {liveReleases.length === 0 ? (
                                    <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
                                      No other releases today
                                    </p>
                                  ) : (
                                    liveReleases.map((r) => (
                                      <BeerReleaseAdminCard
                                        key={`compare-release-${r.id}`}
                                        release={r}
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
                        }
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4
                className="text-sm font-semibold mb-2"
                style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
              >
                Live on site
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <CategoryBlock
                  label={`Beer releases (${dayReleases.length})`}
                  action={
                    <AdminDeleteAllButton
                      count={dayReleases.length}
                      itemLabel="beer releases"
                      disabled={pendingKey !== null}
                      loading={pendingKey === `delete-all:releases:${ymd}`}
                      onConfirm={() =>
                        handleDeleteAllReleases(
                          dayReleases.map((r) => r.id),
                          `delete-all:releases:${ymd}`
                        )
                      }
                    />
                  }
                >
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
                </CategoryBlock>

                <CategoryBlock
                  label={`Happy hour & deals (${dayHappyHourDeals.length})`}
                  action={
                    <AdminDeleteAllButton
                      count={dayHappyHourDeals.length}
                      itemLabel="happy hour deals"
                      disabled={pendingKey !== null}
                      loading={pendingKey === `delete-all:happy-hour:${ymd}`}
                      onConfirm={() =>
                        handleDeleteAllHappyHourDeals(
                          dayHappyHourDeals.map((d) => d.id),
                          `delete-all:happy-hour:${ymd}`
                        )
                      }
                    />
                  }
                >
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
                </CategoryBlock>

                <CategoryBlock
                  label={`Events (${dayEvents.length})`}
                  action={
                    <AdminDeleteAllButton
                      count={dayEvents.length}
                      itemLabel="events"
                      disabled={pendingKey !== null}
                      loading={pendingKey === `delete-all:events:${ymd}`}
                      onConfirm={() =>
                        handleDeleteAllEvents(
                          dayEvents.map((e) => e.id),
                          `delete-all:events:${ymd}`
                        )
                      }
                    />
                  }
                >
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
                </CategoryBlock>

                <CategoryBlock
                  label={`Food trucks (${dayFoodTrucks.length})`}
                  action={
                    <AdminDeleteAllButton
                      count={dayFoodTrucks.length}
                      itemLabel="food trucks"
                      disabled={pendingKey !== null}
                      loading={pendingKey === `delete-all:food-trucks:${ymd}`}
                      onConfirm={() =>
                        handleDeleteAllFoodTrucks(
                          dayFoodTrucks.map((t) => t.id),
                          `delete-all:food-trucks:${ymd}`
                        )
                      }
                    />
                  }
                >
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
                </CategoryBlock>
              </div>
            </div>
          </div>
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
