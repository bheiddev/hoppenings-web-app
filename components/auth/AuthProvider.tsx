'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import { getProfile } from '@/lib/auth/profileService'
import { signOut as authSignOut } from '@/lib/auth/authService'
import type { Profile } from '@/types/supabase'

type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  needsDisplayName: boolean
  passwordRecoveryPending: boolean
  refreshProfile: () => Promise<void>
  clearPasswordRecovery: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_PUBLIC_PATHS = new Set([
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/callback',
])

function hasDisplayName(profile: Profile | null): boolean {
  return Boolean(profile?.display_name?.trim())
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(false)

  const loadProfile = useCallback(async (userId: string) => {
    const data = await getProfile(userId)
    setProfile(data)
    return data
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }
    await loadProfile(user.id)
  }, [user, loadProfile])

  const clearPasswordRecovery = useCallback(() => {
    setPasswordRecoveryPending(false)
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setPasswordRecoveryPending(false)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    let cancelled = false

    async function init() {
      try {
        const {
          data: { user: validatedUser },
          error,
        } = await supabase.auth.getUser()

        if (cancelled) return

        if (error || !validatedUser) {
          if (error) {
            try {
              await supabase.auth.signOut()
            } catch {
              // ignore
            }
          }
          setUser(null)
          setSession(null)
          setProfile(null)
          setIsLoading(false)
          return
        }

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (cancelled) return

        setUser(validatedUser)
        setSession(currentSession)
        await loadProfile(validatedUser.id)
      } catch (err) {
        console.error('Auth init failed:', err)
        if (!cancelled) {
          setUser(null)
          setSession(null)
          setProfile(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryPending(true)
      }

      const nextUser = nextSession?.user ?? null
      setSession(nextSession)
      setUser(nextUser)

      if (nextUser) {
        await loadProfile(nextUser.id)
      } else {
        setProfile(null)
        setPasswordRecoveryPending(false)
      }

      setIsLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const needsDisplayName = Boolean(user && !isLoading && !hasDisplayName(profile))

  // Route gates: recovery → set-password; missing display name → display-name screen
  useEffect(() => {
    if (isLoading) return

    if (passwordRecoveryPending && pathname !== '/auth/set-password') {
      router.replace('/auth/set-password')
      return
    }

    if (
      needsDisplayName &&
      !passwordRecoveryPending &&
      pathname !== '/auth/display-name' &&
      pathname !== '/auth/callback' &&
      pathname !== '/auth/set-password'
    ) {
      router.replace('/auth/display-name')
      return
    }

    // Signed-in users with a display name don't need auth entry / gate pages
    if (
      user &&
      !needsDisplayName &&
      !passwordRecoveryPending &&
      (AUTH_PUBLIC_PATHS.has(pathname) || pathname === '/auth/display-name')
    ) {
      router.replace('/account')
    }
  }, [
    isLoading,
    passwordRecoveryPending,
    needsDisplayName,
    pathname,
    router,
    user,
  ])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isAuthenticated: !!user,
      needsDisplayName,
      passwordRecoveryPending,
      refreshProfile,
      clearPasswordRecovery,
      signOut,
    }),
    [
      user,
      session,
      profile,
      isLoading,
      needsDisplayName,
      passwordRecoveryPending,
      refreshProfile,
      clearPasswordRecovery,
      signOut,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
