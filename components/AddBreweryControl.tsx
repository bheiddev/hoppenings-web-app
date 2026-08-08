'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import { BreweryFormModal } from '@/components/BreweryFormModal'

export function AddBreweryControl({ regionLabel }: { regionLabel: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <AdminButton variant="add" onClick={() => setOpen(true)}>
        Add brewery
      </AdminButton>
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
