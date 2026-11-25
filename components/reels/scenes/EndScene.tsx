'use client'

import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { BlurInWords } from '../anim/BlurInWords'
import { FONT_BODY, FONT_DISPLAY, SAFE } from '../brand'
import type { ReelBrand } from '../types'

type EndSpec = {
  kind: 'end'
  city: string
  cta: string
  handle: string
}

export function EndScene({ spec, brand }: { spec: EndSpec; brand: ReelBrand }) {
  const frame = useCurrentFrame()
  const colors = brand.colors

  const ctaScale = interpolate(frame, [48, 62], [0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const ctaOpacity = interpolate(frame, [48, 62], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const subOpacity = interpolate(frame, [58, 72], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ backgroundColor: colors.cream }}>
      <div
        style={{
          position: 'absolute',
          left: SAFE.left,
          top: 360,
          width: SAFE.right - SAFE.left,
        }}
      >
        <BlurInWords
          text="Every event."
          startFrame={4}
          wholeLine
          style={{
            color: colors.primary_dark,
            fontFamily: FONT_DISPLAY,
            fontSize: 110,
            lineHeight: 1.05,
            textTransform: 'uppercase',
          }}
        />
        <BlurInWords
          text="Every brewery."
          startFrame={18}
          wholeLine
          style={{
            color: colors.primary_dark,
            fontFamily: FONT_DISPLAY,
            fontSize: 110,
            lineHeight: 1.05,
            textTransform: 'uppercase',
            marginTop: 8,
          }}
        />
        <BlurInWords
          text="Every day."
          startFrame={32}
          wholeLine
          style={{
            color: colors.primary_dark,
            fontFamily: FONT_DISPLAY,
            fontSize: 110,
            lineHeight: 1.05,
            textTransform: 'uppercase',
            marginTop: 8,
          }}
        />

        <div
          style={{
            marginTop: 64,
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            transformOrigin: 'left center',
            display: 'inline-block',
            backgroundColor: colors.accent,
            color: colors.primary_dark,
            fontFamily: FONT_BODY,
            fontWeight: 700,
            fontSize: 36,
            padding: '22px 34px',
            borderRadius: 6,
          }}
        >
          {spec.cta || brand.cta_text}
        </div>

        <div
          style={{
            marginTop: 28,
            opacity: subOpacity,
            color: colors.text_secondary,
            fontFamily: FONT_BODY,
            fontSize: 30,
          }}
        >
          Free on iPhone and Android
        </div>
        <div
          style={{
            marginTop: 12,
            opacity: subOpacity,
            color: colors.primary,
            fontFamily: FONT_BODY,
            fontWeight: 600,
            fontSize: 28,
          }}
        >
          {spec.handle || brand.handle}
        </div>
      </div>
    </AbsoluteFill>
  )
}
