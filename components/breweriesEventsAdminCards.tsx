'use client'

import { Colors } from '@/lib/colors'
import { formatEventDate, formatReleaseDate, formatTime12Hour } from '@/lib/utils'
import { BeerRelease, Event, FoodTruck, ProposedBeerRelease, ProposedEvent } from '@/types/supabase'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'

type RecurrenceFields = {
  is_recurring: boolean | null
  is_recurring_biweekly: boolean | null
  is_recurring_monthly: boolean | null
}

const sectionHeaderStyle = {
  color: Colors.textDark,
  borderColor: Colors.dividerLight,
  backgroundColor: Colors.surfaceLight,
} as const

export function formatEventCost(cost: number | null): string {
  if (cost == null) return '—'
  return `$${cost.toFixed(2)}`
}

export function isEventRecurring(event: RecurrenceFields): boolean {
  return !!(event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly)
}

export function formatEventRecurrence(event: RecurrenceFields): string {
  if (!isEventRecurring(event)) return 'One Time'
  if (event.is_recurring) return 'Weekly'
  if (event.is_recurring_biweekly) return 'Biweekly'
  if (event.is_recurring_monthly) return 'Monthly'
  return 'One Time'
}

function formatCardEventDate(eventDate: string | null): string {
  return eventDate ? formatEventDate(eventDate) : '—'
}

function formatCardReleaseDate(releaseDate: string | null): string {
  return formatReleaseDate(releaseDate) ?? '—'
}

export const adminColumnShellStyle = {
  borderColor: Colors.dividerLight,
  backgroundColor: Colors.surface,
} as const

