'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { Colors } from '@/lib/colors'
import { BreweryWithData, breweryAnchorId } from '@/lib/breweriesEventsRegions'

interface BreweriesEventsBreweryBreakdownProps {
  regionBreweries: BreweryWithData[]
}

interface BreweryBreakdownRow {
  breweryId: string
  breweryName: string
  events: number
  proposed: number
  releases: number
  proposedBeers: number
}

function BreweryBreakdownEntry({
  row,
  onNavigate,
}: {
  row: BreweryBreakdownRow
  onNavigate: () => void
}) {
  return (
    <div
      className="border-b py-3 last:border-b-0"
      style={{ borderColor: Colors.dividerLight }}
    >
      <a
        href={`#${breweryAnchorId(row.breweryId)}`}
        onClick={onNavigate}
        className="text-sm font-medium underline hover:opacity-80 leading-snug"
        style={{ color: Colors.primaryDark }}
      >
        {row.breweryName}
      </a>
      <div
        className="mt-0.5 truncate font-mono text-xs"
        style={{ color: Colors.textSecondary }}
        title="Brewery UUID"
      >
        {row.breweryId}
      </div>
      <div
        className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums"
        style={{ color: Colors.textDark }}
      >
        <span>
          <span style={{ color: Colors.textSecondary }}>Events </span>
          {row.events}
        </span>
        <span
          style={
            row.proposed > 0 ? { color: Colors.primaryDark, fontWeight: 600 } : undefined
          }
        >
          <span style={{ color: Colors.textSecondary, fontWeight: 400 }}>Proposed </span>
          {row.proposed}
        </span>
        <span>
          <span style={{ color: Colors.textSecondary }}>Releases </span>
          {row.releases}
        </span>
        <span
          style={
            row.proposedBeers > 0 ? { color: Colors.primaryDark, fontWeight: 600 } : undefined
          }
        >
          <span style={{ color: Colors.textSecondary, fontWeight: 400 }}>Prop. beers </span>
          {row.proposedBeers}
        </span>
      </div>
    </div>
  )
}

export function BreweriesEventsBreweryBreakdown({
  regionBreweries,
}: BreweriesEventsBreweryBreakdownProps) {
  const [open, setOpen] = useState(false)
  const titleId = useId()

  const rows: BreweryBreakdownRow[] = useMemo(
    () =>
      [...regionBreweries]
        .sort((a, b) => a.brewery.name.localeCompare(b.brewery.name))
        .map((row) => ({
          breweryId: row.brewery.id,
          breweryName: row.brewery.name,
          events: row.events.length,
          proposed: row.proposedEvents.length,
          releases: row.releases.length,
          proposedBeers: row.proposedBeerReleases.length,
        })),
    [regionBreweries]
  )

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-0 top-1/2 z-40 -translate-y-1/2 px-2.5 py-5 shadow-md transition-opacity hover:opacity-90"
        style={{
          backgroundColor: Colors.primaryDark,
          color: Colors.onPrimary,
          fontFamily: 'var(--font-fjalla-one)',
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span
          className="block text-xs font-bold uppercase tracking-[0.18em]"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Breweries · {rows.length}
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close brewery list"
            onClick={() => setOpen(false)}
          />

          <aside
            className="hop-admin-drawer-panel relative z-[1] flex h-full w-[min(100vw,22rem)] flex-col shadow-2xl sm:w-[24rem]"
            style={{ backgroundColor: Colors.surface }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div
              className="flex items-start justify-between gap-3 border-b px-4 py-4"
              style={{ borderColor: Colors.dividerLight }}
            >
              <div className="min-w-0">
                <p
                  id={titleId}
                  className="text-lg font-bold uppercase tracking-wide"
                  style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  Breweries
                </p>
                <p className="mt-1 text-xs" style={{ color: Colors.textSecondary }}>
                  Jump to events, proposed &amp; releases
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 px-2 py-1 text-sm font-semibold underline hover:opacity-80"
                style={{ color: Colors.primaryDark }}
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {rows.length === 0 ? (
                <p className="py-6 text-sm" style={{ color: Colors.textSecondary }}>
                  No breweries in this region.
                </p>
              ) : (
                rows.map((row) => (
                  <BreweryBreakdownEntry
                    key={row.breweryId}
                    row={row}
                    onNavigate={() => setOpen(false)}
                  />
                ))
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
