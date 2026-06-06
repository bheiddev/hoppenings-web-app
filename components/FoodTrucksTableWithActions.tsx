'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { FoodTruck } from '@/types/supabase'
import { deleteFoodTruck, updateFoodTruck } from '@/app/breweries-events/actions'
import { FoodTruckFormModal } from '@/components/FoodTruckFormModal'
import {
  AdminColumnHeader,
  AdminColumnScrollBody,
  AdminColumnShell,
  FoodTruckAdminCard,
} from '@/components/breweriesEventsAdminCards'

function deleteFoodTruckKey(foodTruckId: number) {
  return `delete:food-truck:${foodTruckId}`
}

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
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [editing, setEditing] = useState<FoodTruck | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(foodTruckId: number) {
    setActionError(null)
    setPendingKey(deleteFoodTruckKey(foodTruckId))
    try {
      const result = await deleteFoodTruck(foodTruckId)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setPendingKey(null)
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
      <AdminColumnShell>
        <AdminColumnHeader title={title} />
        <AdminColumnScrollBody>
          {foodTrucks.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No food trucks
            </p>
          ) : (
            foodTrucks.map((truck) => (
              <FoodTruckAdminCard
                key={truck.id}
                foodTruck={truck}
                onEdit={() => openEdit(truck)}
                onDelete={() => handleDelete(truck.id)}
                actionsDisabled={pendingKey !== null}
                deleteLoading={pendingKey === deleteFoodTruckKey(truck.id)}
              />
            ))
          )}
        </AdminColumnScrollBody>
      </AdminColumnShell>

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
