'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import { BreweryFormModal } from '@/components/BreweryFormModal'

/**
 * Region-scoped create panel — same entry pattern as brewery "Edit details & hours".
 */
export function AddBreweryControl({ regionLabel }: { regionLabel: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className="border rounded-lg p-4 flex flex-wrap items-start justify-between gap-3"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
      >
        <div className="min-w-0 max-w-xl space-y-1">
          <h3
            className="text-lg font-semibold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Add brewery
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: Colors.textSecondary }}>
            Create a new <span className="font-mono text-xs">breweries</span> row for{' '}
            <strong style={{ color: Colors.textDark }}>{regionLabel}</strong>, set hours, and upload
            brewery / tap images (same fields as Edit details &amp; hours).
          </p>
        </div>
        <AdminButton variant="add" onClick={() => setOpen(true)} className="shrink-0">
          Add brewery
        </AdminButton>
      </div>

      {open ? (
        <BreweryFormModal
          regionLabel={regionLabel}
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      ) : null}
    </>
  )
}
