'use client'

import { useState } from 'react'
import { Colors } from '@/lib/colors'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import {
  sendAdminPushNotification,
  type SendPushNotificationResult,
} from '@/app/admin/actions'

const inputStyle = {
  borderColor: Colors.dividerLight,
  color: Colors.textDark,
  backgroundColor: Colors.surface,
} as const

export function PushNotificationsSection() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [dataJson, setDataJson] = useState('{\n  "type": "broadcast"\n}')
  const [functionName, setFunctionName] = useState('send-push')
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<SendPushNotificationResult | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setResult(null)

    let data: Record<string, unknown> | undefined
    const trimmedData = dataJson.trim()
    if (trimmedData) {
      try {
        const parsed = JSON.parse(trimmedData) as unknown
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          setFormError('Data must be a JSON object (e.g. { "type": "broadcast" }).')
          return
        }
        data = parsed as Record<string, unknown>
      } catch {
        setFormError('Data JSON is invalid.')
        return
      }
    }

    setSending(true)
    try {
      const next = await sendAdminPushNotification({
        title,
        body,
        data,
        functionName,
      })
      setResult(next)
      if (!next.ok) {
        setFormError(next.error ?? 'Push send failed')
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Push send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Push Notifications
        </h2>
        <p className="mt-1 text-sm max-w-3xl" style={{ color: Colors.textSecondary }}>
          Calls the Supabase edge function that loads active{' '}
          <code className="text-xs">device_tokens</code> and fans out Expo pushes. Auth uses the
          project anon key as <code className="text-xs">Bearer</code> (server-side). The full
          HTTP response is shown below for debugging.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border p-4 sm:p-5 max-w-2xl"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
      >
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
            Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            style={inputStyle}
            placeholder="Tonight on Hoppenings"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
            Body
          </label>
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded"
            style={inputStyle}
            placeholder="New events and releases near you."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
            Data (JSON object, optional)
          </label>
          <textarea
            value={dataJson}
            onChange={(e) => setDataJson(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full px-3 py-2 border rounded font-mono text-xs"
            style={inputStyle}
          />
          <p className="text-[11px] mt-1" style={{ color: Colors.textMuted }}>
            Passed through to Expo as the notification <code className="text-[10px]">data</code>{' '}
            payload. Leave as <code className="text-[10px]">{'{}'}</code> if unused.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
            Edge function name
          </label>
          <input
            type="text"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            className="w-full px-3 py-2 border rounded font-mono text-sm"
            style={inputStyle}
            placeholder="send-push"
          />
          <p className="text-[11px] mt-1" style={{ color: Colors.textMuted }}>
            Invokes{' '}
            <code className="text-[10px]">
              {'{SUPABASE_URL}'}/functions/v1/{functionName || 'send-push'}
            </code>
          </p>
        </div>

        {formError ? (
          <p className="text-sm" style={{ color: Colors.error }}>
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end pt-1">
          <AdminButton variant="save" type="submit" loading={sending}>
            Send push to all active devices
          </AdminButton>
        </div>
      </form>

      {result ? <DebugPanel result={result} /> : null}
    </section>
  )
}

function DebugPanel({ result }: { result: SendPushNotificationResult }) {
  const { debug } = result
  const statusColor = result.ok ? Colors.success : Colors.error

  return (
    <div
      className="rounded-lg border overflow-hidden max-w-3xl"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <div
        className="px-4 py-3 flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: Colors.surfaceLight }}
      >
        <h3
          className="text-lg font-semibold"
          style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Debug response
        </h3>
        <span
          className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: `${statusColor}18`,
            color: statusColor,
            border: `1px solid ${statusColor}44`,
          }}
        >
          {result.ok ? 'Success' : 'Failed'}
          {debug.httpStatus != null ? ` · HTTP ${debug.httpStatus}` : ''}
        </span>
      </div>

      <div className="px-4 py-3 space-y-4 text-sm">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DebugField label="Request URL" value={debug.requestUrl || '—'} mono />
          <DebugField label="Duration" value={`${debug.durationMs} ms`} />
          <DebugField
            label="Active device tokens"
            value={
              debug.activeDeviceTokenCount == null
                ? '—'
                : debug.activeDeviceTokenCount.toLocaleString()
            }
          />
          <DebugField label="Started at" value={debug.startedAt} mono />
        </dl>

        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: Colors.textSecondary }}
          >
            Request payload
          </p>
          <pre
            className="overflow-x-auto rounded border p-3 text-xs font-mono whitespace-pre-wrap break-words"
            style={{
              borderColor: Colors.dividerLight,
              backgroundColor: Colors.surfaceLight,
              color: Colors.textDark,
            }}
          >
            {JSON.stringify(debug.requestPayload, null, 2)}
          </pre>
        </div>

        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: Colors.textSecondary }}
          >
            Response body
          </p>
          <pre
            className="overflow-x-auto rounded border p-3 text-xs font-mono whitespace-pre-wrap break-words max-h-80 overflow-y-auto"
            style={{
              borderColor: Colors.dividerLight,
              backgroundColor: Colors.surfaceLight,
              color: Colors.textDark,
            }}
          >
            {debug.responseJson != null
              ? JSON.stringify(debug.responseJson, null, 2)
              : debug.responseBodyText || '(empty)'}
          </pre>
        </div>

        {Object.keys(debug.responseHeaders).length > 0 ? (
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-1"
              style={{ color: Colors.textSecondary }}
            >
              Response headers
            </p>
            <pre
              className="overflow-x-auto rounded border p-3 text-xs font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto"
              style={{
                borderColor: Colors.dividerLight,
                backgroundColor: Colors.surfaceLight,
                color: Colors.textMuted,
              }}
            >
              {JSON.stringify(debug.responseHeaders, null, 2)}
            </pre>
          </div>
        ) : null}

        {!result.ok && result.error ? (
          <p className="text-sm" style={{ color: Colors.error }}>
            {result.error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function DebugField({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: Colors.textMuted }}
      >
        {label}
      </dt>
      <dd
        className={`mt-0.5 break-all ${mono ? 'font-mono text-xs' : ''}`}
        style={{ color: Colors.textDark }}
      >
        {value}
      </dd>
    </div>
  )
}
