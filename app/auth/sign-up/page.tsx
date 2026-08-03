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
  AuthSuccess,
  OAuthButtons,
} from '@/components/auth/AuthShell'
import { signInWithOAuth, signUpWithEmail } from '@/lib/auth/authService'
import { Colors } from '@/lib/colors'

const MIN_PASSWORD_LENGTH = 8

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }

    setLoading(true)
    const result = await signUpWithEmail(email.trim(), password)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Sign up failed')
      return
    }

    if (result.needsEmailVerification) {
      setCheckEmail(true)
      return
    }

    router.replace('/auth/display-name')
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

  if (checkEmail) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We sent a confirmation link. Open it to finish creating your Hoppenings account."
      >
        <AuthSuccess message={`Confirmation email sent to ${email.trim()}.`} />
        <p className="text-sm text-center" style={{ color: Colors.textSecondary }}>
          Already confirmed? <AuthSecondaryLink href="/auth/sign-in">Sign in</AuthSecondaryLink>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Sign up" subtitle="Create a Hoppenings account that works on web and mobile.">
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
        <AuthField label="Password (min 8 characters)">
          <AuthInput
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </AuthField>
        <AuthPrimaryButton loading={loading}>Create account</AuthPrimaryButton>
      </form>

      <AuthDivider />
      <OAuthButtons
        disabled={loading}
        onGoogle={() => handleOAuth('google')}
        onApple={() => handleOAuth('apple')}
      />

      <p className="mt-6 text-sm text-center" style={{ color: Colors.textSecondary }}>
        Already have an account? <AuthSecondaryLink href="/auth/sign-in">Sign in</AuthSecondaryLink>
      </p>
    </AuthShell>
  )
}
