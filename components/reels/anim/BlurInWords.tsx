'use client'

import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import type { CSSProperties } from 'react'

type BlurInWordsProps = {
  text: string
  startFrame?: number
  stagger?: number
  duration?: number
  style?: CSSProperties
  align?: 'left' | 'center' | 'right'
  /** When true, animate the whole line as one unit (no per-word stagger). */
  wholeLine?: boolean
}

export function BlurInWords({
  text,
  startFrame = 0,
  stagger = 5,
  duration = 14,
  style,
  align = 'left',
  wholeLine = false,
}: BlurInWordsProps) {
  const frame = useCurrentFrame()
  const words = text.trim().split(/\s+/).filter(Boolean)

  if (wholeLine || words.length <= 1) {
    const t = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
    const eased = 1 - Math.pow(1 - t, 3)
    return (
      <div
        style={{
          ...style,
          textAlign: align,
          opacity: eased,
          transform: `translateY(${(1 - eased) * 24}px)`,
          filter: `blur(${(1 - eased) * 12}px)`,
        }}
      >
        {text}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent:
          align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        columnGap: '0.28em',
        rowGap: '0.12em',
        ...style,
        textAlign: align,
      }}
    >
      {words.map((word, i) => {
        const localStart = startFrame + i * stagger
        const t = interpolate(frame, [localStart, localStart + duration], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const eased = 1 - Math.pow(1 - t, 3)
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: 'inline-block',
              opacity: eased,
              transform: `translateY(${(1 - eased) * 24}px)`,
              filter: `blur(${(1 - eased) * 12}px)`,
            }}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}

/** Full-bleed wrapper for AbsoluteFill scenes that need BlurInWords only. */
export function BlurInLine(props: BlurInWordsProps) {
  return (
    <AbsoluteFill style={{ justifyContent: 'center' }}>
      <BlurInWords {...props} />
    </AbsoluteFill>
  )
}
