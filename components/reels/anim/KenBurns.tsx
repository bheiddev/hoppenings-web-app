'use client'

import { Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { useState } from 'react'

type KenBurnsProps = {
  src: string
  fallbackSrc?: string | null
  from?: number
  to?: number
  style?: React.CSSProperties
  imgStyle?: React.CSSProperties
}

export function KenBurns({
  src,
  fallbackSrc,
  from = 1,
  to = 1.08,
  style,
  imgStyle,
}: KenBurnsProps) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const [failedPrimary, setFailedPrimary] = useState(false)
  const [failedFallback, setFailedFallback] = useState(false)

  const scale = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const url = !failedPrimary ? src : fallbackSrc && !failedFallback ? fallbackSrc : null
  if (!url) {
    return <div style={{ width: '100%', height: '100%', background: '#5D2525', ...style }} />
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <Img
        src={url}
        onError={() => {
          if (!failedPrimary) setFailedPrimary(true)
          else setFailedFallback(true)
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          ...imgStyle,
        }}
      />
    </div>
  )
}
