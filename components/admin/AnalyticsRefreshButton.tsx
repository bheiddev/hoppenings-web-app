'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'

/** Re-runs the admin page server fetch (GA4 / Search Console). */
export function AnalyticsRefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <AdminButton
      variant="edit"
      loading={pending}
      onClick={() => {
        startTransition(() => {
          router.refresh()
        })
      }}
    >
      {pending ? 'Refreshing…' : 'Refresh'}
    </AdminButton>
  )
}
