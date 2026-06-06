'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatEventDate } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { FoodTruck } from '@/types/supabase'
import { deleteFoodTruck, updateFoodTruck } from '@/app/breweries-events/actions'
import { FoodTruckFormModal } from '@/components/FoodTruckFormModal'

interface FoodTrucksTableWithActionsProps {
  foodTrucks: FoodTruck[]
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

export function FoodTrucksTableWithActions({
  foodTrucks,
  title,
  breweryId,
}: FoodTrucksTableWithActionsProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [editing, setEditing] = useState<FoodTruck | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(foodTruckId: number) {
    setActionError(null)
    setLoadingId(foodTruckId)
    try {
      const result = await deleteFoodTruck(foodTruckId)
      setLoadingId(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setLoadingId(null)
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  function openEdit(truck: FoodTruck) {
    setActionError(null)
    setEditing({ ...truck })
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
          className="flex-shrink-0 px-3 py-2 font-semibold text-sm break-words"
          style={{ backgroundColor: Colors.backgroundLight, color: Colors.textDark }}
        >
          {title}
        </div>
        <div className="overflow-hidden">
          {foodTrucks.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No food trucks
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: Colors.dividerLight }}>
              {foodTrucks.map((truck) => (
                <div key={truck.id} className="p-2 flex flex-col gap-1 text-xs">
                  <CompactField label="ID" value={String(truck.id)} />
                  <CompactField label="Created" value={formatCreatedAt(truck.created_at)} />
                  <CompactField label="Name" value={truck.name || '—'} />
                  <CompactField
                    label="Date"
                    value={truck.date ? formatEventDate(truck.date) : '—'}
                  />
                  <CompactField label="Permanent" value={truck.permanent ? 'Yes' : 'No'} />
                  <CompactField
                    label="Closed"
                    value={
                      truck.closed && truck.closed.length > 0 ? truck.closed.join(', ') : '—'
                    }
                  />
                  <CompactField
                    label="brewery_id"
                    value={
                      truck.brewery_id ? (
                        <span className="font-mono break-all">{truck.brewery_id}</span>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => openEdit(truck)}
                      disabled={loadingId !== null}
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
                      onClick={() => handleDelete(truck.id)}
                      disabled={loadingId !== null}
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

      {editing && (
        <FoodTruckFormModal
          modalTitle="Edit food truck"
          foodTruck={editing}
          defaultBreweryId={breweryId}
          onSave={async (data) => {
            const result = await updateFoodTruck(editing.id, data)
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
