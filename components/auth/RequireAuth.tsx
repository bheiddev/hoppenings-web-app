'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Colors } from '@/lib/colors'

/**
 * Client gate for protected routes. Auth is browser/localStorage-based,
 * so this is the access control surface for admin UI.
 */
export function RequireAuth({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode
  requireAdmin?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoading, isAuthenticated, profile } = useAuth()
  const redirectingRef = useRef(false)

  // Authenticated but profile not loaded yet — don't treat as non-admin.
  const waitingOnProfile = isAuthenticated && profile === null

  useEffect(() => {
    if (isLoading || waitingOnProfile) return
    if (redirectingRef.current) return

    if (!isAuthenticated) {
      redirectingRef.current = true
      const next = encodeURIComponent(pathname || '/admin')
      router.replace(`/auth/sign-in?next=${next}`)
      return
    }

    if (requireAdmin && !profile?.admin) {
      redirectingRef.current = true
      router.replace('/profile')
    }
  }, [
    isLoading,
    waitingOnProfile,
    isAuthenticated,
    profile?.admin,
    requireAdmin,
    router,
    pathname,
  ])

  if (isLoading || waitingOnProfile) {
    return (
      <div
        className="min-h-[40vh] flex items-center justify-center px-4"
        style={{ backgroundColor: Colors.surfaceMedium }}
      >
        <p className="text-sm" style={{ color: Colors.textSecondary }}>
          Checking access…
        </p>
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (requireAdmin && !profile?.admin) return null

  return <>{children}</>
}
