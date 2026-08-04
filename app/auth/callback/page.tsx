'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthError, AuthShell } from '@/components/auth/AuthShell'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import { getProfile } from '@/lib/auth/profileService'
import { getPostAuthPath } from '@/lib/auth/postAuthRedirect'
import { Colors } from '@/lib/colors'

/**
 * Handles OAuth + email-confirm + recovery redirects.
 * detectSessionInUrl processes hash/query tokens; PKCE code is exchanged explicitly.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function handleCallback() {
      const supabase = getSupabaseBrowser()
      const url = new URL(window.location.href)
      const search = url.searchParams
      const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : '')

      const type = search.get('type') || hashParams.get('type')
      const code = search.get('code')
      const tokenHash = search.get('token_hash') || hashParams.get('token_hash')
      const accessToken = hashParams.get('access_token') || search.get('access_token')
      const refreshToken = hashParams.get('refresh_token') || search.get('refresh_token')
      const errorDescription =
        search.get('error_description') ||
        search.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error')

      if (errorDescription) {
        if (!cancelled) setError(decodeURIComponent(errorDescription.replace(/\+/g, ' ')))
        return
      }

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          )
          if (exchangeError) {
            // detectSessionInUrl may already have handled it — try getSession
            const { data } = await supabase.auth.getSession()
            if (!data.session) throw exchangeError
          }
        } else if (accessToken && refreshToken) {
          const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (setError) throw setError
        } else if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'recovery' | 'magiclink' | 'email',
          })
          if (verifyError) throw verifyError
        } else {
          // Allow detectSessionInUrl a brief moment, then read session
          await new Promise((r) => setTimeout(r, 50))
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw userError ?? new Error('Could not establish a session. Please try signing in again.')
        }

        if (type === 'recovery') {
          if (!cancelled) router.replace('/auth/set-password')
          return
        }

        const profile = await getProfile(user.id)
        const needsName = !profile?.display_name?.trim()
        if (!cancelled) {
          router.replace(needsName ? '/auth/display-name' : getPostAuthPath(profile))
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Authentication failed')
        }
      }
    }

    void handleCallback()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <AuthShell title="Signing you in…" subtitle="Just a moment while we finish authentication.">
      <AuthError message={error} />
      {!error && (
        <p className="text-sm text-center" style={{ color: Colors.textSecondary }}>
          Completing sign-in…
        </p>
      )}
    </AuthShell>
  )
}
