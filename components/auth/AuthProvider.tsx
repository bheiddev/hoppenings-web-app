'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import { getProfile } from '@/lib/auth/profileService'
import { getPostAuthPath } from '@/lib/auth/postAuthRedirect'
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
  const userIdRef = useRef<string | null>(null)
  const profileLoadedForUserRef = useRef<string | null>(null)
  const redirectingRef = useRef(false)

  const loadProfile = useCallback(async (userId: string) => {
    const data = await getProfile(userId)
    if (userIdRef.current === userId) {
      setProfile(data)
      profileLoadedForUserRef.current = userId
    }
    return data
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!userIdRef.current) {
      setProfile(null)
      profileLoadedForUserRef.current = null
      return
    }
    await loadProfile(userIdRef.current)
  }, [loadProfile])

  const clearPasswordRecovery = useCallback(() => {
    setPasswordRecoveryPending(false)
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    userIdRef.current = null
    profileLoadedForUserRef.current = null
    setUser(null)
    setSession(null)
    setProfile(null)
    setPasswordRecoveryPending(false)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    let cancelled = false

    async function applySession(nextSession: Session | null, opts?: { skipProfileIfLoaded?: boolean }) {
      const nextUser = nextSession?.user ?? null
      userIdRef.current = nextUser?.id ?? null
      setSession(nextSession)
      setUser(nextUser)

      if (!nextUser) {
        profileLoadedForUserRef.current = null
        setProfile(null)
        setPasswordRecoveryPending(false)
        setIsLoading(false)
        return
      }

      const alreadyLoaded = profileLoadedForUserRef.current === nextUser.id
      // Once we have a profile for this user, never flip global loading back
      // on — that unmounts RequireAuth children (e.g. admin tabs) on token
      // refresh / tab focus. Refresh the profile quietly in the background.
      if (alreadyLoaded) {
        setIsLoading(false)
        if (!opts?.skipProfileIfLoaded && !cancelled) {
          void loadProfile(nextUser.id)
        }
        return
      }

      // Keep loading true until the first profile fetch so RequireAuth doesn't
      // treat a missing profile as "not admin" and bounce the user.
      setIsLoading(true)
      try {
        if (!cancelled) await loadProfile(nextUser.id)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    async function init() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (cancelled) return

        if (!currentSession?.user) {
          await applySession(null)
          return
        }

        // Validate with server once; avoid signOut on transient failures
        const {
          data: { user: validatedUser },
          error,
        } = await supabase.auth.getUser()

        if (cancelled) return

        if (error || !validatedUser) {
          await applySession(null)
          return
        }

        await applySession(currentSession)
      } catch (err) {
        console.error('Auth init failed:', err)
        if (!cancelled) {
          userIdRef.current = null
          profileLoadedForUserRef.current = null
          setUser(null)
          setSession(null)
          setProfile(null)
          setIsLoading(false)
        }
      }
    }

    void init()

    // Do not await other Supabase calls inside this callback (auth lock).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryPending(true)
      }

      // INITIAL_SESSION overlaps init(); TOKEN_REFRESHED shouldn't refetch profile.
      if (event === 'INITIAL_SESSION') return
      if (event === 'TOKEN_REFRESHED') {
        setSession(nextSession)
        return
      }

      setTimeout(() => {
        if (cancelled) return
        void applySession(nextSession, {
          skipProfileIfLoaded: event === 'USER_UPDATED',
        })
      }, 0)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const profileReady = !user || profileLoadedForUserRef.current === user.id
  const needsDisplayName = Boolean(
    user && !isLoading && profileReady && !hasDisplayName(profile)
  )
  const isAdmin = Boolean(profile?.admin)

  useEffect(() => {
    if (isLoading) return
    if (!profileReady && user) return

    let destination: string | null = null

    if (passwordRecoveryPending && pathname !== '/auth/set-password') {
      destination = '/auth/set-password'
    } else if (
      needsDisplayName &&
      !passwordRecoveryPending &&
      pathname !== '/auth/display-name' &&
      pathname !== '/auth/callback' &&
      pathname !== '/auth/set-password'
    ) {
      destination = '/auth/display-name'
    } else if (
      user &&
      !needsDisplayName &&
      !passwordRecoveryPending &&
      (AUTH_PUBLIC_PATHS.has(pathname) || pathname === '/auth/display-name')
    ) {
      destination = isAdmin ? '/admin' : getPostAuthPath(profile)
    }

    if (!destination || destination === pathname || redirectingRef.current) return

    redirectingRef.current = true
    router.replace(destination)
    // Allow a later navigation after the route settles
    const t = setTimeout(() => {
      redirectingRef.current = false
    }, 500)
    return () => clearTimeout(t)
  }, [
    isLoading,
    profileReady,
    passwordRecoveryPending,
    needsDisplayName,
    isAdmin,
    pathname,
    router,
    user,
    profile,
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
