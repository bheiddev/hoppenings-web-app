'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatReleaseDate } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { BeerRelease } from '@/types/supabase'
import {
  createBeerReleaseInBase,
  deleteBeerReleaseFromBase,
  updateBeerReleaseInBase,
  type UpdateBeerReleasePayload,
} from '@/app/breweries-events/actions'
import { BeerReleaseFormModal } from '@/components/BeerReleaseFormModal'

interface BeerReleasesTableWithActionsProps {
  releases: BeerRelease[]
  title: string
  breweryId: string
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

function CompactField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="font-medium" style={{ color: Colors.textSecondary }}>
        {label}:{' '}
      </span>
      <span className="break-words whitespace-pre-wrap" style={{ color: Colors.textDark }}>
        {value}
      </span>
    </div>
  )
}

export function BeerReleasesTableWithActions({
  releases,
  title,
  breweryId,
}: BeerReleasesTableWithActionsProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<BeerRelease | null>(null)
  const [adding, setAdding] = useState(false)
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

  function openAdd() {
    setActionError(null)
    setAdding(true)
  }

  function closeAdd() {
    setAdding(false)
  }

  return (
    <>
      {actionError && (
        <div
          className="mb-2 px-3 py-2 rounded text-sm"
          style={{ backgroundColor: '#FEE2E2', color: Colors.error }}
        >
          {actionError}
          <button type="button" onClick={() => setActionError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}
      <div
        className="flex flex-col border rounded-lg overflow-hidden w-full min-w-0"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}
      >
        <div
          className="flex-shrink-0 px-3 py-2 font-semibold text-sm flex items-center justify-between gap-2"
          style={{ backgroundColor: Colors.backgroundLight, color: Colors.textDark }}
        >
          <span className="min-w-0 break-words">{title}</span>
          <button
            type="button"
            onClick={openAdd}
            disabled={!!loadingId}
            className="px-2 py-1 text-xs rounded font-medium shrink-0"
            style={{
              backgroundColor: Colors.primary,
              color: Colors.primaryDark,
            }}
          >
            Add
          </button>
        </div>
        <div className="overflow-hidden">
          {releases.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No beer releases
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: Colors.dividerLight }}>
              {releases.map((r) => (
                <div key={r.id} className="p-2 flex flex-col gap-1 text-xs">
                  <CompactField label="ID" value={<span className="font-mono break-all">{r.id}</span>} />
                  <CompactField label="Created" value={formatCreatedAt(r.created_at)} />
                  <CompactField label="Beer" value={r.beer_name || '—'} />
                  <CompactField label="Type" value={r.Type || '—'} />
                  <CompactField label="ABV" value={r.ABV ?? '—'} />
                  <CompactField
                    label="Description"
                    value={r.description?.trim() ? r.description : '—'}
                  />
                  <CompactField label="Brewery (join)" value={r.breweries?.name || '—'} />
                  <CompactField
                    label="brewery_id"
                    value={<span className="font-mono break-all">{r.brewery_id}</span>}
                  />
                  <CompactField
                    label="brewery_id2"
                    value={
                      r.brewery_id2 ? <span className="font-mono break-all">{r.brewery_id2}</span> : '—'
                    }
                  />
                  <CompactField
                    label="brewery_id3"
                    value={
                      r.brewery_id3 ? <span className="font-mono break-all">{r.brewery_id3}</span> : '—'
                    }
                  />
                  <CompactField
                    label="Release date"
                    value={r.release_date ? formatReleaseDate(r.release_date) : '—'}
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {adding && (
        <BeerReleaseFormModal
          modalTitle="Add beer release"
          release={null}
          defaultBreweryId={breweryId}
          onSave={async (data: UpdateBeerReleasePayload) => {
            const result = await createBeerReleaseInBase(data)
            if (result.ok) {
              closeAdd()
              router.refresh()
            }
            return result
          }}
          onClose={closeAdd}
        />
      )}

      {editing && (
        <BeerReleaseFormModal
          modalTitle="Edit beer release"
          release={editing}
          defaultBreweryId={breweryId}
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
