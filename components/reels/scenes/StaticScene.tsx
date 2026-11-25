'use client'

import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { useState } from 'react'
import { FONT_BODY, SAFE } from '../brand'
import type { ReelBrand } from '../types'

export function StaticScene({
  url,
  brand,
}: {
  url: string | null
  brand: ReelBrand
}) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const [failed, setFailed] = useState(false)
  const colors = brand.colors

  const scale = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [1, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ backgroundColor: colors.primary_dark }}>
      <div
        style={{
          position: 'absolute',
          left: SAFE.left,
          width: SAFE.right - SAFE.left,
          top: SAFE.top,
          height: 1350,
          overflow: 'hidden',
          borderRadius: 8,
          opacity: fadeIn,
          backgroundColor: colors.primary,
        }}
      >
        {url && !failed ? (
          <Img
            src={url}
            onError={() => setFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.cream,
              fontFamily: FONT_BODY,
              fontWeight: 600,
              fontSize: 36,
            }}
          >
            Hoppenings
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}
