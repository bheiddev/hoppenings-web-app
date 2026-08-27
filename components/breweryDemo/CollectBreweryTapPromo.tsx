'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { PoshCta } from '@/components/PoshPageShell'
import { Colors } from '@/lib/colors'

const APP_STORE_URL = 'https://apps.apple.com/us/app/hoppenings/id6749239343'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.breweryevents.app'

const COLLECT_STEPS = [
  {
    step: '1',
    title: 'Download the Hoppenings App',
    detail: 'Get Hoppenings on the App Store or Google Play.',
  },
  {
    step: '2',
    title: 'Create an Account',
    detail: 'Sign up so your taps and check-ins stay with you.',
  },
  {
    step: '3',
    title: 'Log your Visit',
    detail: 'Check in at the brewery to collect this custom tap.',
  },
] as const

export function CollectBreweryTapPromo({
  tapImageUrl,
  breweryName,
}: {
  tapImageUrl: string
  breweryName: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <section className="mb-14 border-t border-white/10 pt-12">
      <p
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
        style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        Brewery Passport
      </p>
      <h2
        className="mb-4 max-w-2xl text-2xl font-bold uppercase tracking-wide sm:text-4xl"
        style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
      >
        Collect the {breweryName} tap
      </h2>
      <p
        className="mb-8 max-w-xl text-base leading-relaxed"
        style={{ color: 'rgba(249, 247, 242, 0.75)', fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        Check in with Hoppenings to unlock this custom brewery tap for your passport.
      </p>

      <div className="flex items-start gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group w-[110px] shrink-0 transition-opacity hover:opacity-90 sm:w-[140px] md:w-[160px]"
          aria-label={`How to collect the ${breweryName} tap`}
        >
          <span className="relative mx-auto block aspect-[2/3] w-full">
            <Image
              src={tapImageUrl}
              alt={`${breweryName} collectible tap`}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 110px, 160px"
              unoptimized
            />
          </span>
          <span
            className="mt-2 block text-center text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]"
            style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            How to collect
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <ul className="flex flex-col">
            {COLLECT_STEPS.map((item) => (
              <li key={item.step} className="flex gap-3 border-t border-white/10 py-3 sm:gap-4 sm:py-4">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center text-xs font-bold sm:h-8 sm:w-8 sm:text-sm"
                  style={{
                    color: Colors.primaryDark,
                    backgroundColor: Colors.accent,
                    fontFamily: 'var(--font-fjalla-one)',
                  }}
                >
                  {item.step}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span
                    className="block text-sm font-bold uppercase tracking-wide sm:text-base"
                    style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                  >
                    {item.title}
                  </span>
                  <span
                    className="mt-1 block text-xs sm:text-sm"
                    style={{
                      color: 'rgba(249, 247, 242, 0.65)',
                      fontFamily: 'var(--font-be-vietnam-pro)',
                    }}
                  >
                    {item.detail}
                  </span>
                </span>
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
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`How to collect the ${breweryName} tap`}
        >
          <button
            type="button"
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(20, 8, 8, 0.88)' }}
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative z-[1] w-full max-w-md overflow-hidden border border-white/10 p-6 sm:p-8"
            style={{
              background: `
                radial-gradient(ellipse 90% 70% at 15% 0%, rgba(248, 199, 1, 0.12) 0%, transparent 55%),
                linear-gradient(165deg, ${Colors.primaryDark} 0%, ${Colors.primary} 55%, ${Colors.surfaceDark} 100%)
              `,
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-lg font-bold transition-opacity hover:opacity-85 sm:right-4 sm:top-4"
              style={{
                color: Colors.primaryDark,
                backgroundColor: Colors.accent,
                fontFamily: 'var(--font-fjalla-one)',
              }}
              aria-label="Close"
            >
              ×
            </button>

            <div className="mb-6 flex items-center gap-4">
              <span className="relative h-24 w-16 shrink-0 sm:h-28 sm:w-20">
                <Image
                  src={tapImageUrl}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="80px"
                  unoptimized
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <p
                  className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em]"
                  style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
                >
                  Brewery Passport
                </p>
                <h3
                  className="text-2xl font-bold uppercase tracking-wide sm:text-3xl"
                  style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  Collect {breweryName} Tap
                </h3>
              </div>
            </div>

            <ol className="mb-8 flex flex-col">
              {COLLECT_STEPS.map((item) => (
                <li key={item.step} className="flex gap-4 border-t border-white/10 py-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold"
                    style={{
                      color: Colors.primaryDark,
                      backgroundColor: Colors.accent,
                      fontFamily: 'var(--font-fjalla-one)',
                    }}
                  >
                    {item.step}
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span
                      className="block text-base font-bold uppercase tracking-wide"
                      style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="mt-1 block text-sm leading-snug"
                      style={{
                        color: 'rgba(249, 247, 242, 0.7)',
                        fontFamily: 'var(--font-be-vietnam-pro)',
                      }}
                    >
                      {item.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-3">
              <PoshCta href={APP_STORE_URL} external>
                App Store
              </PoshCta>
              <PoshCta href={PLAY_STORE_URL} external>
                Google Play
              </PoshCta>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
