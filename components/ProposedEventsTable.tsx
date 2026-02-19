'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatEventDate, formatTime12Hour } from '@/lib/utils'
import { Colors } from '@/lib/colors'
import { ProposedEvent } from '@/types/supabase'
import {
  rejectProposedEvent,
  acceptProposedEvent,
  updateProposedEvent,
} from '@/app/breweries-events/actions'

interface ProposedEventsTableProps {
  proposed: ProposedEvent[]
  title: string
}

export function ProposedEventsTable({ proposed, title }: ProposedEventsTableProps) {
  const router = useRouter()
  const [editing, setEditing] = useState<ProposedEvent | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleReject(id: string) {
    setActionError(null)
    setLoadingId(id)
    const result = await rejectProposedEvent(id)
    setLoadingId(null)
    if (result.ok) router.refresh()
    else setActionError(result.error ?? 'Failed to reject')
  }

  async function handleAccept(p: ProposedEvent) {
    setActionError(null)
    setLoadingId(p.id)
    const result = await acceptProposedEvent(p)
    setLoadingId(null)
    if (result.ok) router.refresh()
    else setActionError(result.error ?? 'Failed to accept')
  }

  function openEdit(p: ProposedEvent) {
    setActionError(null)
    setEditing({ ...p })
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
          {proposed.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No proposed events
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
                    Recurring
                  </th>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: Colors.textDark }}>
                {proposed.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t"
                    style={{ borderColor: Colors.dividerLight }}
                  >
                    <td className="p-2">{p.title || '—'}</td>
                    <td className="p-2">
                      {p.event_date ? formatEventDate(p.event_date) : '—'}
                    </td>
                    <td className="p-2">
                      {p.start_time ? formatTime12Hour(p.start_time) : '—'}
                    </td>
                    <td className="p-2">{p.is_recurring ? 'Yes' : 'No'}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
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
                          onClick={() => handleAccept(p)}
                          disabled={!!loadingId}
                          className="px-2 py-1 text-xs rounded border"
                          style={{
                            borderColor: Colors.success,
                            color: Colors.textDark,
                            backgroundColor: Colors.background,
                          }}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(p.id)}
                          disabled={!!loadingId}
                          className="px-2 py-1 text-xs rounded border"
                          style={{
                            borderColor: Colors.error,
                            color: Colors.textDark,
                            backgroundColor: Colors.background,
                          }}
                        >
                          Reject
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
        <EditProposedEventModal
          proposed={editing}
          onSave={async (data) => {
            const result = await updateProposedEvent(editing.id, data)
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

function EditProposedEventModal({
  proposed,
  onSave,
  onClose,
}: {
  proposed: ProposedEvent
  onSave: (data: {
    title: string | null
    event_date: string | null
    start_time: string | null
    description: string | null
  }) => Promise<{ ok: boolean; error?: string }>
  onClose: () => void
}) {
  const [title, setTitle] = useState(proposed.title ?? '')
  const [eventDate, setEventDate] = useState(proposed.event_date ?? '')
  const [startTime, setStartTime] = useState(proposed.start_time ?? '')
  const [description, setDescription] = useState(proposed.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const result = await onSave({
      title: title.trim() || null,
      event_date: eventDate.trim() || null,
      start_time: startTime.trim() || null,
      description: description.trim() || null,
    })
    setSaving(false)
    if (!result.ok) setError(result.error ?? 'Failed to save')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: Colors.overlay }}
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-auto p-6"
        style={{ backgroundColor: Colors.background }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Edit proposed event
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.textDark }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.background,
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.textDark }}
            >
              Event date (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.background,
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.textDark }}
            >
              Start time (HH:MM or HH:MM:SS)
            </label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="e.g. 14:30:00"
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.background,
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.textDark }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded resize-y"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.background,
              }}
            />
          </div>
          {error && (
            <p className="text-sm" style={{ color: Colors.error }}>
              {error}
            </p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.background,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded font-medium"
              style={{
                backgroundColor: Colors.primary,
                color: Colors.primaryDark,
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
