'use client'

// One reel scene from one slide spec: the carousel slide's own layout, animated in.
// The 1080×1350 (4:5) slide is scaled to fill as much of the 9:16 frame as Instagram
// safe zones allow, so we don't leave a huge empty maroon band under the content.
import { useMemo } from 'react'
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import type { SlideSpec } from './shared/slides'
import { HEIGHT, renderSlideElement, WIDTH, type Brand } from './shared/templates'
import { toReact } from './anim/toReact'
import { DURATION, LEAD_FRAMES, sceneFrames } from './anim/timing'

export const REEL_W = 1080
export const REEL_H = 1920
/** Top inset — status bar / back control. Keep headlines out of this band. */
export const SLIDE_TOP = 72
/** Bottom inset — caption, account name, CTA. */
export const SLIDE_BOTTOM_SAFE = 340

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

/** Scale 4:5 slide up to fill available 9:16 height (slight side clip; PAD still clears). */
export function slideLayout() {
  const availH = REEL_H - SLIDE_TOP - SLIDE_BOTTOM_SAFE
  const scale = Math.min(availH / HEIGHT, 1.12)
  const drawW = WIDTH * scale
  const drawH = HEIGHT * scale
  const left = (REEL_W - drawW) / 2
  return { scale, drawW, drawH, left, top: SLIDE_TOP, availH }
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
  const { scale, drawW, drawH, left, top } = slideLayout()

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

  return (
    <AbsoluteFill style={{ backgroundColor: bg as string }}>
      {/* Clip side overflow from scale-up so fly-ins can't paint outside the reel. */}
      <div
        style={{
          position: 'absolute',
          top,
          left: Math.min(0, left),
          width: Math.max(REEL_W, drawW),
          height: drawH,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: left < 0 ? 0 : left,
            width: WIDTH,
            height: HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
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
                objectFit: 'cover',
                opacity: staticOpacity,
              }}
            />
          )}
        </div>
      </div>
    </AbsoluteFill>
  )
}
