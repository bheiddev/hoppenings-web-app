'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Colors } from '@/lib/colors'

export default function Navigation() {
  const pathname = usePathname()

  if (pathname === '/collab-fest-ad') {
    return null
  }

  return (
    <nav style={{ backgroundColor: Colors.backgroundMedium, borderBottom: `2px solid ${Colors.divider}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link href="/" className="text-3xl font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
            Hoppenings
          </Link>
        </div>
      </div>
    </nav>
  )
}

