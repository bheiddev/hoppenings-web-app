'use client'

import { useState } from 'react'
import { Colors } from '@/lib/colors'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import { Event } from '@/types/supabase'
import type { UpdateEventPayload } from '@/app/breweries-events/actions'

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

export function EventFormModal({
  modalTitle,
  event,
  onSave,
  onClose,
}: {
  modalTitle: string
  event: Event | null
  onSave: (data: UpdateEventPayload) => Promise<{ ok: boolean; error?: string }>
  onClose: () => void
}) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [eventDate, setEventDate] = useState(event ? eventDateForInput(event.event_date) : '')
  const [startTime, setStartTime] = useState(event?.start_time ?? '')
  const [endTime, setEndTime] = useState(event?.end_time ?? '')
  const [costRaw, setCostRaw] = useState(
    event?.cost != null && !Number.isNaN(event.cost) ? String(event.cost) : ''
  )
  const [description, setDescription] = useState(event?.description ?? '')
  const [featured, setFeatured] = useState(event?.featured ?? false)
  const [isRecurring, setIsRecurring] = useState(event?.is_recurring ?? false)
  const [isRecurringBiweekly, setIsRecurringBiweekly] = useState(event?.is_recurring_biweekly ?? false)
  const [isRecurringMonthly, setIsRecurringMonthly] = useState(event?.is_recurring_monthly ?? false)
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
        style={{ backgroundColor: Colors.surface }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {modalTitle}
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
                backgroundColor: Colors.surface,
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
                backgroundColor: Colors.surface,
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
                  backgroundColor: Colors.surface,
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
                  backgroundColor: Colors.surface,
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
                backgroundColor: Colors.surface,
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
                backgroundColor: Colors.surface,
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
            <AdminButton variant="cancel" onClick={onClose} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton variant="save" type="submit" loading={saving}>
              Save
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  )
}
