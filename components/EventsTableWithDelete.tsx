'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { Event } from '@/types/supabase'
import {
  createEventInEventsBase,
  deleteEventFromEventsBase,
  updateEventInEventsBase,
  type UpdateEventPayload,
} from '@/app/breweries-events/actions'
import { EventFormModal } from '@/components/EventFormModal'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import {
  AdminColumnHeader,
  AdminColumnScrollBody,
  AdminColumnShell,
  EventAdminCard,
} from '@/components/breweriesEventsAdminCards'

function deleteEventKey(eventId: string) {
  return `delete:event:${eventId}`
}

interface EventsTableWithDeleteProps {
  events: Event[]
  title: string
  breweryId: string
}

export function EventsTableWithDelete({ events, title, breweryId }: EventsTableWithDeleteProps) {
  const router = useRouter()
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [editing, setEditing] = useState<Event | null>(null)
  const [adding, setAdding] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(eventId: string) {
    setActionError(null)
    setPendingKey(deleteEventKey(eventId))
    try {
      const result = await deleteEventFromEventsBase(eventId)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  function openEdit(e: Event) {
    setActionError(null)
    setEditing({ ...e })
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
          {events.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No events
            </p>
          ) : (
            events.map((e) => (
              <EventAdminCard
                key={e.id}
                event={e}
                onEdit={() => openEdit(e)}
                onDelete={() => handleDelete(e.id)}
                actionsDisabled={pendingKey !== null}
                deleteLoading={pendingKey === deleteEventKey(e.id)}
              />
            ))
          )}
        </AdminColumnScrollBody>
      </AdminColumnShell>

      {adding && (
        <EventFormModal
          modalTitle="Add event"
          event={null}
          onSave={async (data: UpdateEventPayload) => {
            const result = await createEventInEventsBase(breweryId, data)
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
        <EventFormModal
          modalTitle="Edit event"
          event={editing}
          onSave={async (data: UpdateEventPayload) => {
            const result = await updateEventInEventsBase(editing.id, data)
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
