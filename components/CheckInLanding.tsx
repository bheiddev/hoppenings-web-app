'use client'

import { useEffect, useState } from 'react'

const IOS_URL = 'https://apps.apple.com/app/id6749239343'
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.breweryevents.app'
const OPEN_APP_FALLBACK_MS = 1600

function isMobileUa(): { ios: boolean; android: boolean } {
  if (typeof navigator === 'undefined') return { ios: false, android: false }
  const ua = navigator.userAgent || ''
  return {
    ios: /iphone|ipad|ipod/i.test(ua),
    android: /android/i.test(ua),
  }
}

export function CheckInLanding({
  breweryId,
  token,
  noRedirect,
}: {
  breweryId: string
  token: string
  noRedirect: boolean
}) {
  const isCheckIn = Boolean(breweryId.trim() && token.trim())
  const [status, setStatus] = useState(
    isCheckIn
      ? 'Opening Hoppenings to log your brewery visit…'
      : 'The best times start with a tap. Get the app:'
  )
  const [note, setNote] = useState(
    isCheckIn
      ? 'Don’t have the app? Download below, then scan again.'
      : 'On mobile you’ll be sent to the right store automatically'
  )

  useEffect(() => {
    if (noRedirect) return

    const { ios, android } = isMobileUa()
    if (!ios && !android) return

    if (!isCheckIn) {
      window.location.replace(android ? ANDROID_URL : IOS_URL)
      return
    }

    const scheme =
      `hoppenings://checkin/${encodeURIComponent(breweryId.trim())}` +
      `?t=${encodeURIComponent(token.trim())}`

    const timer = window.setTimeout(() => {
      setStatus('Don’t have the app? Download below, then scan again.')
      setNote('QR opens the app when installed. Otherwise you’ll go to the store.')
      window.location.replace(android ? ANDROID_URL : IOS_URL)
    }, OPEN_APP_FALLBACK_MS)

    const clear = () => window.clearTimeout(timer)
    window.addEventListener('pagehide', clear)
    window.addEventListener('blur', clear)

    // Custom-scheme fallback when verified https Universal/App Links aren’t live yet.
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = scheme
    document.documentElement.appendChild(iframe)
    window.setTimeout(() => {
      try {
        document.documentElement.removeChild(iframe)
      } catch {
        /* ignore */
      }
    }, 500)

    window.location.href = scheme

    return () => {
      clear()
      window.removeEventListener('pagehide', clear)
      window.removeEventListener('blur', clear)
    }
  }, [breweryId, token, isCheckIn, noRedirect])

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-10"
      style={{
        background:
          'radial-gradient(120% 120% at 0% 0%, #5F2627 0%, #7c3a2f 40%, #FF9B01 100%)',
        color: '#fff',
      }}
    >
      <main
        className="w-full max-w-lg rounded-[20px] px-7 py-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
        style={{
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <h1
          className="mb-2 text-3xl font-bold tracking-wide uppercase sm:text-4xl"
          style={{ fontFamily: 'var(--font-fjalla-one)' }}
        >
          Hoppenings
        </h1>
        <p
          className="mb-5 text-base leading-relaxed opacity-95"
          style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          {status}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={IOS_URL}
            aria-label="Download on the App Store"
            className="inline-flex items-center rounded-[14px] border border-white/15 bg-black px-4 py-3 text-sm font-semibold text-white no-underline"
            style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            App Store
          </a>
          <a
            href={ANDROID_URL}
            aria-label="Get it on Google Play"
            className="inline-flex items-center rounded-[14px] border border-white/15 bg-black px-4 py-3 text-sm font-semibold text-white no-underline"
            style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            Google Play
          </a>
        </div>
        <p
          className="mt-3.5 text-xs opacity-80"
          style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          {note}
        </p>
      </main>
    </div>
  )
}
