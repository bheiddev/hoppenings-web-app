'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Colors } from '@/lib/colors'
import { PoshSectionTitle } from '@/components/PoshPageShell'

export type BreweryUpcomingEventItem = {
  key: string
  href: string
  title: string
  meta: string
  description?: string
  iconSrc: string
}

const PAGE_SIZE = 4
const ICON_SIZE = 28

function EventIcon({ src }: { src: string }) {
  return (
    <span
      className="mt-0.5 block shrink-0"
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: Colors.accent,
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
      aria-hidden
    />
  )
}

export function BreweryUpcomingEvents({ events }: { events: BreweryUpcomingEventItem[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  if (events.length === 0) return null

  const visible = events.slice(0, visibleCount)
  const hasMore = visibleCount < events.length

  return (
    <section className="mb-14">
      <PoshSectionTitle>Upcoming Events</PoshSectionTitle>
      <ul className="flex flex-col">
        {visible.map((event) => (
          <li key={event.key}>
            <Link
              href={event.href}
              className="flex items-start gap-3 border-t border-white/10 py-4 transition-opacity hover:opacity-85 sm:gap-4"
            >
              <EventIcon src={event.iconSrc} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span
                    className="min-w-0 truncate text-lg font-bold uppercase tracking-wide sm:text-xl"
                    style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                  >
                    {event.title}
                  </span>
                  <span
                    className="shrink-0 text-xs font-bold uppercase tracking-[0.08em] sm:text-sm"
                    style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                  >
                    {event.meta}
                  </span>
                </span>
                {event.description ? (
                  <span
                    className="mt-1.5 text-sm leading-snug"
                    style={{
                      color: 'rgba(249, 247, 242, 0.62)',
                      fontFamily: 'var(--font-be-vietnam-pro)',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical' as const,
                      WebkitLineClamp: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {event.description}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {hasMore ? (
        <div className="mt-6 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, events.length))}
            className="text-sm font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-85"
            style={{
              color: Colors.primaryDark,
              backgroundColor: Colors.accent,
              fontFamily: 'var(--font-fjalla-one)',
              padding: '0.7rem 1.15rem',
            }}
          >
            View More
          </button>
        </div>
      ) : null}
    </section>
  )
}
