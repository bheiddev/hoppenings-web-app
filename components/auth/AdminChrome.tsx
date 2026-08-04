'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Colors } from '@/lib/colors'

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profile, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.replace('/auth/sign-in')
  }

  return (
    <>
      <div
        className="border-b px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: Colors.surface, borderColor: Colors.dividerLight }}
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 py-2 text-sm">
          <p style={{ color: Colors.textSecondary }}>
            Content Admin
            {profile?.display_name ? ` · ${profile.display_name}` : ''}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="underline" style={{ color: Colors.primaryDark }}>
              Profile
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="underline"
              style={{ color: Colors.primaryDark }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
      {children}
    </>
  )
}
