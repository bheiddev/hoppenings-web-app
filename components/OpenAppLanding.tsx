'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { PoshCta, PoshEyebrow, PoshPageShell } from '@/components/PoshPageShell'
import { Colors } from '@/lib/colors'

const IOS_URL = 'https://apps.apple.com/us/app/hoppenings/id6749239343'
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.breweryevents.app'
const APP_SCHEME_URL = 'hoppenings://perks'
const OPEN_APP_FALLBACK_MS = 1600

function isMobileUa(): { ios: boolean; android: boolean } {
  if (typeof navigator === 'undefined') return { ios: false, android: false }
  const ua = navigator.userAgent || ''
  return {
    ios: /iphone|ipad|ipod/i.test(ua),
    android: /android/i.test(ua),
  }
}

export function OpenAppLanding({
  noRedirect = false,
  eyebrow = 'Hoppenings',
  title = 'Perks',
  lead = 'Opening Hoppenings to your perks…',
  note = 'Don’t have the app? Download below, then scan again.',
}: {
  noRedirect?: boolean
  eyebrow?: string
  title?: string
  lead?: string
  note?: string
}) {
  const [status, setStatus] = useState(lead)
  const [footerNote, setFooterNote] = useState(note)

  useEffect(() => {
    if (noRedirect) return

    const { ios, android } = isMobileUa()
    if (!ios && !android) return

    const timer = window.setTimeout(() => {
      setStatus('Don’t have the app? Download below.')
      setFooterNote('You’ll land on Perks after you install and open Hoppenings from this QR again.')
      window.location.replace(android ? ANDROID_URL : IOS_URL)
    }, OPEN_APP_FALLBACK_MS)

    const clear = () => window.clearTimeout(timer)
    window.addEventListener('pagehide', clear)
    window.addEventListener('blur', clear)

    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = APP_SCHEME_URL
    document.documentElement.appendChild(iframe)
    window.setTimeout(() => {
      try {
        document.documentElement.removeChild(iframe)
      } catch {
        /* ignore */
      }
    }, 500)

    window.location.href = APP_SCHEME_URL

    return () => {
      clear()
      window.removeEventListener('pagehide', clear)
      window.removeEventListener('blur', clear)
    }
  }, [noRedirect])

  return (
    <PoshPageShell accountForNav={false}>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-12">
        <div className="hop-home-fade mb-8 flex items-center gap-3">
          <span className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
            <Image
              src="/HoppeningsLogo2White.png"
              alt=""
              fill
              className="object-contain"
              sizes="56px"
              priority
            />
          </span>
          <PoshEyebrow>{eyebrow}</PoshEyebrow>
        </div>

        <h1
          className="hop-home-fade hop-home-delay-1 mb-4 font-bold uppercase leading-[0.95] tracking-wide text-[clamp(2.5rem,10vw,5.5rem)]"
          style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {title}
        </h1>

        <p
          className="hop-home-fade hop-home-delay-2 mb-10 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'rgba(249, 247, 242, 0.78)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          {status}
        </p>

        <div className="hop-home-fade hop-home-delay-3 flex flex-wrap items-center gap-3">
          <PoshCta href={IOS_URL} external>
            App Store
          </PoshCta>
          <PoshCta href={ANDROID_URL} external>
            Google Play
          </PoshCta>
        </div>

        <p
          className="hop-home-fade hop-home-delay-3 mt-6 max-w-md text-sm leading-relaxed"
          style={{ color: 'rgba(249, 247, 242, 0.55)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          {footerNote}
        </p>
      </div>
    </PoshPageShell>
  )
}
