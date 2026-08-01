'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { ProposedEvent } from '@/types/supabase'
import {
  rejectProposedEvent,
  acceptProposedEvent,
  updateProposedEvent,
  type UpdateProposedEventPayload,
} from '@/app/breweries-events/actions'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import {
  AdminColumnHeader,
  AdminColumnScrollBody,
  AdminColumnShell,
  ProposedEventAdminCard,
} from '@/components/breweriesEventsAdminCards'

function acceptProposedKey(id: number) {
  return `accept:proposed:${id}`
}

function rejectProposedKey(id: number) {
  return `reject:proposed:${id}`
}

interface ProposedEventsTableProps {
  proposed: ProposedEvent[]
  title: string
}

export function ProposedEventsTable({ proposed, title }: ProposedEventsTableProps) {
  const router = useRouter()
  const [editing, setEditing] = useState<ProposedEvent | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleReject(id: number) {
    setActionError(null)
    setPendingKey(rejectProposedKey(id))
    try {
      const result = await rejectProposedEvent(id)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to reject')
    } catch (err) {
      setPendingKey(null)
      setActionError(err instanceof Error ? err.message : 'Reject failed')
    }
  }

  async function handleAccept(p: ProposedEvent) {
    setActionError(null)
    setPendingKey(acceptProposedKey(p.id))
    try {
      const result = await acceptProposedEvent(p)
      setPendingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to accept')
    } catch (err) {
      setPendingKey(null)
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
      <AdminColumnShell>
        <AdminColumnHeader title={title} />
        <AdminColumnScrollBody>
          {proposed.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No proposed events
            </p>
          ) : (
            proposed.map((p) => (
              <ProposedEventAdminCard
                key={p.id}
                proposed={p}
                onEdit={() => openEdit(p)}
                onAccept={() => handleAccept(p)}
                onReject={() => handleReject(p.id)}
                actionsDisabled={pendingKey !== null}
                acceptLoading={pendingKey === acceptProposedKey(p.id)}
                rejectLoading={pendingKey === rejectProposedKey(p.id)}
              />
            ))
          )}
        </AdminColumnScrollBody>
      </AdminColumnShell>

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

export function EditProposedEventModal({
  proposed,
  onSave,
  onClose,
}: {
  proposed: ProposedEvent
  onSave: (data: UpdateProposedEventPayload) => Promise<{ ok: boolean; error?: string }>
  onClose: () => void
}) {
  const [title, setTitle] = useState(proposed.title ?? '')
  const [description, setDescription] = useState(proposed.description ?? '')
  const [eventDate, setEventDate] = useState(proposed.event_date ?? '')
  const [startTime, setStartTime] = useState(proposed.start_time ?? '')
  const [endTime, setEndTime] = useState(proposed.end_time ?? '')
  const [cost, setCost] = useState(proposed.cost != null ? String(proposed.cost) : '')
  const [breweryId, setBreweryId] = useState(proposed.brewery_id ?? '')
  const [breweryId2, setBreweryId2] = useState(proposed.brewery_id2 ?? '')
  const [breweryId3, setBreweryId3] = useState(proposed.brewery_id3 ?? '')
  const [featured, setFeatured] = useState(proposed.featured ?? false)
  const [isRecurring, setIsRecurring] = useState(proposed.is_recurring ?? false)
  const [isRecurringBiweekly, setIsRecurringBiweekly] = useState(
    proposed.is_recurring_biweekly ?? false
  )
  const [isRecurringMonthly, setIsRecurringMonthly] = useState(
    proposed.is_recurring_monthly ?? false
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const parsedCost = cost.trim() === '' ? null : Number(cost)
      if (cost.trim() !== '' && Number.isNaN(parsedCost)) {
        setError('Cost must be a number')
        setSaving(false)
        return
      }
      const result = await onSave({
        title: title.trim() || null,
        description: description.trim() || null,
        event_date: eventDate.trim() || null,
        start_time: startTime.trim() || null,
        end_time: endTime.trim() || null,
        cost: parsedCost,
        featured,
        is_recurring: isRecurring,
        is_recurring_biweekly: isRecurringBiweekly,
        is_recurring_monthly: isRecurringMonthly,
        brewery_id: breweryId.trim() || null,
        brewery_id2: breweryId2.trim() || null,
        brewery_id3: breweryId3.trim() || null,
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
        style={{ backgroundColor: Colors.surface }}
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
                backgroundColor: Colors.surface,
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
                backgroundColor: Colors.surface,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Event date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.surface,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Start time
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
                backgroundColor: Colors.surface,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              End time
            </label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="e.g. 18:00:00"
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.surface,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Cost
            </label>
            <input
              type="text"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.surface,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              brewery_id
            </label>
            <input
              type="text"
              value={breweryId}
              onChange={(e) => setBreweryId(e.target.value)}
              className="w-full px-3 py-2 border rounded font-mono text-sm"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.surface,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              brewery_id2
            </label>
            <input
              type="text"
              value={breweryId2}
              onChange={(e) => setBreweryId2(e.target.value)}
              className="w-full px-3 py-2 border rounded font-mono text-sm"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.surface,
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              brewery_id3
            </label>
            <input
              type="text"
              value={breweryId3}
              onChange={(e) => setBreweryId3(e.target.value)}
              className="w-full px-3 py-2 border rounded font-mono text-sm"
              style={{
                borderColor: Colors.dividerLight,
                color: Colors.textDark,
                backgroundColor: Colors.surface,
              }}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm" style={{ color: Colors.textDark }}>
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: Colors.textDark }}>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              Recurring
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: Colors.textDark }}>
              <input
                type="checkbox"
                checked={isRecurringBiweekly}
                onChange={(e) => setIsRecurringBiweekly(e.target.checked)}
              />
              Biweekly
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: Colors.textDark }}>
              <input
                type="checkbox"
                checked={isRecurringMonthly}
                onChange={(e) => setIsRecurringMonthly(e.target.checked)}
              />
              Monthly
            </label>
          </div>
          {error && (
            <p className="text-sm" style={{ color: Colors.error }}>
              {error}
            </p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <AdminButton variant="cancel" onClick={onClose} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton variant="save" type="submit" loading={saving}>
              Save
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  )
}
