'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { TaplistItem } from '@/types/supabase'
import { addTaplistItemToReleases } from '@/app/breweries-events/actions'

interface TaplistTableWithAddButtonProps {
  taplist: TaplistItem[]
  title: string
}

export function TaplistTableWithAddButton({ taplist, title }: TaplistTableWithAddButtonProps) {
  const router = useRouter()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function rowKey(t: TaplistItem) {
    return `${t.brewery_id}-${t.beer_name}`
  }

  function formatTimestamp(iso: string | null): string {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return d.toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    } catch {
      return iso
    }
  }

  async function handleAddToReleases(t: TaplistItem) {
    setActionError(null)
    setLoadingKey(rowKey(t))
    try {
      const result = await addTaplistItemToReleases(t)
      setLoadingKey(null)
      if (result?.ok) router.refresh()
      else setActionError(result?.error ?? 'Failed to add to releases')
    } catch (err) {
      setLoadingKey(null)
      setActionError(err instanceof Error ? err.message : 'Failed to add to releases')
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
          <button type="button" onClick={() => setActionError(null)} className="ml-2 underline">
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
          {taplist.length === 0 ? (
            <p className="p-3 text-sm" style={{ color: Colors.textSecondary }}>
              No taplist
            </p>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead
                className="sticky top-0 z-10"
                style={{ backgroundColor: Colors.backgroundLight }}
              >
                <tr>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    Beer
                  </th>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    ABV
                  </th>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    Type
                  </th>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    First seen
                  </th>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    Last seen
                  </th>
                  <th className="p-2 font-medium" style={{ color: Colors.textDark }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: Colors.textDark }}>
                {taplist.map((t) => (
                  <tr
                    key={rowKey(t)}
                    className="border-t"
                    style={{ borderColor: Colors.dividerLight }}
                  >
                    <td className="p-2">{t.beer_name || '—'}</td>
                    <td className="p-2">{t.abv ?? '—'}</td>
                    <td className="p-2">{t.type || '—'}</td>
                    <td className="p-2 whitespace-nowrap">{formatTimestamp(t.first_seen)}</td>
                    <td className="p-2 whitespace-nowrap">{formatTimestamp(t.last_seen)}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => handleAddToReleases(t)}
                        disabled={!!loadingKey}
                        className="px-2 py-1 text-xs rounded border"
                        style={{
                          borderColor: Colors.primary,
                          color: Colors.textDark,
                          backgroundColor: Colors.background,
                        }}
                      >
                        Add to releases
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
