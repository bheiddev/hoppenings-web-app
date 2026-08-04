'use client'

import { useState } from 'react'
import { Colors } from '@/lib/colors'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import { FoodTruck } from '@/types/supabase'
import type { UpdateFoodTruckPayload } from '@/app/admin/actions'

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

function dateForInput(d: string | null): string {
  if (!d) return ''
  const m = String(d).match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) return m[1]
  try {
    return new Date(d).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function FoodTruckFormModal({
  modalTitle,
  foodTruck,
  defaultBreweryId,
  onSave,
  onClose,
}: {
  modalTitle: string
  foodTruck: FoodTruck | null
  defaultBreweryId: string
  onSave: (data: UpdateFoodTruckPayload) => Promise<{ ok: boolean; error?: string }>
  onClose: () => void
}) {
  const [name, setName] = useState(foodTruck?.name ?? '')
  const [breweryIdField, setBreweryIdField] = useState(foodTruck?.brewery_id ?? defaultBreweryId)
  const [date, setDate] = useState(foodTruck ? dateForInput(foodTruck.date) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmedName = name.trim()
    const breweryId = breweryIdField.trim()
    const trimmedDate = date.trim()
    if (!trimmedName) {
      setError('Name is required')
      return
    }
    if (!breweryId) {
      setError('Brewery ID is required')
      return
    }
    if (!trimmedDate) {
      setError('Date is required')
      return
    }
    setSaving(true)
    try {
      const payload: UpdateFoodTruckPayload = {
        name: trimmedName,
        brewery_id: breweryId,
        date: trimmedDate,
        permanent: false,
        closed: null,
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
        {foodTruck && (
          <p className="text-xs mb-4" style={{ color: Colors.textSecondary }}>
            ID: <span className="font-mono">{foodTruck.id}</span>
            {' · '}
            Created: {formatCreatedAt(foodTruck.created_at)}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
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
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(ev) => setDate(ev.target.value)}
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
              brewery_id
            </label>
            <input
              type="text"
              value={breweryIdField}
              onChange={(ev) => setBreweryIdField(ev.target.value)}
              readOnly={!!foodTruck}
              className="w-full px-3 py-2 border rounded font-mono text-sm"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.surface,
              }}
            />
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
