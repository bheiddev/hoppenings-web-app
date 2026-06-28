'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Colors } from '@/lib/colors'

export default function Navigation() {
  const pathname = usePathname()

  if (pathname === '/collab-fest-ad') {
    return null
  }

  return (
    <nav style={{ backgroundColor: Colors.surfaceMedium, borderBottom: `2px solid ${Colors.divider}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
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
              className="text-3xl font-bold"
              style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
            >
              Hoppenings
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

