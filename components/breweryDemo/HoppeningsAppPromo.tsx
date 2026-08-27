'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { PoshCta } from '@/components/PoshPageShell'
import { Colors } from '@/lib/colors'

const BENEFITS = [
  { title: 'Collect Custom Brewery Taps', detail: 'Check in and collect stamps as you explore.' },
  { title: 'New Beer Releases', detail: 'Know what’s pouring before you walk in.' },
  { title: 'Tonight’s Hoppenings', detail: 'Events, food trucks, and live music near you.' },
]

const PHONE_SRC = '/HoppeningsIphoneBent.png'
const APP_STORE_URL = 'https://apps.apple.com/us/app/hoppenings/id6749239343'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.breweryevents.app'

export function HoppeningsAppPromo({ region }: { region: string }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded])

  return (
    <section className="mb-10 border-t border-white/10 pt-12">
      <p
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
        style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        Get the app
      </p>
      <h2
        className="mb-4 max-w-2xl text-2xl font-bold uppercase tracking-wide sm:text-4xl"
        style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
      >
        Everything Hoppening across {region} in your pocket
      </h2>
      <p
        className="mb-10 max-w-xl text-base leading-relaxed"
        style={{ color: 'rgba(249, 247, 242, 0.75)', fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        Download Hoppenings for taproom events, beer releases, and what’s on tonight — powered by the
        same data you see here.
      </p>

      <div className="flex items-stretch gap-5 sm:gap-7 md:gap-8">
        <div className="flex w-full max-w-[11.5rem] shrink-0 flex-col sm:max-w-[13rem] md:max-w-[15rem]">
          <ul className="flex flex-col">
            {BENEFITS.map((item) => (
              <li key={item.title} className="border-t border-white/10 py-3 sm:py-4">
                <p
                  className="text-sm font-bold uppercase tracking-wide sm:text-base"
                  style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  {item.title}
                </p>
                <p
                  className="mt-1 text-xs sm:text-sm"
                  style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
                >
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <PoshCta href={APP_STORE_URL} external>
              App Store
            </PoshCta>
            <PoshCta href={PLAY_STORE_URL} external>
              Google Play
            </PoshCta>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-[169px] shrink-0 cursor-zoom-in self-stretch transition-opacity hover:opacity-90 sm:w-[221px] md:w-[273px] lg:w-[312px]"
          aria-label="Expand Hoppenings app preview"
        >
          <Image
            src={PHONE_SRC}
            alt="Hoppenings app on iPhone"
            width={1857}
            height={3096}
            className="h-full w-full object-contain object-top"
            sizes="(max-width: 640px) 169px, (max-width: 768px) 221px, 312px"
            priority={false}
          />
        </button>
      </div>

      {expanded ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="Hoppenings app preview"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-zoom-out"
            style={{ backgroundColor: 'rgba(20, 8, 8, 0.88)' }}
            aria-label="Close preview"
            onClick={() => setExpanded(false)}
          />
          <div className="relative z-[1] max-h-[90vh] w-full max-w-[min(420px,82vw)]">
            <Image
              src={PHONE_SRC}
              alt="Hoppenings app on iPhone"
              width={1857}
              height={3096}
              className="h-auto max-h-[90vh] w-full object-contain"
              sizes="420px"
              priority
            />
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center text-lg font-bold transition-opacity hover:opacity-85 sm:-right-3 sm:-top-3"
              style={{
                color: Colors.primaryDark,
                backgroundColor: Colors.accent,
                fontFamily: 'var(--font-fjalla-one)',
              }}
              aria-label="Close preview"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
