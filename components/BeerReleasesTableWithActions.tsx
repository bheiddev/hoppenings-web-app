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
          className="flex-shrink-0 px-3 py-2 font-semibold text-sm flex items-center justify-between gap-2"
          style={{ backgroundColor: Colors.backgroundLight, color: Colors.textDark }}
        >
          <span>{title}</span>
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
