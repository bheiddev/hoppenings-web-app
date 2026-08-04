'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AuthError,
  AuthField,
  AuthInput,
  AuthPrimaryButton,
  AuthShell,
} from '@/components/auth/AuthShell'
import { useAuth } from '@/components/auth/AuthProvider'
import { updateProfile } from '@/lib/auth/profileService'
import { getPostAuthPath } from '@/lib/auth/postAuthRedirect'
import { validateDisplayName } from '@/lib/auth/displayNameValidation'

export default function DisplayNamePage() {
  const router = useRouter()
  const { user, profile, isLoading, isAuthenticated, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const trimmed = displayName.trim()
    if (!trimmed) {
      setError('Please enter a display name')
      return
    }

    const nameCheck = validateDisplayName(trimmed)
    if (!nameCheck.allowed) {
      setError(nameCheck.error ?? 'This display name is not allowed')
      return
    }

    setLoading(true)
    setError(null)
    const result = await updateProfile(user.id, { display_name: trimmed })
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Could not save display name')
      return
    }

    await refreshProfile()
    router.replace(getPostAuthPath(profile?.admin ? { ...profile, display_name: trimmed } : profile))
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <AuthShell title="Choose your display name" subtitle="Sign in first to continue.">
        <AuthError message="You need to be signed in to set a display name." />
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Choose your display name"
      subtitle="This is how other people will see you on Hoppenings. You can change it later in your profile."
    >
      <AuthError message={error} />
      <form onSubmit={handleSubmit}>
        <AuthField label="Display name *">
          <AuthInput
            type="text"
            autoComplete="nickname"
            required
            maxLength={50}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              if (error) setError(null)
            }}
            disabled={loading || isLoading}
            placeholder="Enter your display name"
          />
        </AuthField>
        <AuthPrimaryButton loading={loading || isLoading}>Continue</AuthPrimaryButton>
      </form>
    </AuthShell>
  )
}
