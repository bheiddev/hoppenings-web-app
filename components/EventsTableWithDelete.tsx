'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatEventDate, formatTime12Hour } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { Event } from '@/types/supabase'
import { deleteEventFromEventsBase } from '@/app/breweries-events/actions'

interface EventsTableWithDeleteProps {
  events: Event[]
  title: string
}

export function EventsTableWithDelete({ events, title }: EventsTableWithDeleteProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
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
        className="flex flex-col h-64 border rounded-lg overflow-hidden"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.background }}
      >
        <div
          className="flex-shrink-0 px-3 py-2 font-semibold text-sm"
          style={{ backgroundColor: Colors.backgroundLight, color: Colors.textDark }}
        >
          {title}
        </div>
        <div className="flex-1 overflow-auto min-h-0">
          {events.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No events
            </p>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead
                className="sticky top-0 z-10"
                style={{ backgroundColor: Colors.backgroundLight }}
              >
                <tr>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    Title
                  </th>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    Date
                  </th>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    Time
                  </th>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: Colors.textDark }}>
                {events.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t"
                    style={{ borderColor: Colors.dividerLight }}
                  >
                    <td className="p-2">{e.title || '—'}</td>
                    <td className="p-2">
                      {e.event_date ? formatEventDate(e.event_date) : '—'}
                    </td>
                    <td className="p-2">
                      {e.start_time ? formatTime12Hour(e.start_time) : '—'}
                    </td>
                    <td className="p-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
