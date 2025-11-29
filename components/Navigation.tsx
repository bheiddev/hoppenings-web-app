'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Colors } from '@/lib/colors'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/events', label: 'EVENTS' },
    { href: '/releases', label: 'RELEASES' },
    { href: '/breweries', label: 'BREWERIES' },
  ]

  return (
    <nav className="sticky top-0 z-40" style={{ backgroundColor: Colors.backgroundMedium, borderBottom: `2px solid ${Colors.divider}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-3xl font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
            Hoppenings
          </Link>
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-lg font-semibold transition-colors ${
                  pathname === item.href
                    ? 'border-b-2'
                    : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  color: Colors.textPrimary,
                  borderBottomColor: pathname === item.href ? Colors.primary : 'transparent',
                  fontFamily: 'var(--font-fjalla-one)',
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

