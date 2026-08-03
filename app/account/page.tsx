'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthShell, AuthPrimaryButton } from '@/components/auth/AuthShell'
import { useAuth } from '@/components/auth/AuthProvider'
import { Colors } from '@/lib/colors'

export default function AccountPage() {
  const router = useRouter()
  const { user, profile, isLoading, isAuthenticated, signOut } = useAuth()

  if (isLoading) {
    return (
      <AuthShell title="Account" subtitle="Loading…">
        <p className="text-sm" style={{ color: Colors.textSecondary }}>
          Checking your session…
        </p>
      </AuthShell>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthShell title="Account" subtitle="Sign in to view your Hoppenings account.">
        <Link href="/auth/sign-in" className="btn-primary w-full py-3 text-center">
          Sign in
        </Link>
      </AuthShell>
    )
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/auth/sign-in')
  }

  return (
    <AuthShell title="Account" subtitle="Your Hoppenings account works on web and mobile.">
      <dl className="space-y-3 mb-6 text-sm">
        <div>
          <dt className="font-medium" style={{ color: Colors.textSecondary }}>
            Display name
          </dt>
          <dd style={{ color: Colors.textDark }}>{profile?.display_name ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium" style={{ color: Colors.textSecondary }}>
            Email
          </dt>
          <dd style={{ color: Colors.textDark }}>{user.email ?? profile?.email ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium" style={{ color: Colors.textSecondary }}>
            Provider
          </dt>
          <dd style={{ color: Colors.textDark }}>{profile?.provider ?? '—'}</dd>
        </div>
      </dl>

      <AuthPrimaryButton type="button" onClick={handleSignOut}>
        Sign out
      </AuthPrimaryButton>
    </AuthShell>
  )
}
