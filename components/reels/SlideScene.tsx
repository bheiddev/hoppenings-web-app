'use client'

// One reel scene from one slide spec: the carousel slide's own layout, animated in.
// The 1080 x 1350 slide sits inside the 1080 x 1920 reel, clear of Instagram's bottom UI.
import { useMemo } from 'react'
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import type { SlideSpec } from './shared/slides'
import { HEIGHT, renderSlideElement, WIDTH, type Brand } from './shared/templates'
import { toReact } from './anim/toReact'
import { sceneFrames, ZOOM_FRAMES } from './anim/timing'

export const REEL_W = 1080
export const REEL_H = 1920
export const SLIDE_TOP = 170 // leaves ~400px at the bottom for Instagram's caption and buttons

export type ReelSpec = SlideSpec | { kind: 'static'; url: string }

/** The slide tree for a spec (null for static promo images). */
export function slideTree(spec: ReelSpec, brand: Brand) {
  return spec.kind === 'static' ? null : renderSlideElement(brand, spec)
}

/** Frames this scene needs: all of its animations plus a short hold. */
export function sceneDuration(spec: ReelSpec, brand: Brand): number {
  const tree = slideTree(spec, brand)
  return tree ? sceneFrames(tree) : 75
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

  // Fill the 9:16 frame with the slide's own background colour so the 4:5 slide blends in.
  const bg =
    (tree?.props?.style as React.CSSProperties | undefined)?.backgroundColor ??
    brand.colors.primary_dark

  return (
    <AbsoluteFill style={{ backgroundColor: bg as string }}>
      <div
        style={{
          position: 'absolute',
          top: SLIDE_TOP,
          left: 0,
          width: WIDTH,
          height: HEIGHT,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {tree ? (
          toReact(tree as never, { frame, fps, animate })
        ) : (
          // Pre-made promo image: no data to animate, so a slow settle-in zoom.
          <Img
            src={(spec as { url: string }).url}
            style={{
              width: WIDTH,
              height: HEIGHT,
              objectFit: 'cover',
              transform: `scale(${interpolate(frame, [0, ZOOM_FRAMES], [1.06, 1], {
                extrapolateRight: 'clamp',
              })})`,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  )
}
