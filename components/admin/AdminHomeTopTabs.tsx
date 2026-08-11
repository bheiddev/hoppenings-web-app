'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Colors } from '@/lib/colors'

const TAB_STORAGE_KEY = 'hoppenings-admin-home-tab'

export type AdminHomeTab = {
  id: string
  label: string
  panel: ReactNode
}

function readStoredTab(validIds: Set<string>, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = sessionStorage.getItem(TAB_STORAGE_KEY)
    if (stored && validIds.has(stored)) return stored
  } catch {
    // ignore
  }
  return fallback
}

export function AdminHomeTopTabs({
  tabs,
  defaultTabId,
}: {
  tabs: AdminHomeTab[]
  defaultTabId?: string
}) {
  const fallback =
    (defaultTabId && tabs.some((t) => t.id === defaultTabId) ? defaultTabId : null) ??
    tabs[0]?.id ??
    ''
  const validIds = new Set(tabs.map((t) => t.id))

  const [tab, setTab] = useState(fallback)

  useEffect(() => {
    setTab(readStoredTab(validIds, fallback))
    // Restore once after mount so a remount (auth gate) returns to the last tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, [])

  function selectTab(id: string) {
    setTab(id)
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, id)
    } catch {
      // ignore
    }
  }

  const active = tabs.find((t) => t.id === tab) ?? tabs[0]
  if (!active) return null

  return (
    <div className="mb-10">
      <div
        className="flex flex-wrap gap-2 mb-4"
        role="tablist"
        aria-label="Content Admin overview"
      >
        {tabs.map((t) => {
          const selected = t.id === active.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(t.id)}
              className="px-4 py-2 text-sm font-semibold border transition-opacity hover:opacity-90"
              style={{
                borderColor: selected ? Colors.primaryDark : Colors.dividerLight,
                backgroundColor: selected ? Colors.primaryDark : Colors.surface,
                color: selected ? Colors.onPrimary : Colors.textDark,
                fontFamily: 'var(--font-fjalla-one)',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel">{active.panel}</div>
    </div>
  )
}
