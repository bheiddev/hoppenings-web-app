'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatEventDate, formatTime12Hour } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { Event } from '@/types/supabase'
import {
  deleteEventFromEventsBase,
  updateEventInEventsBase,
  type UpdateEventPayload,
} from '@/app/breweries-events/actions'

interface EventsTableWithDeleteProps {
  events: Event[]
  title: string
}

function eventDateForInput(eventDate: string): string {
  if (!eventDate) return ''
  const m = String(eventDate).match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) return m[1]
  try {
    return new Date(eventDate).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function EventsTableWithDelete({ events, title }: EventsTableWithDeleteProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Event | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(eventId: string) {
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

  function openEdit(e: Event) {
    setActionError(null)
    setEditing({ ...e })
  }

  function closeEdit() {
    setEditing(null)
  }

  return (
    <>
      {actionError && (
        <div
          className="mb-2 px-3 py-2 rounded text-sm"
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
        className="flex flex-col border rounded-lg overflow-hidden w-full"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}
      >
        <div
          className="flex-shrink-0 px-3 py-2 font-semibold text-sm"
          style={{ backgroundColor: Colors.backgroundLight, color: Colors.textDark }}
        >
          {title}
        </div>
        <div
          className="min-h-[12rem] max-h-[min(32rem,70vh)] overflow-y-auto overflow-x-auto overscroll-y-contain [scrollbar-gutter:stable]"
        >
          {events.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No events
            </p>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[48rem]">
              <thead
                className="sticky top-0 z-10"
                style={{ backgroundColor: Colors.backgroundLight }}
              >
                <tr>
                  <th className="p-2 font-medium min-w-[10rem]" style={{ color: Colors.textDark }}>
                    Title
                  </th>
                  <th className="p-2 font-medium min-w-[16rem]" style={{ color: Colors.textDark }}>
                    Description
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Date
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Start
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    End
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Cost
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: Colors.textDark }}>
                {events.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t align-top"
                    style={{ borderColor: Colors.dividerLight }}
                  >
                    <td className="p-2 break-words">{e.title || '—'}</td>
                    <td className="p-2 text-xs break-words whitespace-pre-wrap">
                      {e.description?.trim() ? e.description : '—'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {e.event_date ? formatEventDate(e.event_date) : '—'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {e.start_time ? formatTime12Hour(e.start_time) : '—'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {e.end_time ? formatTime12Hour(e.end_time) : '—'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {e.cost != null ? String(e.cost) : '—'}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(e)}
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
                          onClick={() => handleDelete(e.id)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <EditEventModal
          event={editing}
          onSave={async (data: UpdateEventPayload) => {
            const result = await updateEventInEventsBase(editing.id, data)
            if (result.ok) {
              closeEdit()
              router.refresh()
            }
            return result
          }}
          onClose={closeEdit}
        />
      )}
    </>
  )
}

function EditEventModal({
  event,
  onSave,
  onClose,
}: {
  event: Event
  onSave: (data: UpdateEventPayload) => Promise<{ ok: boolean; error?: string }>
  onClose: () => void
}) {
  const [title, setTitle] = useState(event.title ?? '')
  const [eventDate, setEventDate] = useState(eventDateForInput(event.event_date))
  const [startTime, setStartTime] = useState(event.start_time ?? '')
  const [endTime, setEndTime] = useState(event.end_time ?? '')
  const [costRaw, setCostRaw] = useState(
    event.cost != null && !Number.isNaN(event.cost) ? String(event.cost) : ''
  )
  const [description, setDescription] = useState(event.description ?? '')
  const [featured, setFeatured] = useState(event.featured)
  const [isRecurring, setIsRecurring] = useState(event.is_recurring)
  const [isRecurringBiweekly, setIsRecurringBiweekly] = useState(event.is_recurring_biweekly)
  const [isRecurringMonthly, setIsRecurringMonthly] = useState(event.is_recurring_monthly)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function parseCost(): number | null {
    const t = costRaw.trim()
    if (!t) return null
    const n = parseFloat(t)
    return Number.isFinite(n) ? n : null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const date = eventDate.trim()
    if (!date) {
      setError('Event date is required')
      return
    }
    setSaving(true)
    try {
      const start = startTime.trim() || null
      const end = endTime.trim() || null
      const payload: UpdateEventPayload = {
        title: title.trim() || '',
        description: description.trim() || null,
        event_date: date,
        start_time: start,
        end_time: end,
        cost: parseCost(),
        featured,
        is_recurring: isRecurring,
        is_recurring_biweekly: isRecurringBiweekly,
        is_recurring_monthly: isRecurringMonthly,
      }
      const result = await onSave(payload)
      if (!result?.ok) setError(result?.error ?? 'Failed to save')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: Colors.overlay }}
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-lg max-w-xl w-full max-h-[90vh] overflow-auto p-6"
        style={{ backgroundColor: Colors.background }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Edit event
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.background,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Event date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(ev) => setEventDate(ev.target.value)}
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.background,
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                Start time (HH:MM or HH:MM:SS)
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(ev) => setStartTime(ev.target.value)}
                placeholder="e.g. 14:30:00"
                className="w-full px-3 py-2 border rounded"
                style={{
                  borderColor: Colors.dividerLight,
                  color: Colors.textDark,
                  backgroundColor: Colors.background,
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                End time (HH:MM or HH:MM:SS)
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(ev) => setEndTime(ev.target.value)}
                placeholder="e.g. 18:00:00"
                className="w-full px-3 py-2 border rounded"
                style={{
                  borderColor: Colors.dividerLight,
                  color: Colors.textDark,
                  backgroundColor: Colors.background,
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Cost (optional)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={costRaw}
              onChange={(ev) => setCostRaw(ev.target.value)}
              placeholder="e.g. 5 or 0"
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.background,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded resize-y"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.background,
              }}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: Colors.textDark }}>
              <input
                type="checkbox"
                checked={featured}
                onChange={(ev) => setFeatured(ev.target.checked)}
                className="rounded"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: Colors.textDark }}>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(ev) => setIsRecurring(ev.target.checked)}
                className="rounded"
              />
              Recurring
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: Colors.textDark }}>
              <input
                type="checkbox"
                checked={isRecurringBiweekly}
                onChange={(ev) => setIsRecurringBiweekly(ev.target.checked)}
                className="rounded"
              />
              Biweekly
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: Colors.textDark }}>
              <input
                type="checkbox"
                checked={isRecurringMonthly}
                onChange={(ev) => setIsRecurringMonthly(ev.target.checked)}
                className="rounded"
              />
              Monthly
            </label>
          </div>
          {error && (
            <p className="text-sm" style={{ color: Colors.error }}>
              {error}
            </p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.background,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded font-medium"
              style={{
                backgroundColor: Colors.primary,
                color: Colors.primaryDark,
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
