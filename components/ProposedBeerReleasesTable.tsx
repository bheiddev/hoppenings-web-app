'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { ProposedBeerRelease } from '@/types/supabase'
import {
  rejectProposedBeerRelease,
  acceptProposedBeerRelease,
  updateProposedBeerRelease,
  type UpdateProposedBeerReleasePayload,
  type UpdateBeerReleasePayload,
} from '@/app/admin/actions'
import { BeerReleaseFormModal } from '@/components/BeerReleaseFormModal'
import {
  AdminColumnHeader,
  AdminColumnScrollBody,
  AdminColumnShell,
  ProposedBeerReleaseAdminCard,
} from '@/components/breweriesEventsAdminCards'

function acceptProposedBeerKey(id: number) {
  return `accept:proposed-beer:${id}`
}

function rejectProposedBeerKey(id: number) {
  return `reject:proposed-beer:${id}`
}

function proposedBeerAsReleaseShape(proposed: ProposedBeerRelease) {
  return {
    id: String(proposed.id),
    created_at: proposed.created_at,
    beer_name: proposed.beer_name ?? '',
    ABV: proposed.ABV,
    Type: proposed.Type,
    description: proposed.description,
    brewery_id: proposed.brewery_id ?? '',
    brewery_id2: proposed.brewery_id2,
    brewery_id3: proposed.brewery_id3,
    release_date: proposed.release_date,
    breweries: {
      id: proposed.brewery_id ?? '',
      name: '',
    },
  }
}

interface ProposedBeerReleasesTableProps {
  proposed: ProposedBeerRelease[]
  title: string
}

export function ProposedBeerReleasesTable({ proposed, title }: ProposedBeerReleasesTableProps) {
  const router = useRouter()
  const [editing, setEditing] = useState<ProposedBeerRelease | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleReject(id: number) {
    setActionError(null)
    setPendingKey(rejectProposedBeerKey(id))
    try {
      const result = await rejectProposedBeerRelease(id)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to reject')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Reject failed')
    }
  }

  async function handleAccept(p: ProposedBeerRelease) {
    setActionError(null)
    setPendingKey(acceptProposedBeerKey(p.id))
    try {
      const result = await acceptProposedBeerRelease(p)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to accept')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Accept failed')
    }
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
        <AdminColumnHeader title={title} />
        <AdminColumnScrollBody>
          {proposed.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No proposed beer releases
            </p>
          ) : (
            proposed.map((p) => (
              <ProposedBeerReleaseAdminCard
                key={p.id}
                proposed={p}
                onEdit={() => {
                  setActionError(null)
                  setEditing({ ...p })
                }}
                onAccept={() => handleAccept(p)}
                onReject={() => handleReject(p.id)}
                actionsDisabled={pendingKey !== null}
                acceptLoading={pendingKey === acceptProposedBeerKey(p.id)}
                rejectLoading={pendingKey === rejectProposedBeerKey(p.id)}
              />
            ))
          )}
        </AdminColumnScrollBody>
      </AdminColumnShell>

      {editing && (
        <BeerReleaseFormModal
          modalTitle="Edit proposed beer release"
          release={proposedBeerAsReleaseShape(editing)}
          defaultBreweryId={editing.brewery_id ?? ''}
          onSave={async (data: UpdateBeerReleasePayload) => {
            const payload: UpdateProposedBeerReleasePayload = {
              beer_name: data.beer_name,
              description: data.description,
              brewery_id: data.brewery_id,
              ABV: data.ABV,
              Type: data.Type,
              release_date: data.release_date,
              brewery_id2: data.brewery_id2,
              brewery_id3: data.brewery_id3,
            }
            const result = await updateProposedBeerRelease(editing.id, payload)
            if (result.ok) {
              setEditing(null)
              router.refresh()
            }
            return result
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
