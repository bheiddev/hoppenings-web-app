import type { ReactNode } from 'react'
import Link from 'next/link'
import { Colors } from '@/lib/colors'

type PoshPageShellProps = {
  children: ReactNode
  /** When true, pull the page under the sticky faded header. */
  accountForNav?: boolean
  className?: string
}

/** Shared maroon atmosphere used by region landings and detail screens. */
export function PoshPageShell({
  children,
  accountForNav = true,
  className = '',
}: PoshPageShellProps) {
  const heightClass = accountForNav ? 'min-h-screen -mt-16' : 'min-h-screen'

  return (
    <div
      className={`relative ${heightClass} overflow-x-hidden`}
      style={{ backgroundColor: Colors.primaryDark }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 15% 20%, rgba(248, 199, 1, 0.14) 0%, transparent 55%),
              radial-gradient(ellipse 70% 60% at 90% 75%, rgba(93, 37, 37, 0.85) 0%, transparent 50%),
              linear-gradient(165deg, ${Colors.primaryDark} 0%, ${Colors.primary} 42%, ${Colors.surfaceDark} 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          className="absolute -left-1/4 top-1/3 h-[50vh] w-[70vw] rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${Colors.accent}33 0%, transparent 70%)` }}
        />
      </div>

      <div className={`relative z-[1] ${className}`}>{children}</div>
    </div>
  )
}

export function PoshEyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
      style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
    >
      {children}
    </p>
  )
}

export function PoshSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="mb-6 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
      style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
    >
      {children}
    </h2>
  )
}

export function PoshCta({
  href,
  children,
  external = false,
}: {
  href: string
  children: ReactNode
  external?: boolean
}) {
  const className =
    'inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-85'
  const style = {
    color: Colors.primaryDark,
    backgroundColor: Colors.accent,
    fontFamily: 'var(--font-fjalla-one)',
    padding: '0.7rem 1.15rem',
  } as const

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  )
}