export function AdminColumnShell({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col min-w-0 border rounded-lg overflow-hidden w-full ${className}`}
      style={adminColumnShellStyle}
    >
      {children}
    </div>
  )
}

/** ~4–5 admin cards visible before vertical scroll */
export function AdminColumnScrollBody({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="divide-y overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable] max-h-[26rem]"
      style={{ borderColor: Colors.dividerLight }}
    >
      {children}
    </div>
  )
}

export function AdminColumnHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div
      className="px-3 py-2 border-b flex items-center justify-between gap-2"
      style={{
        borderColor: Colors.dividerLight,
        backgroundColor: Colors.surfaceLight,
      }}
    >
      <h3
        className="text-sm font-semibold leading-snug min-w-0 break-words"
        style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
      >
        {title}
      </h3>
      {action}
    </div>
  )
}

export function AdminSectionHeader({ label }: { label: string }) {
  return (
    <p
      className="px-3 py-2 text-xs font-semibold uppercase tracking-wide border-b"
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

function AdminActionButtons({
  onEdit,
  onDelete,
  actionsDisabled,
  deleteLoading,
}: {
  onEdit: () => void
  onDelete: () => void
  actionsDisabled?: boolean
  deleteLoading?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <AdminButton variant="edit" onClick={onEdit} disabled={actionsDisabled}>
        Edit
      </AdminButton>
      <AdminButton
        variant="delete"
        onClick={onDelete}
        disabled={actionsDisabled}
        loading={deleteLoading}
      >
        Delete
      </AdminButton>
    </div>
  )
}

function EventCardMeta({
  breweryName,
  showBreweryName,
  eventDate,
  title,
  featured,
  recurring,
  recurrenceLabel,
}: {
  breweryName?: string
  showBreweryName?: boolean
  eventDate: string | null
  title: string | null
  featured: boolean
  recurring: boolean
  recurrenceLabel: string
}) {
  return (
    <div className="min-w-0">
      {showBreweryName && breweryName && (
        <p className="text-xs font-medium truncate" style={{ color: Colors.textSecondary }}>
          {breweryName}
        </p>
      )}
      <p className="text-xs font-medium" style={{ color: Colors.textSecondary }}>
        {formatCardEventDate(eventDate)}
      </p>
      <div className="flex items-start gap-1.5">
        {(featured || recurring) && (
          <span className="flex items-center gap-1 flex-shrink-0 pt-0.5">
            {featured && (
              <span title="Featured" style={{ color: Colors.accent }}>
                <FeaturedIcon />
              </span>
            )}
            {recurring && (
              <span title={recurrenceLabel} style={{ color: Colors.info }}>
                <RecurringIcon />
              </span>
            )}
          </span>
        )}
        <p className="text-sm font-semibold break-words min-w-0" style={{ color: Colors.textDark }}>
          {title || '—'}
        </p>
      </div>
    </div>
  )
}

function EventCardAside({
  startTime,
  cost,
  recurrenceLabel,
}: {
  startTime: string | null
  cost: number | null
  recurrenceLabel: string
}) {
  return (
    <div
      className="flex flex-col items-end gap-1 flex-shrink-0 text-right"
      style={{ color: Colors.textSecondary }}
    >
      <span className="text-xs font-medium whitespace-nowrap">
        {startTime ? formatTime12Hour(startTime) : '—'}
      </span>
      <span className="text-xs font-medium whitespace-nowrap">{formatEventCost(cost)}</span>
      <span className="text-xs whitespace-nowrap">{recurrenceLabel}</span>
    </div>
  )
}

export function EventAdminCard({
  event,
  breweryName,
  showBreweryName = false,
  onEdit,
  onDelete,
  actionsDisabled,
  deleteLoading,
}: {
  event: Event
  breweryName?: string
  showBreweryName?: boolean
  onEdit: () => void
  onDelete: () => void
  actionsDisabled?: boolean
  deleteLoading?: boolean
}) {
  const recurring = isEventRecurring(event)
  const recurrenceLabel = formatEventRecurrence(event)

  return (
    <div
      className="p-3 flex gap-3"
      style={{
        borderColor: Colors.dividerLight,
        backgroundColor: event.featured ? 'rgba(248, 199, 1, 0.12)' : Colors.surface,
      }}
    >
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <EventCardMeta
          breweryName={breweryName}
          showBreweryName={showBreweryName}
          eventDate={event.event_date}
          title={event.title}
          featured={event.featured}
          recurring={recurring}
          recurrenceLabel={recurrenceLabel}
        />
        <AdminActionButtons
          onEdit={onEdit}
          onDelete={onDelete}
          actionsDisabled={actionsDisabled}
          deleteLoading={deleteLoading}
        />
      </div>
      <EventCardAside
        startTime={event.start_time}
        cost={event.cost}
        recurrenceLabel={recurrenceLabel}
      />
    </div>
  )
}

export function ProposedEventAdminCard({
  proposed,
  breweryName,
  showBreweryName = false,
  onEdit,
  onAccept,
  onReject,
  actionsDisabled,
  acceptLoading,
  rejectLoading,
}: {
  proposed: ProposedEvent
  breweryName?: string
  showBreweryName?: boolean
  onEdit: () => void
  onAccept: () => void
  onReject: () => void
  actionsDisabled?: boolean
  acceptLoading?: boolean
  rejectLoading?: boolean
}) {
  const recurring = isEventRecurring(proposed)
  const recurrenceLabel = formatEventRecurrence(proposed)
  const featured = proposed.featured ?? false

  return (
    <div
      className="p-3 flex gap-3"
      style={{
        borderColor: Colors.dividerLight,
        backgroundColor: featured ? 'rgba(248, 199, 1, 0.12)' : Colors.surface,
      }}
    >
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <EventCardMeta
          breweryName={breweryName}
          showBreweryName={showBreweryName}
          eventDate={proposed.event_date}
          title={proposed.title}
          featured={featured}
          recurring={recurring}
          recurrenceLabel={recurrenceLabel}
        />
        <div className="flex flex-wrap gap-1">
          <AdminButton variant="edit" onClick={onEdit} disabled={actionsDisabled}>
            Edit
          </AdminButton>
          <AdminButton
            variant="accept"
            onClick={onAccept}
            disabled={actionsDisabled}
            loading={acceptLoading}
          >
            Approve
          </AdminButton>
          <AdminButton
            variant="reject"
            onClick={onReject}
            disabled={actionsDisabled}
            loading={rejectLoading}
          >
            Reject
          </AdminButton>
        </div>
      </div>
      <EventCardAside
        startTime={proposed.start_time}
        cost={proposed.cost}
        recurrenceLabel={recurrenceLabel}
      />
    </div>
  )
}

export function ProposedBeerReleaseAdminCard({
  proposed,
  breweryName,
  showBreweryName = false,
  onEdit,
  onAccept,
  onReject,
  actionsDisabled,
  acceptLoading,
  rejectLoading,
}: {
  proposed: ProposedBeerRelease
  breweryName?: string
  showBreweryName?: boolean
  onEdit: () => void
  onAccept: () => void
  onReject: () => void
  actionsDisabled?: boolean
  acceptLoading?: boolean
  rejectLoading?: boolean
}) {
  const meta = [proposed.Type, proposed.ABV ? `${proposed.ABV}% ABV` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className="p-3 flex flex-col gap-2"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <div className="min-w-0">
        {showBreweryName && breweryName && (
          <p className="text-xs font-medium truncate" style={{ color: Colors.textSecondary }}>
            {breweryName}
          </p>
        )}
        <p className="text-xs font-medium" style={{ color: Colors.textSecondary }}>
          {formatCardReleaseDate(proposed.release_date)}
        </p>
        <p className="text-sm font-semibold break-words" style={{ color: Colors.textDark }}>
          {proposed.beer_name || '—'}
        </p>
        {meta ? (
          <p className="text-xs mt-0.5" style={{ color: Colors.textSecondary }}>
            {meta}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1">
        <AdminButton variant="edit" onClick={onEdit} disabled={actionsDisabled}>
          Edit
        </AdminButton>
        <AdminButton
          variant="accept"
          onClick={onAccept}
          disabled={actionsDisabled}
          loading={acceptLoading}
        >
          Approve
        </AdminButton>
        <AdminButton
          variant="reject"
          onClick={onReject}
          disabled={actionsDisabled}
          loading={rejectLoading}
        >
          Reject
        </AdminButton>
      </div>
    </div>
  )
}

export function BeerReleaseAdminCard({
  release,
  breweryName,
  showBreweryName = false,
  onEdit,
  onDelete,
  actionsDisabled,
  deleteLoading,
}: {
  release: BeerRelease
  breweryName?: string
  showBreweryName?: boolean
  onEdit: () => void
  onDelete: () => void
  actionsDisabled?: boolean
  deleteLoading?: boolean
}) {
  return (
    <div
      className="p-3 flex flex-col gap-2"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <div className="min-w-0">
        {showBreweryName && breweryName && (
          <p className="text-xs font-medium truncate" style={{ color: Colors.textSecondary }}>
            {breweryName}
          </p>
        )}
        <p className="text-xs font-medium" style={{ color: Colors.textSecondary }}>
          {formatCardReleaseDate(release.release_date)}
        </p>
        <p className="text-sm font-semibold break-words" style={{ color: Colors.textDark }}>
          {release.beer_name || '—'}
        </p>
      </div>
      <AdminActionButtons
        onEdit={onEdit}
        onDelete={onDelete}
        actionsDisabled={actionsDisabled}
        deleteLoading={deleteLoading}
      />
    </div>
  )
}

export function FoodTruckAdminCard({
  foodTruck,
  breweryName,
  showBreweryName = false,
  onEdit,
  onDelete,
  actionsDisabled,
  deleteLoading,
}: {
  foodTruck: FoodTruck
  breweryName?: string
  showBreweryName?: boolean
  onEdit: () => void
  onDelete: () => void
  actionsDisabled?: boolean
  deleteLoading?: boolean
}) {
  return (
    <div
      className="p-3 flex flex-col gap-2"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <div className="min-w-0">
        {showBreweryName && breweryName && (
          <p className="text-xs font-medium truncate" style={{ color: Colors.textSecondary }}>
            {breweryName}
          </p>
        )}
        <p className="text-xs font-medium" style={{ color: Colors.textSecondary }}>
          {foodTruck.permanent ? 'Permanent' : formatCardEventDate(foodTruck.date)}
        </p>
        <p className="text-sm font-semibold break-words" style={{ color: Colors.textDark }}>
          {foodTruck.name || '—'}
        </p>
      </div>
      <AdminActionButtons
        onEdit={onEdit}
        onDelete={onDelete}
        actionsDisabled={actionsDisabled}
        deleteLoading={deleteLoading}
      />
    </div>
  )
}
