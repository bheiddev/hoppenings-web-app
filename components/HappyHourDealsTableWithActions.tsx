'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { HappyHourDeal } from '@/types/supabase'
import {
  createHappyHourDeal,
  deleteHappyHourDeal,
  deleteHappyHourDeals,
  updateHappyHourDeal,
} from '@/app/admin/actions'
import { HappyHourDealFormModal } from '@/components/HappyHourDealFormModal'
import { AdminButton, AdminDeleteAllButton } from '@/components/breweriesEventsAdminButtons'
import {
  AdminColumnHeader,
  AdminColumnScrollBody,
  AdminColumnShell,
  HappyHourDealAdminCard,
} from '@/components/breweriesEventsAdminCards'

function deleteDealKey(dealId: string) {
  return `delete:happy-hour:${dealId}`
}

interface HappyHourDealsTableWithActionsProps {
  deals: HappyHourDeal[]
  title: string
  breweryId: string
}

export function HappyHourDealsTableWithActions({
  deals,
  title,
  breweryId,
}: HappyHourDealsTableWithActionsProps) {
  const router = useRouter()
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [editing, setEditing] = useState<HappyHourDeal | null>(null)
  const [adding, setAdding] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(dealId: string) {
    setActionError(null)
    setPendingKey(deleteDealKey(dealId))
    try {
      const result = await deleteHappyHourDeal(dealId)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleDeleteAll() {
    const ids = deals.map((d) => d.id)
    if (ids.length === 0) return
    setActionError(null)
    setPendingKey('delete-all:happy-hour')
    try {
      const result = await deleteHappyHourDeals(ids)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete happy hour deals')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete all failed')
    }
  }

  return (
    <>
      {actionError ? (
        <div
          className="mb-2 rounded px-3 py-2 text-sm"
          style={{ backgroundColor: '#FEE2E2', color: Colors.error }}
        >
          {actionError}
          <button type="button" onClick={() => setActionError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      ) : null}
      <AdminColumnShell>
        <AdminColumnHeader
          title={title}
          action={
            <div className="flex items-center gap-1.5 shrink-0">
              <AdminDeleteAllButton
                count={deals.length}
                itemLabel="happy hour deals"
                disabled={pendingKey !== null}
                loading={pendingKey === 'delete-all:happy-hour'}
                onConfirm={handleDeleteAll}
              />
              <AdminButton
                variant="add"
                onClick={() => {
                  setActionError(null)
                  setAdding(true)
                }}
                disabled={pendingKey !== null}
                className="shrink-0 font-medium"
              >
                Add
              </AdminButton>
            </div>
          }
        />
        <AdminColumnScrollBody>
          {deals.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No happy hour / deals
            </p>
          ) : (
            deals.map((deal) => (
              <HappyHourDealAdminCard
                key={deal.id}
                deal={deal}
                onEdit={() => {
                  setActionError(null)
                  setEditing({ ...deal })
                }}
                onDelete={() => handleDelete(deal.id)}
                actionsDisabled={pendingKey !== null}
                deleteLoading={pendingKey === deleteDealKey(deal.id)}
              />
            ))
          )}
        </AdminColumnScrollBody>
      </AdminColumnShell>

      {editing ? (
        <HappyHourDealFormModal
          modalTitle="Edit happy hour / deal"
          deal={editing}
          defaultBreweryId={breweryId}
          onSave={async (data) => {
            const result = await updateHappyHourDeal(editing.id, data)
            if (result.ok) {
              setEditing(null)
              router.refresh()
            }
            return result
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {adding ? (
        <HappyHourDealFormModal
          modalTitle="Add happy hour / deal"
          deal={null}
          defaultBreweryId={breweryId}
          onSave={async (data) => {
            const result = await createHappyHourDeal(data)
            if (result.ok) {
              setAdding(false)
              router.refresh()
            }
            return result
          }}
          onClose={() => setAdding(false)}
        />
      ) : null}
    </>
  )
}
