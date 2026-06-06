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
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import {
  AdminColumnHeader,
  AdminColumnScrollBody,
  AdminColumnShell,
  BeerReleaseAdminCard,
} from '@/components/breweriesEventsAdminCards'

function deleteReleaseKey(releaseId: string) {
  return `delete:release:${releaseId}`
}

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
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [editing, setEditing] = useState<BeerRelease | null>(null)
  const [adding, setAdding] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(releaseId: string) {
    setActionError(null)
    setPendingKey(deleteReleaseKey(releaseId))
    try {
      const result = await deleteBeerReleaseFromBase(releaseId)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setPendingKey(null)
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
            <AdminButton
              variant="add"
              onClick={openAdd}
              disabled={pendingKey !== null}
              className="shrink-0 font-medium"
            >
              Add
            </AdminButton>
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
                actionsDisabled={pendingKey !== null}
                deleteLoading={pendingKey === deleteReleaseKey(r.id)}
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
