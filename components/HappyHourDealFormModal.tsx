'use client'

import { useState } from 'react'
import { Colors } from '@/lib/colors'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import { HAPPY_HOUR_DAYS } from '@/lib/happyHourDeals'
import { HappyHourDeal, HappyHourDayOfWeek } from '@/types/supabase'
import type { UpdateHappyHourDealPayload } from '@/app/admin/actions'

function formatCreatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/Denver',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function parseHourInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isInteger(n) || n < 0 || n > 23) return Number.NaN
  return n
}

export function HappyHourDealFormModal({
  modalTitle,
  deal,
  defaultBreweryId,
  onSave,
  onClose,
}: {
  modalTitle: string
  deal: HappyHourDeal | null
  defaultBreweryId: string
  onSave: (data: UpdateHappyHourDealPayload) => Promise<{ ok: boolean; error?: string }>
  onClose: () => void
}) {
  const [title, setTitle] = useState(deal?.title ?? '')
  const [description, setDescription] = useState(deal?.description ?? '')
  const [breweryIdField, setBreweryIdField] = useState(deal?.brewery_id ?? defaultBreweryId)
  const [dayOfWeek, setDayOfWeek] = useState<HappyHourDayOfWeek>(deal?.day_of_week ?? 'Monday')
  const [timeStart, setTimeStart] = useState(
    deal?.time_start != null ? String(deal.time_start) : ''
  )
  const [timeEnd, setTimeEnd] = useState(deal?.time_end != null ? String(deal.time_end) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmedTitle = title.trim()
    const breweryId = breweryIdField.trim()
    if (!trimmedTitle) {
      setError('Title is required')
      return
    }
    if (!breweryId) {
      setError('Brewery ID is required')
      return
    }
    const start = parseHourInput(timeStart)
    const end = parseHourInput(timeEnd)
    if (Number.isNaN(start) || Number.isNaN(end)) {
      setError('Hours must be blank (all day) or integers 0–23')
      return
    }
    setSaving(true)
    try {
      const payload: UpdateHappyHourDealPayload = {
        brewery_id: breweryId,
        day_of_week: dayOfWeek,
        time_start: start,
        time_end: end,
        title: trimmedTitle,
        description: description.trim() || null,
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
        className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-lg p-6 shadow-lg"
        style={{ backgroundColor: Colors.surface }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3
          className="mb-4 text-xl font-bold"
          style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {modalTitle}
        </h3>
        {deal ? (
          <p className="mb-4 text-xs" style={{ color: Colors.textSecondary }}>
            ID: <span className="font-mono">{deal.id}</span>
            {' · '}
            Created: {formatCreatedAt(deal.created_at)}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: Colors.textDark }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{ borderColor: Colors.dividerLight, color: Colors.textDark }}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: Colors.textDark }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={3}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{ borderColor: Colors.dividerLight, color: Colors.textDark }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: Colors.textDark }}>
              Day of week
            </label>
            <select
              value={dayOfWeek}
              onChange={(ev) => setDayOfWeek(ev.target.value as HappyHourDayOfWeek)}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{ borderColor: Colors.dividerLight, color: Colors.textDark }}
            >
              {HAPPY_HOUR_DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: Colors.textDark }}>
                Start hour (0–23, 24h)
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={timeStart}
                onChange={(ev) => setTimeStart(ev.target.value)}
                placeholder="e.g. 14 for 2 PM"
                className="w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: Colors.dividerLight, color: Colors.textDark }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: Colors.textDark }}>
                End hour (0–23, 24h)
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={timeEnd}
                onChange={(ev) => setTimeEnd(ev.target.value)}
                placeholder="e.g. 17 for 5 PM"
                className="w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: Colors.dividerLight, color: Colors.textDark }}
              />
            </div>
          </div>
          <p className="text-xs" style={{ color: Colors.textSecondary }}>
            Use 24-hour time (14 = 2 PM). Leave both blank for all day. Start only (e.g. 16) means
            after that hour.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: Colors.textDark }}>
              Brewery ID
            </label>
            <input
              type="text"
              value={breweryIdField}
              onChange={(ev) => setBreweryIdField(ev.target.value)}
              className="w-full rounded border px-3 py-2 font-mono text-sm"
              style={{ borderColor: Colors.dividerLight, color: Colors.textDark }}
              required
              readOnly={Boolean(deal)}
            />
          </div>
          {error ? (
            <p className="text-sm" style={{ color: Colors.error }}>
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <AdminButton type="button" variant="cancel" onClick={onClose} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" variant="save" loading={saving}>
              Save
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  )
}
