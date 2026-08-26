import type { ReactNode } from 'react'
import Link from 'next/link'
import { Colors } from '@/lib/colors'
import {
  PoshBreweryCarousel,
  PoshBreweryCarouselMobile,
  type PoshBreweryImage,
} from '@/components/PoshBreweryCarousel'

export type PoshLandingLink = {
  label: string
  href: string
}

type PoshLandingProps = {
  eyebrow?: string
  title: ReactNode
  subtitle: string
  links: PoshLandingLink[]
  linksAriaLabel: string
  /** When true, pull under the sticky faded header. */
  accountForNav?: boolean
  /** Optional brewery photos for a right-side visual (region landings). */
  breweryImages?: PoshBreweryImage[]
  children?: ReactNode
}

export function PoshLanding({
  eyebrow,
  title,
  subtitle,
  links,
  linksAriaLabel,
  accountForNav = false,
  breweryImages = [],
  children,
}: PoshLandingProps) {
  const heightClass = accountForNav ? 'min-h-screen -mt-16' : 'min-h-screen'
  const hasVisual = breweryImages.length > 0

  return (
    <div
      className={`relative ${heightClass} overflow-hidden`}
      style={{ backgroundColor: Colors.primaryDark }}
    >
      {children}

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

      <div
        className={`relative z-[1] mx-auto grid ${heightClass} max-w-7xl ${
          hasVisual ? 'lg:grid-cols-[minmax(0,1fr)_minmax(280px,42%)]' : ''
        }`}
      >
        <div
          className={`flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-12 ${
            hasVisual ? 'lg:pr-8' : ''
          }`}
        >
          {eyebrow ? (
            <p
              className="hop-home-fade text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] mb-5"
              style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              {eyebrow}
            </p>
          ) : null}

          <h1
            className="hop-home-fade hop-home-delay-1 mb-6"
            style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            {title}
          </h1>

          <p
            className="hop-home-fade hop-home-delay-2 max-w-md text-base sm:text-lg leading-relaxed mb-10 sm:mb-12"
            style={{ color: 'rgba(249, 247, 242, 0.78)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            {subtitle}
          </p>

          {hasVisual ? <PoshBreweryCarouselMobile images={breweryImages} /> : null}

          <nav
            className="hop-home-fade hop-home-delay-3 flex flex-col items-start gap-1 sm:gap-2"
            aria-label={linksAriaLabel}
          >
            {links.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="hop-home-region relative inline-flex items-baseline gap-4 py-2"
                style={{
                  animationDelay: `${0.35 + index * 0.08}s`,
                  opacity: 0.92,
                }}
              >
                <span
                  className="text-[10px] sm:text-xs font-medium tabular-nums tracking-[0.2em]"
                  style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className="hop-home-region-label text-2xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-fjalla-one)' }}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {hasVisual ? (
          <div className="hop-home-fade hop-home-delay-2 relative hidden min-h-[min(70vh,640px)] lg:block">
            <PoshBreweryCarousel images={breweryImages} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
