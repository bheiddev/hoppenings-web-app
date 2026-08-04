'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AuthError,
  AuthField,
  AuthInput,
  AuthPrimaryButton,
  AuthShell,
  AuthSuccess,
} from '@/components/auth/AuthShell'
import { useAuth } from '@/components/auth/AuthProvider'
import { updatePassword } from '@/lib/auth/authService'

const MIN_PASSWORD_LENGTH = 8

export default function SetPasswordPage() {
  const router = useRouter()
  const { clearPasswordRecovery, needsDisplayName, isLoading, isAuthenticated } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const result = await updatePassword(password)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to update password')
      return
    }

    clearPasswordRecovery()
    setSuccess(true)

    setTimeout(() => {
      router.replace(needsDisplayName ? '/auth/display-name' : '/profile')
    }, 800)
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <AuthShell title="Set new password" subtitle="Open the reset link from your email to continue.">
        <AuthError message="Your reset session expired. Request a new password reset email." />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Set new password" subtitle="Choose a new password for your Hoppenings account.">
      <AuthError message={error} />
      <AuthSuccess message={success ? 'Password updated.' : null} />
      <form onSubmit={handleSubmit}>
        <AuthField label="New password (min 8 characters)">
          <AuthInput
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || success}
          />
        </AuthField>
        <AuthField label="Confirm password">
          <AuthInput
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading || success}
          />
        </AuthField>
        <AuthPrimaryButton loading={loading} disabled={success}>
          Update password
        </AuthPrimaryButton>
      </form>
    </AuthShell>
  )
}
