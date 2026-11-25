'use client'

import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { BlurInWords } from '../anim/BlurInWords'
import { KenBurns } from '../anim/KenBurns'
import { FONT_BODY, FONT_DISPLAY, SAFE } from '../brand'
import type { ReelBrand, SlideItem } from '../types'

type FeaturedSpec = {
  kind: 'featured'
  n: number
  of: number
  label?: string
  dateEyebrow: string
  item: SlideItem
}

export function ItemScene({ spec, brand }: { spec: FeaturedSpec; brand: ReelBrand }) {
  const frame = useCurrentFrame()
  const colors = brand.colors
  const item = spec.item
  const isRelease = item.type === 'release'
  const eyebrow = spec.label || (isRelease ? 'New release' : 'Featured')
  const titleSize = item.title.length > 42 ? 78 : item.title.length > 28 ? 90 : 100

  const eyebrowOpacity = interpolate(frame, [8, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const timeX = interpolate(frame, [14, 28], [-40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const timeOpacity = interpolate(frame, [14, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const badgeScale = interpolate(frame, [22, 34], [0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const badgeOpacity = interpolate(frame, [22, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const breweryOpacity = interpolate(frame, [48, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const descOpacity = interpolate(frame, [58, 72], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const photoUrl = item.image?.url
  const fallbackUrl = item.image?.fallback_url

  return (
    <AbsoluteFill style={{ backgroundColor: colors.primary_dark }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 760,
          backgroundColor: colors.primary,
        }}
      >
        {photoUrl || fallbackUrl ? (
          <KenBurns
            src={photoUrl || fallbackUrl || ''}
            fallbackSrc={fallbackUrl}
            from={1}
            to={1.08}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 160,
            backgroundColor: colors.primary_dark,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: SAFE.left,
          top: 700,
          width: SAFE.right - SAFE.left,
        }}
      >
        <div
          style={{
            opacity: eyebrowOpacity,
            color: colors.accent,
            fontFamily: FONT_BODY,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
          {spec.of > 0 ? ` · ${spec.n} of ${spec.of}` : ''}
        </div>

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            opacity: timeOpacity,
            transform: `translateX(${timeX}px)`,
          }}
        >
          <div
            style={{
              color: colors.accent,
              fontFamily: FONT_DISPLAY,
              fontSize: 56,
              textTransform: 'uppercase',
            }}
          >
            {item.time}
          </div>
          {item.price ? (
            <div
              style={{
                opacity: badgeOpacity,
                transform: `scale(${badgeScale})`,
                backgroundColor: colors.accent,
                color: colors.primary_dark,
                fontFamily: FONT_BODY,
                fontWeight: 700,
                fontSize: 28,
                padding: '10px 16px',
                borderRadius: 4,
              }}
            >
              {item.price}
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 18, maxWidth: 860 }}>
          <BlurInWords
            text={item.title}
            startFrame={28}
            stagger={4}
            style={{
              color: '#FFFFFF',
              fontFamily: FONT_DISPLAY,
              fontSize: titleSize,
              lineHeight: 1.02,
              textTransform: 'uppercase',
            }}
          />
        </div>

        <div
          style={{
            marginTop: 22,
            opacity: breweryOpacity,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ width: 36, height: 4, backgroundColor: colors.accent }} />
          <div
            style={{
              color: colors.cream,
              fontFamily: FONT_BODY,
              fontWeight: 600,
              fontSize: 30,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {item.brewery}
          </div>
        </div>

        {item.meta ? (
          <div
            style={{
              marginTop: 12,
              opacity: breweryOpacity,
              color: colors.accent,
              fontFamily: FONT_BODY,
              fontWeight: 600,
              fontSize: 28,
            }}
          >
            {item.meta}
          </div>
        ) : null}

        {item.description ? (
          <div
            style={{
              marginTop: 28,
              opacity: descOpacity,
              color: colors.cream,
              fontFamily: FONT_BODY,
              fontSize: 32,
              lineHeight: 1.35,
              maxWidth: 820,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.description}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  )
}
