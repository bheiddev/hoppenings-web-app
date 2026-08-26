'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { useAuth } from '@/components/auth/AuthProvider'

export default function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, profile, isLoading } = useAuth()

  // Landing-style brewery pages, ad spots, and the region-picker home own the full viewport
  if (
    pathname === '/' ||
    pathname === '/collab-fest-ad' ||
    /^\/breweries\/[^/]+/.test(pathname)
  ) {
    return null
  }

  return (
    <>
      <nav className="hop-site-nav sticky top-0 z-50">
        <div className="hop-site-nav-atmosphere" aria-hidden />
        <div className="relative z-[1] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-0">
              <span className="relative h-10 w-10 shrink-0">
                <Image
                  src="/HoppeningsLogo2White.png"
                  alt=""
                  fill
                  className="object-contain"
                  sizes="40px"
                  priority
                  aria-hidden
                />
              </span>
              <span
                className="text-3xl font-bold uppercase tracking-wide"
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
                        className="rounded border px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
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
                      className="rounded border px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
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
                    className="rounded px-3 py-1.5 text-sm font-semibold uppercase transition-opacity hover:opacity-90"
                    style={{
                      color: Colors.primaryDark,
                      backgroundColor: Colors.accent,
                      fontFamily: 'var(--font-fjalla-one)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Sign in
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
