'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  canAccessBreweryStaffAdmin,
  canAccessContentAdmin,
} from '@/lib/auth/adminAccess'
import { Colors } from '@/lib/colors'

/**
 * Client gate for protected routes. Auth is browser/localStorage-based,
 * so this is the access control surface for admin / staff UI.
 *
 * Content admin uses profiles.admin. Staff brewery admin requires
 * staff_brewery_id + brewery_admin.
 *
 * Once the user has passed the gate, keep children mounted across brief
 * auth revalidations so UI state (e.g. admin tabs) is not wiped.
 */
export function RequireAuth({
  children,
  requireAdmin = false,
  requireStaffBrewery = false,
}: {
  children: React.ReactNode
  requireAdmin?: boolean
  /** Staff brewery managers (staff_brewery_id + brewery_admin). */
  requireStaffBrewery?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoading, isAuthenticated, profile } = useAuth()
  const redirectingRef = useRef(false)
  const unlockedRef = useRef(false)

  // Authenticated but profile not loaded yet — don't treat as unauthorized.
  const waitingOnProfile = isAuthenticated && profile === null
  const isContentAdmin = canAccessContentAdmin(profile)
  const isStaffAdmin = canAccessBreweryStaffAdmin(profile)

  const isAuthorized =
    isAuthenticated &&
    (!requireAdmin || isContentAdmin) &&
    (!requireStaffBrewery || isStaffAdmin)

  if (isAuthorized) {
    unlockedRef.current = true
  } else if (!isLoading && !waitingOnProfile && !isAuthenticated) {
    unlockedRef.current = false
  }

  useEffect(() => {
    if (isLoading || waitingOnProfile) return
    if (redirectingRef.current) return

    if (!isAuthenticated) {
      redirectingRef.current = true
      unlockedRef.current = false
      const fallback = requireStaffBrewery ? '/staff' : '/admin'
      const next = encodeURIComponent(pathname || fallback)
      router.replace(`/auth/sign-in?next=${next}`)
      return
    }

    if (requireAdmin && !isContentAdmin) {
      redirectingRef.current = true
      unlockedRef.current = false
      router.replace(isStaffAdmin ? '/staff' : '/profile')
      return
    }

    if (requireStaffBrewery && !isStaffAdmin) {
      redirectingRef.current = true
      unlockedRef.current = false
      router.replace(isContentAdmin ? '/admin' : '/profile')
    }
  }, [
    isLoading,
    waitingOnProfile,
    isAuthenticated,
    isContentAdmin,
    isStaffAdmin,
    requireAdmin,
    requireStaffBrewery,
    router,
    pathname,
  ])

  // Already unlocked: keep the UI up during quiet rechecks.
  if (unlockedRef.current) {
    return <>{children}</>
  }

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
  if (requireAdmin && !isContentAdmin) return null
  if (requireStaffBrewery && !isStaffAdmin) return null

  return <>{children}</>
}
