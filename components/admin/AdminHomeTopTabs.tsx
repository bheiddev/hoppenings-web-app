'use client'

import { useState, type ReactNode } from 'react'
import { Colors } from '@/lib/colors'

export type AdminHomeTab = {
  id: string
  label: string
  panel: ReactNode
}

export function AdminHomeTopTabs({
  tabs,
  defaultTabId,
}: {
  tabs: AdminHomeTab[]
  defaultTabId?: string
}) {
  const initial =
    (defaultTabId && tabs.some((t) => t.id === defaultTabId) ? defaultTabId : null) ??
    tabs[0]?.id ??
    ''
  const [tab, setTab] = useState(initial)
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
              onClick={() => setTab(t.id)}
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
