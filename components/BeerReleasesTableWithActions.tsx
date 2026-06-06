'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { BeerRelease } from '@/types/supabase'
import {
  createBeerReleaseInBase,
  deleteBeerReleaseFromBase,
  updateBeerReleaseInBase,
  type UpdateBeerReleasePayload,
} from '@/app/breweries-events/actions'
import { BeerReleaseFormModal } from '@/components/BeerReleaseFormModal'
import {
  AdminColumnHeader,
  AdminColumnScrollBody,
  AdminColumnShell,
  BeerReleaseAdminCard,
} from '@/components/breweriesEventsAdminCards'

interface BeerReleasesTableWithActionsProps {
  releases: BeerRelease[]
  title: string
  breweryId: string
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
      <AdminColumnShell>
        <AdminColumnHeader
          title={title}
          action={
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
          }
        />
        <AdminColumnScrollBody>
          {releases.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No beer releases
            </p>
          ) : (
            releases.map((r) => (
              <BeerReleaseAdminCard
                key={r.id}
                release={r}
                onEdit={() => openEdit(r)}
                onDelete={() => handleDelete(r.id)}
                disabled={!!loadingId}
              />
            ))
          )}
        </AdminColumnScrollBody>
      </AdminColumnShell>

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
