'use client'

import { Colors } from '@/lib/colors'

export type SocialToast = {
  id: string
  kind: 'success' | 'error' | 'warning' | 'info'
  message: string
}

const KIND_STYLE: Record<SocialToast['kind'], { bg: string; border: string; fg: string }> = {
  success: { bg: '#D4EDDA', border: '#2D5A27', fg: '#155724' },
  error: { bg: '#F8D7DA', border: Colors.error, fg: '#721C24' },
  warning: { bg: '#FFF3CD', border: Colors.warning, fg: '#856404' },
  info: { bg: '#D1ECF1', border: '#0C5460', fg: '#0C5460' },
}

export function SocialToasts({
  toasts,
  onDismiss,
}: {
  toasts: SocialToast[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,360px)] flex-col gap-2">
      {toasts.map((t) => {
        const s = KIND_STYLE[t.kind]
        return (
          <div
            key={t.id}
            role="status"
            className="rounded-lg border px-3 py-2 text-sm shadow-md"
            style={{ backgroundColor: s.bg, borderColor: s.border, color: s.fg }}
          >
            <div className="flex items-start gap-2">
              <p className="flex-1">{t.message}</p>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="shrink-0 text-xs opacity-70 hover:opacity-100"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
