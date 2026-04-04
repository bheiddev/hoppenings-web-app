'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatReleaseDate } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { BeerRelease } from '@/types/supabase'
import {
  deleteBeerReleaseFromBase,
  updateBeerReleaseInBase,
  type UpdateBeerReleasePayload,
} from '@/app/breweries-events/actions'

interface BeerReleasesTableWithActionsProps {
  releases: BeerRelease[]
  title: string
}

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

export function BeerReleasesTableWithActions({ releases, title }: BeerReleasesTableWithActionsProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<BeerRelease | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(releaseId: string) {
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

  function openEdit(r: BeerRelease) {
    setActionError(null)
    setEditing({ ...r })
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
        <div className="min-h-[12rem] max-h-[min(36rem,70vh)] overflow-y-auto overflow-x-auto overscroll-y-contain [scrollbar-gutter:stable]">
          {releases.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No beer releases
            </p>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[76rem]">
              <thead
                className="sticky top-0 z-10"
                style={{ backgroundColor: Colors.backgroundLight }}
              >
                <tr>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    ID
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Created
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Beer
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Type
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    ABV
                  </th>
                  <th className="p-2 font-medium min-w-[12rem]" style={{ color: Colors.textDark }}>
                    Description
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Brewery (join)
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    brewery_id
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    brewery_id2
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    brewery_id3
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Release date
                  </th>
                  <th
                    className="p-2 font-medium whitespace-nowrap sticky right-0 z-20 shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.12)] border-l"
                    style={{
                      color: Colors.textDark,
                      backgroundColor: Colors.backgroundLight,
                      borderColor: Colors.dividerLight,
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: Colors.textDark }}>
                {releases.map((r) => (
                  <tr key={r.id} className="border-t align-top" style={{ borderColor: Colors.dividerLight }}>
                    <td className="p-2 font-mono text-xs whitespace-nowrap">{r.id}</td>
                    <td className="p-2 whitespace-nowrap">{formatCreatedAt(r.created_at)}</td>
                    <td className="p-2">{r.beer_name || '—'}</td>
                    <td className="p-2">{r.Type || '—'}</td>
                    <td className="p-2">{r.ABV ?? '—'}</td>
                    <td className="p-2 text-xs break-words whitespace-pre-wrap max-w-md">
                      {r.description?.trim() ? r.description : '—'}
                    </td>
                    <td className="p-2">{r.breweries?.name || '—'}</td>
                    <td className="p-2 font-mono text-xs">{r.brewery_id}</td>
                    <td className="p-2 font-mono text-xs">{r.brewery_id2 ?? '—'}</td>
                    <td className="p-2 font-mono text-xs">{r.brewery_id3 ?? '—'}</td>
                    <td className="p-2 whitespace-nowrap">
                      {r.release_date ? formatReleaseDate(r.release_date) : '—'}
                    </td>
                    <td
                      className="p-2 sticky right-0 z-10 shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.08)] border-l align-top"
                      style={{
                        backgroundColor: Colors.background,
                        borderColor: Colors.dividerLight,
                      }}
                    >
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
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
                          onClick={() => handleDelete(r.id)}
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
        <EditBeerReleaseModal
          release={editing}
          onSave={async (data: UpdateBeerReleasePayload) => {
            const result = await updateBeerReleaseInBase(editing.id, data)
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

function EditBeerReleaseModal({
  release,
  onSave,
  onClose,
}: {
  release: BeerRelease
  onSave: (data: UpdateBeerReleasePayload) => Promise<{ ok: boolean; error?: string }>
  onClose: () => void
}) {
  const [beerName, setBeerName] = useState(release.beer_name ?? '')
  const [type, setType] = useState(release.Type ?? '')
  const [abv, setAbv] = useState(release.ABV ?? '')
  const [description, setDescription] = useState(release.description ?? '')
  const [breweryId, setBreweryId] = useState(release.brewery_id ?? '')
  const [breweryId2, setBreweryId2] = useState(release.brewery_id2 ?? '')
  const [breweryId3, setBreweryId3] = useState(release.brewery_id3 ?? '')
  const [releaseDate, setReleaseDate] = useState(releaseDateForInput(release.release_date))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const name = beerName.trim()
    const primary = breweryId.trim()
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
        style={{ backgroundColor: Colors.background }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Edit beer release
        </h3>
        <p className="text-xs mb-4" style={{ color: Colors.textSecondary }}>
          ID: <span className="font-mono">{release.id}</span>
          {' · '}
          Created: {formatCreatedAt(release.created_at)}
        </p>
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
                backgroundColor: Colors.background,
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
                  backgroundColor: Colors.background,
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
                  backgroundColor: Colors.background,
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
                backgroundColor: Colors.background,
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
                backgroundColor: Colors.background,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              brewery_id (primary)
            </label>
            <input
              type="text"
              value={breweryId}
              onChange={(ev) => setBreweryId(ev.target.value)}
              className="w-full px-3 py-2 border rounded font-mono text-sm"
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
                  backgroundColor: Colors.background,
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
                  backgroundColor: Colors.background,
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
