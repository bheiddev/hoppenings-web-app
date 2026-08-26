'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Colors } from '@/lib/colors'

export type ExploreTeaserItem = {
  id: string
  title: string
  subtitle?: string
  meta?: string
  description?: string
  href: string
  imageUrl?: string | null
}

export type ExploreSection = {
  id: string
  label: string
  href: string
  panelLabel: string
  emptyMessage: string
  items: ExploreTeaserItem[]
}

type RegionExploreLandingProps = {
  cityName: string
  subtitle: string
  sections: ExploreSection[]
  children?: ReactNode
}

const TEASER_LIMIT = 5

export function RegionExploreLanding({
  cityName,
  subtitle,
  sections,
  children,
}: RegionExploreLandingProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  const active = sections.find((section) => section.id === activeId) ?? sections[0]
  const teasers = active?.items.slice(0, TEASER_LIMIT) ?? []

  return (
    <div
      className="relative -mt-16 min-h-screen overflow-hidden"
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

      <div className="relative z-[1] mx-auto grid min-h-screen max-w-7xl pt-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
          <h1
            className="hop-home-fade hop-home-delay-1 mb-5 font-bold uppercase leading-[0.9] tracking-wide text-[clamp(2.5rem,10vw,6.5rem)]"
            style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            {cityName}
          </h1>

          <p
            className="hop-home-fade hop-home-delay-2 mb-10 max-w-md text-base leading-relaxed sm:mb-12 sm:text-lg"
            style={{ color: 'rgba(249, 247, 242, 0.78)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            {subtitle}
          </p>

          <nav
            className="hop-home-fade hop-home-delay-3 flex flex-col items-start gap-1 sm:gap-2"
            aria-label={`Explore ${cityName}`}
          >
            {sections.map((section, index) => {
              const isActive = section.id === active?.id
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveId(section.id)}
                  className="hop-home-region relative inline-flex items-baseline gap-4 py-2 text-left"
                  style={{
                    animationDelay: `${0.35 + index * 0.08}s`,
                    opacity: isActive ? 1 : 0.72,
                  }}
                  aria-pressed={isActive}
                >
                  <span
                    className="text-[10px] font-medium tabular-nums tracking-[0.2em] sm:text-xs"
                    style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="text-2xl font-bold uppercase tracking-wide transition-colors duration-200 sm:text-4xl lg:text-5xl"
                    style={{
                      fontFamily: 'var(--font-fjalla-one)',
                      color: isActive ? Colors.accent : Colors.textOnDark,
                    }}
                  >
                    {section.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex flex-col justify-center px-6 pb-14 pt-2 sm:px-10 lg:px-8 lg:py-16">
          {active ? (
            <div key={active.id} className="hop-explore-panel">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p
                    className="mb-1 text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
                    style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                  >
                    {active.label}
                  </p>
                  <h2
                    className="text-xl font-bold uppercase tracking-wide sm:text-2xl"
                    style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                  >
                    {active.panelLabel}
                  </h2>
                </div>
                <Link
                  href={active.href}
                  className="shrink-0 text-sm font-semibold uppercase tracking-[0.12em] transition-opacity hover:opacity-80"
                  style={{ color: Colors.accent, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  Show All
                </Link>
              </div>

              {teasers.length === 0 ? (
                <p
                  className="text-base leading-relaxed"
                  style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
                >
                  {active.emptyMessage}
                </p>
              ) : (
                <ul className="flex flex-col">
                  {teasers.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="group flex items-start gap-4 border-t border-white/10 py-4 transition-colors hover:border-white/25"
                      >
                        {item.imageUrl ? (
                          <span className="relative mt-0.5 h-20 w-32 shrink-0 overflow-hidden sm:h-24 sm:w-40">
                            <Image
                              src={item.imageUrl}
                              alt=""
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                              sizes="160px"
                            />
                          </span>
                        ) : (
                          <span
                            className="mt-0.5 flex h-20 w-32 shrink-0 items-center justify-center sm:h-24 sm:w-40"
                            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                            aria-hidden
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate text-lg font-bold uppercase tracking-wide sm:text-xl"
                            style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                          >
                            {item.title}
                          </span>
                          {item.subtitle ? (
                            <span
                              className="mt-0.5 block truncate text-sm"
                              style={{
                                color: 'rgba(249, 247, 242, 0.72)',
                                fontFamily: 'var(--font-be-vietnam-pro)',
                              }}
                            >
                              {item.subtitle}
                            </span>
                          ) : null}
                          {item.description ? (
                            <span
                              className="mt-1.5 block text-sm leading-snug line-clamp-2"
                              style={{
                                color: 'rgba(249, 247, 242, 0.62)',
                                fontFamily: 'var(--font-be-vietnam-pro)',
                              }}
                            >
                              {item.description}
                            </span>
                          ) : null}
                          {item.meta ? (
                            <span
                              className="mt-1.5 block text-xs uppercase tracking-[0.14em]"
                              style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                            >
                              {item.meta}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8 border-t border-white/10 pt-6">
                <Link
                  href={active.href}
                  className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-85"
                  style={{
                    color: Colors.primaryDark,
                    backgroundColor: Colors.accent,
                    fontFamily: 'var(--font-fjalla-one)',
                    padding: '0.7rem 1.15rem',
                  }}
                >
                  Show All {active.label}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
