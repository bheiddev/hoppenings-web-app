// Reel animation timing + per-kind styles. Every animation ends at the element's static
// position (opacity 1, no transform, no blur), so the last frame of a scene equals the slide
// and nothing overlaps once settled.
import { Easing, interpolate, spring } from 'remotion'
import type { Anim } from '../shared/templates'

export const ORDER_FRAMES = 5 // snappy gap between choreography steps
export const LEAD_FRAMES = 5 // wait for the scene transition before the first step
export const DURATION = 16 // frames for one element's animation
export const WORD_STAGGER = 3 // frames between words in a "words" animation
export const WORD_DURATION = 14
export const HOLD_FRAMES = 40 // rest on the finished slide before the next transition
/** @deprecated zoom removed from scenes — kept for scene-length math if a tag slips through */
export const ZOOM_FRAMES = 1
export const ZOOM_FROM = 1

/** Horizontal fly-in distance — starts fully off the 1080-wide slide. */
export const SLIDE_FROM_PX = 1100
/** Vertical rise — keep modest so rising elements don't cover neighbours mid-flight. */
export const RISE_FROM_PX = 48
export const WORDS_RISE_PX = 28
export const RISE_BLUR_PX = 8
export const WORDS_BLUR_PX = 12
export const POP_FROM = 0.62

const ease = Easing.bezier(0.16, 1, 0.3, 1) // fast start, soft landing

export function startFrame(a: Anim): number {
  return LEAD_FRAMES + a.order * ORDER_FRAMES + (a.offset ?? 0)
}

/** 0 -> 1 progress of an animation that starts at `start` and lasts `dur` frames. */
export function progress(frame: number, start: number, dur = DURATION): number {
  return interpolate(frame, [start, start + dur], [0, 1], {
    easing: ease,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

export interface AnimStyle {
  opacity?: number
  transform?: string
  filter?: string
  transformOrigin?: string
}

/** Only emit motion CSS while in progress — at rest return {} so layout matches the JPEG. */
function settle(p: number, mid: AnimStyle): AnimStyle {
  if (p >= 0.999) return {}
  return mid
}

/** Style to merge onto a tagged element at `frame` (not used for "words"; see wordStyle). */
export function animStyle(a: Anim, frame: number, fps: number): AnimStyle {
  const start = startFrame(a)
  const p = progress(frame, start)
  switch (a.kind) {
    case 'fade':
      return settle(p, { opacity: p })
    case 'rise':
      return settle(p, {
        opacity: p,
        transform: `translateY(${(1 - p) * RISE_FROM_PX}px)`,
        ...(1 - p > 0.04 ? { filter: `blur(${(1 - p) * RISE_BLUR_PX}px)` } : null),
      })
    case 'slide': {
      const from = a.dir === 'right' ? SLIDE_FROM_PX : -SLIDE_FROM_PX
      return settle(p, {
        opacity: p,
        transform: `translateX(${(1 - p) * from}px)`,
      })
    }
    case 'pop': {
      const s = spring({
        frame: frame - start,
        fps,
        config: { damping: 11, stiffness: 200, mass: 0.7 },
      })
      const scale = POP_FROM + (1 - POP_FROM) * Math.min(1, s)
      return settle(Math.min(1, p * 1.4), {
        opacity: Math.min(1, p * 1.6),
        transform: `scale(${scale})`,
      })
    }
    case 'wipe':
      return settle(p, {
        transform: `scaleX(${Math.max(0.001, p)})`,
        transformOrigin: 'left center',
      })
    case 'zoom':
      // Zoom disabled — treat as instant rest so photos never scale over neighbours.
      return {}
    default:
      return {}
  }
}

/** Style for word `i` of a "words" animation: rise + blur-to-sharp, staggered. */
export function wordStyle(a: Anim, i: number, frame: number): AnimStyle {
  const p = progress(frame, startFrame(a) + i * WORD_STAGGER, WORD_DURATION)
  if (p >= 0.999) return {}
  const blur = (1 - p) * WORDS_BLUR_PX
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * WORDS_RISE_PX}px)`,
    ...(blur > 0.05 ? { filter: `blur(${blur}px)` } : null),
  }
}

/** Frame at which the last tagged animation in a slide tree finishes. */
export function lastAnimEnd(node: unknown): number {
  let end = 0
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk)
    if (!n || typeof n !== 'object') return
    const props = (n as { props?: Record<string, unknown> }).props ?? {}
    const a = props.anim as Anim | undefined
    if (a && a.kind !== 'zoom') {
      const words =
        a.kind === 'words' && typeof props.children === 'string'
          ? (props.children as string).trim().split(/\s+/).length
          : 1
      const dur = a.kind === 'words' ? (words - 1) * WORD_STAGGER + WORD_DURATION : DURATION
      end = Math.max(end, startFrame(a) + dur)
    }
    walk(props.children)
  }
  walk(node)
  return end
}

/** Scene length: every animation finished, plus a hold on the finished slide. */
export function sceneFrames(tree: unknown, min = 60): number {
  return Math.max(min, lastAnimEnd(tree) + HOLD_FRAMES)
}
