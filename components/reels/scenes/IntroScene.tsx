'use client'

import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion'
import { useState } from 'react'
import { BlurInWords } from '../anim/BlurInWords'
import { FONT_BODY, FONT_DISPLAY, SAFE } from '../brand'
import type { CoverPreview, ReelBrand } from '../types'

type CoverSpec = {
  kind: 'cover'
  dateEyebrow: string
  city: string
  statLine: string
  itemCount?: number
  previews?: CoverPreview[]
  moreCount?: number
}

export function IntroScene({ spec, brand }: { spec: CoverSpec; brand: ReelBrand }) {
  const frame = useCurrentFrame()
  const colors = brand.colors
  const previews = spec.previews ?? []
  const hero = previews[0]
  const others = previews.slice(1)

  const eyebrowOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const ruleScale = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const heroT = interpolate(frame, [45, 62], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const heroEased = 1 - Math.pow(1 - heroT, 3)

  return (
    <AbsoluteFill style={{ backgroundColor: colors.primary_dark }}>
      <div
        style={{
          position: 'absolute',
          left: SAFE.left,
          top: SAFE.top,
          width: SAFE.right - SAFE.left,
          bottom: 1920 - SAFE.bottom,
        }}
      >
        <div
          style={{
            opacity: eyebrowOpacity,
            color: colors.accent,
            fontFamily: FONT_BODY,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {spec.dateEyebrow}
        </div>

        <div
          style={{
            marginTop: 28,
            width: 120,
            height: 8,
            backgroundColor: colors.accent,
            transform: `scaleX(${ruleScale})`,
            transformOrigin: 'left center',
          }}
        />

        <div style={{ marginTop: 24 }}>
          <BlurInWords
            text="What's"
            startFrame={8}
            stagger={5}
            style={{
              color: colors.cream,
              fontFamily: FONT_DISPLAY,
              fontSize: 150,
              lineHeight: 0.95,
              textTransform: 'uppercase',
            }}
          />
          <BlurInWords
            text="Hoppening?"
            startFrame={18}
            stagger={5}
            style={{
              color: colors.cream,
              fontFamily: FONT_DISPLAY,
              fontSize: 150,
              lineHeight: 0.95,
              textTransform: 'uppercase',
            }}
          />
        </div>

        <div style={{ marginTop: 18 }}>
          <BlurInWords
            text={`In ${spec.city}`}
            startFrame={30}
            stagger={4}
            style={{
              color: colors.accent,
              fontFamily: FONT_DISPLAY,
              fontSize: 72,
              textTransform: 'uppercase',
            }}
          />
        </div>

        {(hero || others.length > 0) && (
          <div
            style={{
              marginTop: 48,
              display: 'flex',
              gap: 28,
              opacity: heroEased,
              transform: `translateY(${(1 - heroEased) * 60}px)`,
            }}
          >
            {hero ? (
              <HeroCard preview={hero} brand={brand} frame={frame} />
            ) : (
              <div style={{ flex: 1 }} />
            )}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {others.map((row, i) => {
                const start = 55 + i * 5
                const t = interpolate(frame, [start, start + 12], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                })
                const e = 1 - Math.pow(1 - t, 3)
                return (
                  <div
                    key={`${row.title}-${i}`}
                    style={{
                      opacity: e,
                      transform: `translateY(${(1 - e) * 20}px)`,
                      borderBottom: `1px solid ${colors.border}55`,
                      paddingBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        color: colors.accent,
                        fontFamily: FONT_BODY,
                        fontWeight: 700,
                        fontSize: 22,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {row.time}
                    </div>
                    <div
                      style={{
                        color: colors.cream,
                        fontFamily: FONT_DISPLAY,
                        fontSize: 34,
                        textTransform: 'uppercase',
                        lineHeight: 1.1,
                        marginTop: 4,
                      }}
                    >
                      {row.title}
                    </div>
                    <div
                      style={{
                        color: colors.cream,
                        opacity: 0.7,
                        fontFamily: FONT_BODY,
                        fontSize: 22,
                        marginTop: 4,
                      }}
                    >
                      {row.brewery}
                    </div>
                  </div>
                )
              })}
              {spec.statLine ? (
                <div
                  style={{
                    marginTop: 8,
                    color: colors.cream,
                    opacity: 0.65,
                    fontFamily: FONT_BODY,
                    fontSize: 24,
                  }}
                >
                  {spec.statLine}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}

function HeroCard({
  preview,
  brand,
  frame,
}: {
  preview: CoverPreview
  brand: ReelBrand
  frame: number
}) {
  const [failedPrimary, setFailedPrimary] = useState(false)
  const [failedFallback, setFailedFallback] = useState(false)
  const colors = brand.colors
  const primary = preview.image?.url
  const fallback = preview.image?.fallback_url
  const url = !failedPrimary ? primary : fallback && !failedFallback ? fallback : null
  const zoom = interpolate(frame, [45, 105], [1, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 10,
        overflow: 'hidden',
        minHeight: 520,
      }}
    >
      <div style={{ height: 320, overflow: 'hidden', backgroundColor: colors.charcoal }}>
        {url ? (
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
              transform: `scale(${zoom})`,
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: colors.primary }} />
        )}
      </div>
      <div style={{ padding: 22 }}>
        <div
          style={{
            color: colors.accent,
            fontFamily: FONT_BODY,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {preview.label}
        </div>
        <div
          style={{
            marginTop: 8,
            color: colors.cream,
            fontFamily: FONT_DISPLAY,
            fontSize: 40,
            textTransform: 'uppercase',
            lineHeight: 1.05,
          }}
        >
          {preview.title}
        </div>
        <div
          style={{
            marginTop: 10,
            color: colors.cream,
            opacity: 0.75,
            fontFamily: FONT_BODY,
            fontSize: 24,
          }}
        >
          {preview.time} · {preview.brewery}
        </div>
      </div>
    </div>
  )
}
