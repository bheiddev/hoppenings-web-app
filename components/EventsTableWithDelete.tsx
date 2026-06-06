'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatEventDate, formatTime12Hour } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { Event } from '@/types/supabase'
import {
  createEventInEventsBase,
  deleteEventFromEventsBase,
  updateEventInEventsBase,
  type UpdateEventPayload,
} from '@/app/breweries-events/actions'
import { EventFormModal } from '@/components/EventFormModal'

interface EventsTableWithDeleteProps {
  events: Event[]
  title: string
  breweryId: string
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

export function EventsTableWithDelete({ events, title, breweryId }: EventsTableWithDeleteProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Event | null>(null)
  const [adding, setAdding] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(eventId: string) {
    setActionError(null)
    setLoadingId(eventId)
    try {
      const result = await deleteEventFromEventsBase(eventId)
      setLoadingId(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to delete')
    } catch (err) {
      setLoadingId(null)
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
          {events.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No events
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: Colors.dividerLight }}>
              {events.map((e) => (
                <div
                  key={e.id}
                  className="p-2 flex flex-col gap-1 text-xs"
                  style={{
                    backgroundColor: e.featured ? 'rgba(248, 199, 1, 0.12)' : Colors.background,
                  }}
                >
                  <CompactField label="ID" value={<span className="font-mono break-all">{e.id}</span>} />
                  <CompactField label="Title" value={e.title || '—'} />
                  <CompactField
                    label="Description"
                    value={e.description?.trim() ? e.description : '—'}
                  />
                  <CompactField
                    label="Date"
                    value={e.event_date ? formatEventDate(e.event_date) : '—'}
                  />
                  <CompactField
                    label="Start"
                    value={e.start_time ? formatTime12Hour(e.start_time) : '—'}
                  />
                  <CompactField
                    label="End"
                    value={e.end_time ? formatTime12Hour(e.end_time) : '—'}
                  />
                  <CompactField label="Cost" value={e.cost != null ? String(e.cost) : '—'} />
                  <CompactField label="Featured" value={e.featured ? 'Yes' : 'No'} />
                  <CompactField label="Recurring" value={e.is_recurring ? 'Yes' : 'No'} />
                  <CompactField
                    label="Biweekly"
                    value={e.is_recurring_biweekly ? 'Yes' : 'No'}
                  />
                  <CompactField
                    label="Monthly"
                    value={e.is_recurring_monthly ? 'Yes' : 'No'}
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
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
                      onClick={() => handleDelete(e.id)}
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
