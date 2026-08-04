import type { Metadata } from 'next'
import { AdminChrome } from '@/components/auth/AdminChrome'
import { RequireAuth } from '@/components/auth/RequireAuth'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Content Admin | Hoppenings',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth requireAdmin>
      <AdminChrome>{children}</AdminChrome>
    </RequireAuth>
  )
}
