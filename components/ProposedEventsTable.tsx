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

export function ProposedEventsTable({ proposed, title }: ProposedEventsTableProps) {
  const router = useRouter()
  const [editing, setEditing] = useState<ProposedEvent | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleReject(id: string) {
    setActionError(null)
    setLoadingId(id)
    try {
      const result = await rejectProposedEvent(id)
      setLoadingId(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to reject')
    } catch (err) {
      setLoadingId(null)
      setActionError(err instanceof Error ? err.message : 'Reject failed')
    }
  }

  async function handleAccept(p: ProposedEvent) {
    setActionError(null)
    setLoadingId(p.id)
    try {
      const result = await acceptProposedEvent(p)
      setLoadingId(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to accept')
    } catch (err) {
      setLoadingId(null)
      setActionError(err instanceof Error ? err.message : 'Accept failed')
    }
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
          {proposed.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No proposed events
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: Colors.dividerLight }}>
              {proposed.map((p) => (
                <div key={p.id} className="p-2 flex flex-col gap-1 text-xs">
                  <CompactField label="ID" value={<span className="font-mono break-all">{p.id}</span>} />
                  <CompactField label="Title" value={p.title || '—'} />
                  <CompactField
                    label="Description"
                    value={p.description?.trim() ? p.description : '—'}
                  />
                  <CompactField
                    label="Date"
                    value={p.event_date ? formatEventDate(p.event_date) : '—'}
                  />
                  <CompactField
                    label="Time"
                    value={p.start_time ? formatTime12Hour(p.start_time) : '—'}
                  />
                  <CompactField label="Recurring" value={p.is_recurring ? 'Yes' : 'No'} />
                  <div className="flex flex-wrap gap-1 pt-1">
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
                </div>
              ))}
            </div>
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
    try {
      const result = await onSave({
        title: title.trim() || null,
        event_date: eventDate.trim() || null,
        start_time: startTime.trim() || null,
        description: description.trim() || null,
      })
      if (!result?.ok) setError(result?.error ?? 'Failed to save')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
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
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
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
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
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
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
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
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
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
