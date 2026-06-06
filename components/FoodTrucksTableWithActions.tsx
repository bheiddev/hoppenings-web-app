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
          className="flex-shrink-0 px-3 py-2 font-semibold text-sm"
          style={{ backgroundColor: Colors.backgroundLight, color: Colors.textDark }}
        >
          {title}
        </div>
        <div className="min-h-[12rem] max-h-[min(32rem,70vh)] overflow-y-auto overflow-x-auto overscroll-y-contain [scrollbar-gutter:stable]">
          {foodTrucks.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No food trucks
            </p>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[20rem]">
              <thead
                className="sticky top-0 z-10"
                style={{ backgroundColor: Colors.backgroundLight }}
              >
                <tr>
                  <th className="p-2 font-medium min-w-[8rem]" style={{ color: Colors.textDark }}>
                    Name
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Date
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: Colors.textDark }}>
                {foodTrucks.map((truck) => (
                  <tr
                    key={truck.id}
                    className="border-t align-top"
                    style={{ borderColor: Colors.dividerLight }}
                  >
                    <td className="p-2 break-words">{truck.name || '—'}</td>
                    <td className="p-2 whitespace-nowrap">
                      {truck.date ? formatEventDate(truck.date) : '—'}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
