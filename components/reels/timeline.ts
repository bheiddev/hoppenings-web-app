import type { DailyReelProps, SlideSpec } from './types'
import { REEL_FPS } from './brand'

export const DUR = {
  cover: 105,
  featured: 75,
  featuredWithDesc: 90,
  static: 75,
  end: 90,
  featuredShort: 60,
} as const

export const TRANSITION_FRAMES = 9

export type TimelineScene = {
  spec: SlideSpec
  imageUrl: string | null
  durationInFrames: number
}

function featuredDuration(spec: SlideSpec): number {
  if (spec.kind !== 'featured') return DUR.featured
  const item = (spec as { item?: { description?: string | null } }).item
  const hasDesc = Boolean(item?.description?.trim())
  return hasDesc ? DUR.featuredWithDesc : DUR.featured
}

export function buildTimeline(props: Pick<DailyReelProps, 'specs' | 'imageUrls'>): TimelineScene[] {
  const { specs, imageUrls } = props

  if (!specs?.length) {
    return (imageUrls || []).map((url) => ({
      spec: { kind: 'static', url } as SlideSpec,
      imageUrl: url,
      durationInFrames: DUR.static as number,
    }))
  }

  let scenes: TimelineScene[] = specs.map((spec, i) => {
    const imageUrl =
      spec.kind === 'static' && typeof (spec as { url?: string }).url === 'string'
        ? (spec as { url: string }).url
        : imageUrls[i] ?? null

    let durationInFrames: number = DUR.static
    if (spec.kind === 'cover') durationInFrames = DUR.cover
    else if (spec.kind === 'featured') durationInFrames = featuredDuration(spec)
    else if (spec.kind === 'end') durationInFrames = DUR.end
    else if (spec.kind === 'static') durationInFrames = DUR.static
    else durationInFrames = DUR.static

    return { spec, imageUrl, durationInFrames }
  })

  // Cap total length ~35s including transitions.
  const maxFrames = 35 * REEL_FPS
  const transitionOverhead = Math.max(0, scenes.length - 1) * TRANSITION_FRAMES
  let contentFrames = scenes.reduce((sum, s) => sum + s.durationInFrames, 0)

  if (contentFrames + transitionOverhead > maxFrames) {
    scenes = scenes.map((s) =>
      s.spec.kind === 'featured'
        ? { ...s, durationInFrames: DUR.featuredShort }
        : s
    )
  }

  return scenes
}

export function totalDurationInFrames(scenes: TimelineScene[]): number {
  if (scenes.length === 0) return REEL_FPS
  const content = scenes.reduce((sum, s) => sum + s.durationInFrames, 0)
  const transitions = Math.max(0, scenes.length - 1) * TRANSITION_FRAMES
  // TransitionSeries overlaps transition frames into scene duration.
  return Math.max(REEL_FPS, content - transitions)
}
