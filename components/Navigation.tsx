'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { useAuth } from '@/components/auth/AuthProvider'

export default function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, profile, isLoading } = useAuth()

  // Landing-style brewery pages and ad spots own the full viewport
  if (pathname === '/collab-fest-ad' || /^\/breweries\/[^/]+/.test(pathname)) {
    return null
  }

  return (
    <nav style={{ backgroundColor: Colors.backgroundDark }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-0">
            <span className="relative h-10 w-10 shrink-0">
              <Image
                src="/4ce85581-ee3d-4931-9ef5-236d7d74b1a5.png"
                alt=""
                fill
                className="object-contain"
                sizes="40px"
                priority
                aria-hidden
              />
            </span>
            <span
              className="text-3xl font-bold tracking-wide uppercase"
              style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
            >
              Hoppenings
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {!isLoading &&
              (isAuthenticated ? (
                <>
                  {profile?.admin ? (
                    <Link
                      href="/admin"
                      className="text-sm font-medium px-3 py-1.5 rounded border transition-opacity hover:opacity-90"
                      style={{
                        color: Colors.textOnDark,
                        borderColor: 'rgba(255,255,255,0.35)',
                        fontFamily: 'var(--font-be-vietnam-pro)',
                      }}
                    >
                      Admin
                    </Link>
                  ) : null}
                  <Link
                    href="/profile"
                    className="text-sm font-medium px-3 py-1.5 rounded border transition-opacity hover:opacity-90"
                    style={{
                      color: Colors.textOnDark,
                      borderColor: 'rgba(255,255,255,0.35)',
                      fontFamily: 'var(--font-be-vietnam-pro)',
                    }}
                  >
                    {profile?.display_name?.trim() || 'Profile'}
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="text-sm font-semibold px-3 py-1.5 rounded transition-opacity hover:opacity-90"
                  style={{
                    color: Colors.backgroundDark,
                    backgroundColor: Colors.accent,
                    fontFamily: 'var(--font-fjalla-one)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Sign in
                </Link>
              ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
