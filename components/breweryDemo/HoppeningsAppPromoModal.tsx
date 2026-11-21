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
const OPEN_DELAY_MS = 15_000
const DISMISS_KEY = 'hoppeningsAppPromoModalDismissed'

export function HoppeningsAppPromoModal({ region }: { region: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return
    } catch {
      // Ignore storage access errors and still schedule the modal.
    }

    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  function dismiss() {
    setOpen(false)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore storage write failures.
    }
  }

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        try {
          sessionStorage.setItem(DISMISS_KEY, '1')
        } catch {
          // Ignore storage write failures.
        }
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hoppenings-app-promo-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer"
        style={{ backgroundColor: 'rgba(20, 8, 8, 0.88)' }}
        aria-label="Close app promotion"
        onClick={dismiss}
      />

      <div
        className="relative z-[1] max-h-[min(92vh,880px)] w-full max-w-3xl overflow-y-auto border border-white/10"
        style={{ backgroundColor: Colors.primaryDark }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 12% 10%, rgba(248, 199, 1, 0.14) 0%, transparent 55%),
              radial-gradient(ellipse 70% 55% at 90% 90%, rgba(93, 37, 37, 0.55) 0%, transparent 50%)
            `,
          }}
        />

        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-[2] flex h-9 w-9 items-center justify-center text-lg font-bold transition-opacity hover:opacity-85"
          style={{
            color: Colors.primaryDark,
            backgroundColor: Colors.accent,
            fontFamily: 'var(--font-fjalla-one)',
          }}
          aria-label="Close"
        >
          ×
        </button>

        <div className="relative z-[1] grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)] sm:gap-8 sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(11rem,14rem)]">
          <div className="min-w-0">
            <p
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
              style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              Get the app
            </p>
            <h2
              id="hoppenings-app-promo-modal-title"
              className="mb-4 text-2xl font-bold uppercase tracking-wide sm:text-3xl md:text-4xl"
              style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
            >
              Everything Hoppening across {region} in your pocket
            </h2>
            <p
              className="mb-6 max-w-xl text-sm leading-relaxed sm:text-base"
              style={{ color: 'rgba(249, 247, 242, 0.75)', fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              Download Hoppenings for taproom events, beer releases, and what’s on tonight — powered by
              the same data you see here.
            </p>

            <ul className="mb-6 flex flex-col">
              {BENEFITS.map((item) => (
                <li key={item.title} className="border-t border-white/10 py-3">
                  <p
                    className="text-sm font-bold uppercase tracking-wide sm:text-base"
                    style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="mt-1 text-xs sm:text-sm"
                    style={{
                      color: 'rgba(249, 247, 242, 0.65)',
                      fontFamily: 'var(--font-be-vietnam-pro)',
                    }}
                  >
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <PoshCta href={APP_STORE_URL} external>
                App Store
              </PoshCta>
              <PoshCta href={PLAY_STORE_URL} external>
                Google Play
              </PoshCta>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[11rem] items-end justify-center sm:max-w-none sm:self-stretch">
            <Image
              src={PHONE_SRC}
              alt="Hoppenings app on iPhone"
              width={1857}
              height={3096}
              className="h-auto max-h-[42vh] w-full object-contain object-bottom sm:max-h-[min(70vh,560px)]"
              sizes="(max-width: 640px) 176px, 224px"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}
