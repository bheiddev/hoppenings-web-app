'use client'

import { useState } from 'react'
import { Colors } from '@/lib/colors'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import { BeerRelease } from '@/types/supabase'
import type { UpdateBeerReleasePayload } from '@/app/admin/actions'

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

function releaseDateForInput(d: string | null): string {
  if (!d) return ''
  const m = String(d).match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) return m[1]
  try {
    return new Date(d).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function emptyToNull(s: string): string | null {
  const t = s.trim()
  return t ? t : null
}

export function BeerReleaseFormModal({
  modalTitle,
  release,
  defaultBreweryId,
  onSave,
  onClose,
}: {
  modalTitle: string
  release: BeerRelease | null
  defaultBreweryId: string
  onSave: (data: UpdateBeerReleasePayload) => Promise<{ ok: boolean; error?: string }>
  onClose: () => void
}) {
  const [beerName, setBeerName] = useState(release?.beer_name ?? '')
  const [type, setType] = useState(release?.Type ?? '')
  const [abv, setAbv] = useState(release?.ABV ?? '')
  const [description, setDescription] = useState(release?.description ?? '')
  const [breweryIdField, setBreweryIdField] = useState(release?.brewery_id ?? defaultBreweryId)
  const [breweryId2, setBreweryId2] = useState(release?.brewery_id2 ?? '')
  const [breweryId3, setBreweryId3] = useState(release?.brewery_id3 ?? '')
  const [releaseDate, setReleaseDate] = useState(
    release ? releaseDateForInput(release.release_date) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const name = beerName.trim()
    const primary = breweryIdField.trim()
    if (!name) {
      setError('Beer name is required')
      return
    }
    if (!primary) {
      setError('Primary brewery ID is required')
      return
    }
    setSaving(true)
    try {
      const payload: UpdateBeerReleasePayload = {
        beer_name: name,
        ABV: emptyToNull(abv),
        Type: emptyToNull(type),
        description: emptyToNull(description),
        brewery_id: primary,
        brewery_id2: emptyToNull(breweryId2),
        brewery_id3: emptyToNull(breweryId3),
        release_date: releaseDate.trim() || null,
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
        {release && (
          <p className="text-xs mb-4" style={{ color: Colors.textSecondary }}>
            ID: <span className="font-mono">{release.id}</span>
            {' · '}
            Created: {formatCreatedAt(release.created_at)}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Beer name
            </label>
            <input
              type="text"
              value={beerName}
              onChange={(ev) => setBeerName(ev.target.value)}
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
                Type
              </label>
              <input
                type="text"
                value={type}
                onChange={(ev) => setType(ev.target.value)}
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
                ABV
              </label>
              <input
                type="text"
                value={abv}
                onChange={(ev) => setAbv(ev.target.value)}
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
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Release date
            </label>
            <input
              type="date"
              value={releaseDate}
              onChange={(ev) => setReleaseDate(ev.target.value)}
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
              brewery_id (primary)
            </label>
            <input
              type="text"
              value={breweryIdField}
              onChange={(ev) => setBreweryIdField(ev.target.value)}
              readOnly={!release}
              className="w-full px-3 py-2 border rounded font-mono text-sm"
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
                brewery_id2 (optional)
              </label>
              <input
                type="text"
                value={breweryId2}
                onChange={(ev) => setBreweryId2(ev.target.value)}
                className="w-full px-3 py-2 border rounded font-mono text-sm"
                style={{
                  borderColor: Colors.dividerLight,
                  color: Colors.textDark,
                  backgroundColor: Colors.surface,
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                brewery_id3 (optional)
              </label>
              <input
                type="text"
                value={breweryId3}
                onChange={(ev) => setBreweryId3(ev.target.value)}
                className="w-full px-3 py-2 border rounded font-mono text-sm"
                style={{
                  borderColor: Colors.dividerLight,
                  color: Colors.textDark,
                  backgroundColor: Colors.surface,
                }}
              />
            </div>
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
