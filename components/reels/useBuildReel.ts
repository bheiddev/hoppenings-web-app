'use client'

import { useCallback, useRef, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import { DailyReel, FPS, REEL_HEIGHT, REEL_WIDTH, reelDuration, type DailyReelProps } from './DailyReel'

export type BuildReelProgress = {
  progress: number
  encodedFrames: number
}

function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg/i.test(ua)
}

export function useBuildReel() {
  const [building, setBuilding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const buildReel = useCallback(
    async (postId: string, props: DailyReelProps) => {
      if (isSafari()) {
        throw new Error('Use Chrome or Firefox to build reels (Safari cannot render CSS blur).')
      }
      if (building) return
      setBuilding(true)
      setProgress(0)
      setError(null)

      const supabase = getSupabaseBrowser()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const { error: statusError } = await supabase
          .from('social_posts')
          .update({ reel_status: 'rendering', reel_error: null })
          .eq('id', postId)
        if (statusError) throw new Error(statusError.message)

        const { renderMediaOnWeb } = await import('@remotion/web-renderer')
        const durationInFrames = reelDuration(props)

        const composition = {
          id: 'DailyReel',
          component: DailyReel as unknown as React.FC<Record<string, unknown>>,
          durationInFrames,
          fps: FPS,
          width: REEL_WIDTH,
          height: REEL_HEIGHT,
          defaultProps: props as unknown as Record<string, unknown>,
        }

        let result: Awaited<ReturnType<typeof renderMediaOnWeb>>
        try {
          result = await renderMediaOnWeb({
            composition,
            inputProps: props as unknown as Record<string, unknown>,
            container: 'mp4',
            videoCodec: 'h264',
            audioCodec: 'aac',
            videoBitrate: 'medium',
            signal: controller.signal,
            isProduction: process.env.NODE_ENV === 'production',
            onProgress: ({ progress: p }) => {
              setProgress(Math.round((p || 0) * 100))
            },
          })
        } catch (audioErr) {
          const message = audioErr instanceof Error ? audioErr.message : String(audioErr)
          if (!/audio|aac|codec/i.test(message)) throw audioErr
          result = await renderMediaOnWeb({
            composition,
            inputProps: props as unknown as Record<string, unknown>,
            container: 'mp4',
            videoCodec: 'h264',
            muted: true,
            videoBitrate: 'medium',
            signal: controller.signal,
            isProduction: process.env.NODE_ENV === 'production',
            onProgress: ({ progress: p }) => {
              setProgress(Math.round((p || 0) * 100))
            },
          })
        }

        const blob = await result.getBlob()
        const path = `${postId}/reel-${Date.now()}.mp4`
        const { error: uploadError } = await supabase.storage.from('social').upload(path, blob, {
          contentType: 'video/mp4',
          upsert: false,
        })
        if (uploadError) {
          const hint = /row-level security|RLS|policy/i.test(uploadError.message)
            ? ' Run sql/social_reels_setup.sql in Supabase so admins can upload to the social bucket.'
            : ''
          throw new Error(`${uploadError.message}${hint}`)
        }

        const { data: publicData } = supabase.storage.from('social').getPublicUrl(path)
        const reelUrl = publicData.publicUrl

        const { error: updateError } = await supabase
          .from('social_posts')
          .update({
            reel_url: reelUrl,
            reel_status: 'ready',
            reel_rendered_at: new Date().toISOString(),
            reel_error: null,
          })
          .eq('id', postId)
        if (updateError) throw new Error(updateError.message)

        setProgress(100)
        return reelUrl
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Reel render failed'
        setError(message)
        await supabase
          .from('social_posts')
          .update({ reel_status: 'failed', reel_error: message })
          .eq('id', postId)
        throw err
      } finally {
        setBuilding(false)
        abortRef.current = null
      }
    },
    [building]
  )

  return {
    buildReel,
    cancel,
    building,
    progress,
    error,
    isSafari: isSafari(),
  }
}
