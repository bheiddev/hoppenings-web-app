'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Colors } from '@/lib/colors'

type Status = 'loading' | 'success' | 'error'

function metaErrorFromParams(searchParams: URLSearchParams): string | null {
  // Meta may return ?error=...&error_description=... or ?error_code=...&error_message=...
  const err = searchParams.get('error')
  const errDesc = searchParams.get('error_description')
  const errCode = searchParams.get('error_code')
  const errMsg = searchParams.get('error_message')

  if (err) {
    return errDesc ? decodeURIComponent(errDesc.replace(/\+/g, ' ')) : err
  }
  if (errMsg) {
    try {
      return decodeURIComponent(errMsg.replace(/\+/g, ' '))
    } catch {
      return errMsg
    }
  }
  if (errCode) {
    return `Meta returned error code ${errCode}. Check App Domains and Valid OAuth Redirect URIs in your Meta app settings.`
  }
  return null
}

export default function CallbackClient() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const metaError = metaErrorFromParams(searchParams)

  const [status, setStatus] = useState<Status>(() => {
    if (metaError) return 'error'
    if (!code) return 'error'
    return 'loading'
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (metaError) return metaError
    if (!code) return 'Meta did not return an authorization code. Check App Domains and OAuth redirect settings, then try again.'
    return null
  })

  useEffect(() => {
    async function run() {
      if (metaError) {
        return
      }
      if (!code) {
        setStatus('error')
        setErrorMessage(
          'Meta did not return an authorization code. Check App Domains and OAuth redirect settings, then try again.'
        )
        return
      }

      try {
        setStatus('loading')
        setErrorMessage(null)

        const res = await fetch('/api/instagram/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || `Request failed (${res.status})`)
        }

        setStatus('success')
      } catch (e) {
        setStatus('error')
        setErrorMessage(
          e instanceof Error ? e.message : 'Failed to connect Instagram. Please try again.'
        )
      }
    }

    run()
    // Meta may re-render without changing `code`; we only want to run when it changes.
  }, [code, metaError])

  if (status === 'loading') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div
              className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-solid"
              style={{
                borderColor: Colors.dividerLight,
                borderTopColor: Colors.primary,
                animation: 'spin 1s linear infinite',
              }}
            />
            <div
              className="text-lg font-bold"
              style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
            >
              Connecting your Instagram…
            </div>
            <div
              className="text-sm mt-2"
              style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              This usually takes just a moment.
            </div>
          </div>
          <style jsx>{`
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-4xl mb-4" style={{ color: Colors.primary }} aria-hidden>
              ✓
            </div>
            <div className="text-2xl font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
              You&apos;re connected! Your Instagram posts will now appear on Hoppenings.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-2xl font-bold mb-3" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
            We couldn&apos;t connect your Instagram
          </div>
          <div className="text-sm mb-6" style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
            Please try again.
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/connect-instagram'
            }}
            className="inline-flex items-center justify-center gap-2 px-10 py-3 rounded-full font-semibold text-base transition-colors hover:opacity-90"
            style={{
              backgroundColor: Colors.primary,
              color: Colors.textDark,
              fontFamily: 'var(--font-fjalla-one)',
            }}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

