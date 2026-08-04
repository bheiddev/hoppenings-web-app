'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AuthDivider,
  AuthError,
  AuthField,
  AuthInput,
  AuthPrimaryButton,
  AuthSecondaryLink,
  AuthShell,
  OAuthButtons,
} from '@/components/auth/AuthShell'
import { signInWithEmail, signInWithOAuth } from '@/lib/auth/authService'
import { getProfile } from '@/lib/auth/profileService'
import { getPostAuthPath } from '@/lib/auth/postAuthRedirect'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import { Colors } from '@/lib/colors'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signInWithEmail(email.trim(), password)
    if (!result.success) {
      setLoading(false)
      setError(result.error ?? 'Sign in failed')
      return
    }

    const supabase = getSupabaseBrowser()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const profile = user ? await getProfile(user.id) : null
    setLoading(false)
    router.replace(getPostAuthPath(profile, next))
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setError(null)
    setLoading(true)
    const result = await signInWithOAuth(provider)
    if (!result.success) {
      setLoading(false)
      setError(result.error ?? 'OAuth sign in failed')
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Use your Hoppenings account — same as the mobile app.">
      <AuthError message={error} />
      <form onSubmit={handleSubmit}>
        <AuthField label="Email">
          <AuthInput
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </AuthField>
        <AuthField label="Password">
          <AuthInput
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </AuthField>
        <div className="mb-4 flex justify-end">
          <AuthSecondaryLink href="/auth/forgot-password">Forgot password?</AuthSecondaryLink>
        </div>
        <AuthPrimaryButton loading={loading}>Sign in</AuthPrimaryButton>
      </form>

      <AuthDivider />
      <OAuthButtons
        disabled={loading}
        onGoogle={() => handleOAuth('google')}
        onApple={() => handleOAuth('apple')}
      />

      <p className="mt-6 text-sm text-center" style={{ color: Colors.textSecondary }}>
        Don&apos;t have an account?{' '}
        <AuthSecondaryLink href="/auth/sign-up">Sign up</AuthSecondaryLink>
      </p>
    </AuthShell>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Sign in" subtitle="Loading…">
          <p className="text-sm" style={{ color: Colors.textSecondary }}>
            Loading…
          </p>
        </AuthShell>
      }
    >
      <SignInForm />
    </Suspense>
  )
}
