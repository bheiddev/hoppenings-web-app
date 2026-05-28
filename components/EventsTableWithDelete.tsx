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
        <div
          className="min-h-[12rem] max-h-[min(32rem,70vh)] overflow-y-auto overflow-x-auto overscroll-y-contain [scrollbar-gutter:stable]"
        >
          {events.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No events
            </p>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[48rem]">
              <thead
                className="sticky top-0 z-10"
                style={{ backgroundColor: Colors.backgroundLight }}
              >
                <tr>
                  <th className="p-2 font-medium min-w-[10rem]" style={{ color: Colors.textDark }}>
                    Title
                  </th>
                  <th className="p-2 font-medium min-w-[16rem]" style={{ color: Colors.textDark }}>
                    Description
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Date
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Start
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    End
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Cost
                  </th>
                  <th className="p-2 font-medium whitespace-nowrap" style={{ color: Colors.textDark }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: Colors.textDark }}>
                {events.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t align-top"
                    style={{ borderColor: Colors.dividerLight }}
                  >
                    <td className="p-2 break-words">{e.title || '—'}</td>
                    <td className="p-2 text-xs break-words whitespace-pre-wrap">
                      {e.description?.trim() ? e.description : '—'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {e.event_date ? formatEventDate(e.event_date) : '—'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {e.start_time ? formatTime12Hour(e.start_time) : '—'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {e.end_time ? formatTime12Hour(e.end_time) : '—'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {e.cost != null ? String(e.cost) : '—'}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
