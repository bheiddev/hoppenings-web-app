'use client'

import { Colors } from '@/lib/colors'
import { formatTime12Hour } from '@/lib/utils'
import { BeerRelease, Event, FoodTruck } from '@/types/supabase'

const sectionHeaderStyle = {
  color: Colors.textPrimary,
  borderColor: Colors.dividerLight,
  backgroundColor: Colors.backgroundMedium,
} as const

export function formatEventCost(cost: number | null): string {
  if (cost == null) return '—'
  return `$${cost.toFixed(2)}`
}

export function isEventRecurring(
  event: Pick<Event, 'is_recurring' | 'is_recurring_biweekly' | 'is_recurring_monthly'>
): boolean {
  return !!(event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly)
}

export function formatEventRecurrence(
  event: Pick<Event, 'is_recurring' | 'is_recurring_biweekly' | 'is_recurring_monthly'>
): string {
  if (!isEventRecurring(event)) return 'One Time'
  if (event.is_recurring) return 'Weekly'
  if (event.is_recurring_biweekly) return 'Biweekly'
  if (event.is_recurring_monthly) return 'Monthly'
  return 'One Time'
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
        backgroundColor: Colors.backgroundLight,
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
      className="px-3 py-2 text-xs font-semibold uppercase tracking-wide border-y"
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
  disabled,
}: {
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
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
        onClick={onDelete}
        disabled={disabled}
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
  )
}

export function EventAdminCard({
  event,
  breweryName,
  showBreweryName = false,
  onEdit,
  onDelete,
  disabled,
}: {
  event: Event
  breweryName?: string
  showBreweryName?: boolean
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
}) {
  const recurring = isEventRecurring(event)

  return (
    <div
      className="p-3 flex gap-3"
      style={{
        borderColor: Colors.dividerLight,
        backgroundColor: event.featured ? 'rgba(248, 199, 1, 0.12)' : Colors.background,
      }}
    >
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <div className="min-w-0">
          {showBreweryName && breweryName && (
            <p className="text-xs font-medium truncate" style={{ color: Colors.textSecondary }}>
              {breweryName}
            </p>
          )}
          <div className="flex items-start gap-1.5">
            {(event.featured || recurring) && (
              <span className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                {event.featured && (
                  <span title="Featured" style={{ color: Colors.primary }}>
                    <FeaturedIcon />
                  </span>
                )}
                {recurring && (
                  <span title={formatEventRecurrence(event)} style={{ color: Colors.info }}>
                    <RecurringIcon />
                  </span>
                )}
              </span>
            )}
            <p
              className="text-sm font-semibold break-words min-w-0"
              style={{ color: Colors.textDark }}
            >
              {event.title || '—'}
            </p>
          </div>
        </div>
        <AdminActionButtons onEdit={onEdit} onDelete={onDelete} disabled={disabled} />
      </div>
      <div
        className="flex flex-col items-end gap-1 flex-shrink-0 text-right"
        style={{ color: Colors.textSecondary }}
      >
        <span className="text-xs font-medium whitespace-nowrap">
          {event.start_time ? formatTime12Hour(event.start_time) : '—'}
        </span>
        <span className="text-xs font-medium whitespace-nowrap">{formatEventCost(event.cost)}</span>
        <span className="text-xs whitespace-nowrap">{formatEventRecurrence(event)}</span>
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
  disabled,
}: {
  release: BeerRelease
  breweryName?: string
  showBreweryName?: boolean
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
}) {
  return (
    <div className="p-3 flex flex-col gap-2" style={{ borderColor: Colors.dividerLight }}>
      <div className="min-w-0">
        {showBreweryName && breweryName && (
          <p className="text-xs font-medium truncate" style={{ color: Colors.textSecondary }}>
            {breweryName}
          </p>
        )}
        <p className="text-sm font-semibold break-words" style={{ color: Colors.textDark }}>
          {release.beer_name || '—'}
        </p>
      </div>
      <AdminActionButtons onEdit={onEdit} onDelete={onDelete} disabled={disabled} />
    </div>
  )
}

export function FoodTruckAdminCard({
  foodTruck,
  breweryName,
  showBreweryName = false,
  onEdit,
  onDelete,
  disabled,
}: {
  foodTruck: FoodTruck
  breweryName?: string
  showBreweryName?: boolean
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
}) {
  return (
    <div className="p-3 flex flex-col gap-2" style={{ borderColor: Colors.dividerLight }}>
      <div className="min-w-0">
        {showBreweryName && breweryName && (
          <p className="text-xs font-medium truncate" style={{ color: Colors.textSecondary }}>
            {breweryName}
          </p>
        )}
        <p className="text-sm font-semibold break-words" style={{ color: Colors.textDark }}>
          {foodTruck.name || '—'}
        </p>
      </div>
      <AdminActionButtons onEdit={onEdit} onDelete={onDelete} disabled={disabled} />
    </div>
  )
}
