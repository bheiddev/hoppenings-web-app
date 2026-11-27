'use client'

// One reel scene from one slide spec: the carousel slide's own layout, animated in.
// Fits the 1080×1350 (4:5) slide at full width — no horizontal scale/crop — so static
// promos and edge text aren't clipped.
import { useMemo } from 'react'
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import type { SlideSpec } from './shared/slides'
import { HEIGHT, renderSlideElement, WIDTH, type Brand } from './shared/templates'
import { toReact } from './anim/toReact'
import { DURATION, LEAD_FRAMES, sceneFrames } from './anim/timing'

export const REEL_W = 1080
export const REEL_H = 1920
/** Top inset — status bar / back control. */
export const SLIDE_TOP = 72
/** Bottom inset — caption, account name, CTA (keep some air, but don't leave a huge empty band). */
export const SLIDE_BOTTOM_SAFE = 240

export type ReelSpec = SlideSpec | { kind: 'static'; url: string }

/** The slide tree for a spec (null for static promo images). */
export function slideTree(spec: ReelSpec, brand: Brand) {
  return spec.kind === 'static' ? null : renderSlideElement(brand, spec)
}

/** Frames this scene needs: all of its animations plus a short hold. */
export function sceneDuration(spec: ReelSpec, brand: Brand): number {
  const tree = slideTree(spec, brand)
  // Static promos: a bit longer so the fade-in + hold reads clearly.
  return tree ? sceneFrames(tree) : 90
}

export function SlideScene({
  spec,
  brand,
  animate = true,
}: {
  spec: ReelSpec
  brand: Brand
  /** Set false for static JPEG overlay QA. */
  animate?: boolean
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const tree = useMemo(() => slideTree(spec, brand), [spec, brand])

  const bg =
    (tree?.props?.style as React.CSSProperties | undefined)?.backgroundColor ??
    brand.colors.primary_dark

  const staticOpacity =
    animate === false
      ? 1
      : interpolate(frame, [LEAD_FRAMES, LEAD_FRAMES + DURATION], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })

  // Scale the 4:5 slide up to fill the safe 9:16 band (small side crop is OK; less empty maroon).
  const availH = REEL_H - SLIDE_TOP - SLIDE_BOTTOM_SAFE
  const scale = Math.min(availH / HEIGHT, 1.16)

  return (
    <AbsoluteFill style={{ backgroundColor: bg as string }}>
      <div
        style={{
          position: 'absolute',
          top: SLIDE_TOP,
          left: (REEL_W - WIDTH * scale) / 2,
          width: WIDTH,
          height: HEIGHT,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {tree ? (
          toReact(tree as never, { frame, fps, animate })
        ) : (
          <Img
            src={(spec as { url: string }).url}
            style={{
              width: WIDTH,
              height: HEIGHT,
              objectFit: 'contain',
              objectPosition: 'center top',
              opacity: staticOpacity,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  )
}
