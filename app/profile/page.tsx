'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthShell, AuthPrimaryButton } from '@/components/auth/AuthShell'
import { useAuth } from '@/components/auth/AuthProvider'
import { Colors } from '@/lib/colors'
import type { Profile } from '@/types/supabase'

function formatValue(value: string | boolean | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return value
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

const PROFILE_FIELDS: {
  key: keyof Profile
  label: string
  format?: (profile: Profile) => string
}[] = [
  { key: 'id', label: 'ID' },
  { key: 'display_name', label: 'Display name' },
  { key: 'email', label: 'Email' },
  { key: 'provider', label: 'Provider' },
  { key: 'provider_id', label: 'Provider ID' },
  { key: 'staff_brewery_id', label: 'Staff brewery ID' },
  {
    key: 'admin',
    label: 'Admin',
    format: (p) => formatValue(Boolean(p.admin)),
  },
  {
    key: 'created_at',
    label: 'Created',
    format: (p) => formatTimestamp(p.created_at),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    format: (p) => formatTimestamp(p.updated_at),
  },
  { key: 'avatar_url', label: 'Avatar URL' },
]

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, isLoading, isAuthenticated, signOut } = useAuth()

  if (isLoading) {
    return (
      <AuthShell title="Profile" subtitle="Loading…">
        <p className="text-sm" style={{ color: Colors.textSecondary }}>
          Checking your session…
        </p>
      </AuthShell>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthShell title="Profile" subtitle="Sign in to view your Hoppenings profile.">
        <Link href="/auth/sign-in?next=%2Fprofile" className="btn-primary w-full py-3 text-center">
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
    <AuthShell title="Profile" subtitle="Your Hoppenings profile (view only).">
      {profile?.avatar_url ? (
        <div className="mb-6 flex justify-center">
          <span
            className="relative h-20 w-20 overflow-hidden rounded-full border"
            style={{ borderColor: Colors.dividerLight }}
          >
            <Image
              src={profile.avatar_url}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          </span>
        </div>
      ) : null}

      <dl className="space-y-3 mb-6 text-sm">
        {PROFILE_FIELDS.map(({ key, label, format }) => (
          <div key={key}>
            <dt className="font-medium" style={{ color: Colors.textSecondary }}>
              {label}
            </dt>
            <dd className="break-all" style={{ color: Colors.textDark }}>
              {profile
                ? format
                  ? format(profile)
                  : formatValue(profile[key] as string | boolean | null)
                : '—'}
            </dd>
          </div>
        ))}
      </dl>

      {profile?.admin ? (
        <Link href="/admin" className="btn-primary w-full py-3 text-center mb-3 block">
          Open Content Admin
        </Link>
      ) : null}

      <AuthPrimaryButton type="button" onClick={handleSignOut}>
        Sign out
      </AuthPrimaryButton>
    </AuthShell>
  )
}
