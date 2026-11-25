'use client'

import './fonts.css'
import type { ReactNode } from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import { Audio } from '@remotion/media'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { IntroScene } from './scenes/IntroScene'
import { ItemScene } from './scenes/ItemScene'
import { EndScene } from './scenes/EndScene'
import { StaticScene } from './scenes/StaticScene'
import { buildTimeline, totalDurationInFrames, TRANSITION_FRAMES } from './timeline'
import { REEL_FPS, REEL_HEIGHT, REEL_WIDTH } from './brand'
import type { DailyReelProps, SlideSpec } from './types'

function SceneForSpec({
  spec,
  imageUrl,
  brand,
}: {
  spec: SlideSpec
  imageUrl: string | null
  brand: DailyReelProps['brand']
}) {
  if (spec.kind === 'cover') {
    return <IntroScene spec={spec as Extract<SlideSpec, { kind: 'cover' }>} brand={brand} />
  }
  if (spec.kind === 'featured') {
    return <ItemScene spec={spec as Extract<SlideSpec, { kind: 'featured' }>} brand={brand} />
  }
  if (spec.kind === 'end') {
    return <EndScene spec={spec as Extract<SlideSpec, { kind: 'end' }>} brand={brand} />
  }
  const url =
    spec.kind === 'static' && typeof (spec as { url?: string }).url === 'string'
      ? (spec as { url: string }).url
      : imageUrl
  return <StaticScene url={url} brand={brand} />
}

export function DailyReel(props: DailyReelProps) {
  const scenes = buildTimeline(props)
  const audioUrl = props.audioUrl ?? props.brand.reel_audio_url
  const totalFrames = totalDurationInFrames(scenes)

  if (scenes.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: props.brand.colors.primary_dark }} />
    )
  }

  const seriesChildren: ReactNode[] = []
  scenes.forEach((scene, index) => {
    seriesChildren.push(
      <TransitionSeries.Sequence
        key={`seq-${scene.spec.kind}-${index}`}
        durationInFrames={scene.durationInFrames}
      >
        <SceneForSpec
          spec={scene.spec}
          imageUrl={scene.imageUrl}
          brand={props.brand}
        />
      </TransitionSeries.Sequence>
    )
    if (index < scenes.length - 1) {
      seriesChildren.push(
        <TransitionSeries.Transition
          key={`tr-${index}`}
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
      )
    }
  })

  return (
    <AbsoluteFill style={{ backgroundColor: props.brand.colors.primary_dark }}>
      <TransitionSeries>{seriesChildren}</TransitionSeries>

      {audioUrl ? (
        <Sequence from={0} durationInFrames={totalFrames} layout="none">
          <Audio
            src={audioUrl}
            volume={(f) => {
              const fadeIn = Math.min(1, f / 10)
              const fadeOut = Math.min(1, (totalFrames - f) / 20)
              return Math.max(0, Math.min(fadeIn, fadeOut))
            }}
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  )
}

export function getDailyReelComposition(props: DailyReelProps) {
  const scenes = buildTimeline(props)
  return {
    id: 'DailyReel',
    component: DailyReel as unknown as React.FC<Record<string, unknown>>,
    durationInFrames: totalDurationInFrames(scenes),
    fps: REEL_FPS,
    width: REEL_WIDTH,
    height: REEL_HEIGHT,
    defaultProps: props as unknown as Record<string, unknown>,
  }
}

export { buildTimeline, totalDurationInFrames }
