'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Colors } from '@/lib/colors'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signInWithEmail(email.trim(), password)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Sign in failed')
      return
    }
    router.replace('/account')
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
