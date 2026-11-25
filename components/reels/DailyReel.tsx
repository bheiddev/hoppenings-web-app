'use client'

// The reel: one SlideScene per slide spec, joined with short fades.
import './fonts.css'
import type { ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'
import { linearTiming, TransitionSeries } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import type { Brand } from './shared/templates'
import { sceneDuration, SlideScene, type ReelSpec } from './SlideScene'
import { WaitForFonts } from './WaitForFonts'

export const FPS = 30
export const REEL_WIDTH = 1080
export const REEL_HEIGHT = 1920
export const TRANSITION_FRAMES = 10

export interface DailyReelProps {
  specs: ReelSpec[] // from prepareSpecs(post.slide_specs)
  brand: Brand // from brandFromRow(brand_profiles row)
}

/** Total frames: scenes minus the overlap of each transition. */
export function reelDuration({ specs, brand }: DailyReelProps): number {
  if (!specs.length) return FPS
  const scenes = specs.reduce((sum, s) => sum + sceneDuration(s, brand), 0)
  return Math.max(FPS, scenes - TRANSITION_FRAMES * Math.max(0, specs.length - 1))
}

export function DailyReel({ specs, brand }: DailyReelProps) {
  const children: ReactNode[] = []
  specs.forEach((spec, i) => {
    children.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={sceneDuration(spec, brand)}>
        <SlideScene spec={spec} brand={brand} />
      </TransitionSeries.Sequence>
    )
    if (i < specs.length - 1) {
      children.push(
        <TransitionSeries.Transition
          key={`t${i}`}
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
      )
    }
  })

  return (
    <WaitForFonts>
      <AbsoluteFill style={{ backgroundColor: brand.colors.primary_dark }}>
        {specs.length === 0 ? null : <TransitionSeries>{children}</TransitionSeries>}
      </AbsoluteFill>
    </WaitForFonts>
  )
}
