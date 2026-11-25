'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { continueRender, delayRender } from 'remotion'

/** Block Remotion capture until Display/Body fonts are ready (avoids fallback glyphs in MP4). */
export function WaitForFonts({ children }: { children: ReactNode }) {
  const [handle] = useState(() =>
    delayRender('Loading Display/Body fonts', { timeoutInMilliseconds: 15000 })
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (typeof document !== 'undefined' && document.fonts?.load) {
          await Promise.all([
            document.fonts.load('400 48px Display'),
            document.fonts.load('400 24px Body'),
            document.fonts.load('600 24px Body'),
            document.fonts.load('700 24px Body'),
          ])
          await document.fonts.ready
        }
      } catch {
        // Continue with fallbacks rather than hanging the render.
      } finally {
        if (!cancelled) continueRender(handle)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [handle])

  return <>{children}</>
}
