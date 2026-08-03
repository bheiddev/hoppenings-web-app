'use client'

import { useState } from 'react'
import {
  AuthError,
  AuthField,
  AuthInput,
  AuthPrimaryButton,
  AuthSecondaryLink,
  AuthShell,
  AuthSuccess,
} from '@/components/auth/AuthShell'
import { requestPasswordReset } from '@/lib/auth/authService'
import { Colors } from '@/lib/colors'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await requestPasswordReset(email.trim())
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to send reset email')
      return
    }
    setSent(true)
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a link to choose a new password."
    >
      <AuthError message={error} />
      {sent ? (
        <>
          <AuthSuccess message="If an account exists for that email, a reset link is on the way." />
          <p className="text-sm text-center" style={{ color: Colors.textSecondary }}>
            <AuthSecondaryLink href="/auth/sign-in">Back to sign in</AuthSecondaryLink>
          </p>
        </>
      ) : (
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
          <AuthPrimaryButton loading={loading}>Send reset link</AuthPrimaryButton>
          <p className="mt-6 text-sm text-center" style={{ color: Colors.textSecondary }}>
            <AuthSecondaryLink href="/auth/sign-in">Back to sign in</AuthSecondaryLink>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
