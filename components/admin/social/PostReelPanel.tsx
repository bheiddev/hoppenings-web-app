'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Colors } from '@/lib/colors'
import { AdminButton, AdminSpinner } from '@/components/breweriesEventsAdminButtons'
import {
  DailyReel,
  FPS,
  REEL_HEIGHT,
  REEL_WIDTH,
  reelDuration,
  type DailyReelProps,
} from '@/components/reels/DailyReel'
import { brandFromRow, prepareSpecs, specsFromPost } from '@/components/reels/prepare'
import { useBuildReel } from '@/components/reels/useBuildReel'
import type { BrandProfile, SocialPost } from '@/lib/socialAdmin'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'

const Player = dynamic(
  () => import('@remotion/player').then((m) => m.Player),
  { ssr: false, loading: () => <div style={{ color: Colors.textMuted }}>Loading preview…</div> }
)

function isSafariBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg/i.test(ua)
}

export function PostReelPanel({
  post,
  brand,
  onPostUpdated,
  toast,
}: {
  post: SocialPost
  brand: BrandProfile | null
  onPostUpdated: () => Promise<void> | void
  toast: (kind: 'success' | 'error' | 'warning' | 'info', message: string) => void
}) {
  const { buildReel, building, progress, error, isSafari } = useBuildReel()
  const [publishing, setPublishing] = useState(false)
  const [showSafeZones, setShowSafeZones] = useState(false)
  const [reelProps, setReelProps] = useState<DailyReelProps | null>(null)
  const [preparing, setPreparing] = useState(true)
  const safari = isSafari || isSafariBrowser()

  useEffect(() => {
    let cancelled = false
    setPreparing(true)
    ;(async () => {
      try {
        const base = specsFromPost(post)
        const [specs, brandObj] = await Promise.all([
          prepareSpecs(base, brand),
          brandFromRow(brand),
        ])
        if (!cancelled) setReelProps({ specs, brand: brandObj })
      } catch (err) {
        if (!cancelled) {
          setReelProps(null)
          console.error('Failed to prepare reel', err)
        }
      } finally {
        if (!cancelled) setPreparing(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // Re-prepare when slide data or brand assets change.
  }, [post.id, post.slide_specs, post.image_urls, brand])

  const durationInFrames = reelProps ? reelDuration(reelProps) : FPS
  const hasSlides = (post.image_urls?.length ?? 0) > 0 || (post.slide_specs?.length ?? 0) > 0
  const slidesChangedAfterReel =
    Boolean(post.reel_url) &&
    Boolean(post.reel_rendered_at) &&
    Boolean(post.updated_at) &&
    new Date(post.updated_at).getTime() - new Date(post.reel_rendered_at!).getTime() > 2000

  const statusLabel = (() => {
    if (building) return `Rendering ${progress}%`
    if (preparing) return 'Preparing…'
    if (post.reel_status === 'ready') return 'Ready'
    if (post.reel_status === 'failed') return 'Failed'
    if (post.reel_status === 'published') return 'Published'
    if (post.reel_status === 'rendering') return 'Rendering…'
    return 'Not built'
  })()

  async function handleBuild() {
    if (!reelProps) return
    try {
      await buildReel(post.id, reelProps)
      toast('success', 'Reel ready')
      await onPostUpdated()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Reel build failed')
      await onPostUpdated()
    }
  }

  async function handlePublish() {
    if (publishing) return
    setPublishing(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data, error: fnError } = await supabase.functions.invoke('publish-post', {
        body: { post_id: post.id, format: 'reel' },
      })
      if (fnError || (data && typeof data === 'object' && 'error' in data)) {
        const msg =
          data && typeof data === 'object' && 'error' in data
            ? String((data as { error: unknown }).error)
            : fnError?.message || 'Publish failed'
        if (/not enabled|isn't enabled|not implemented|unknown/i.test(msg)) {
          toast('warning', "Reel publishing isn't enabled yet")
        } else {
          toast('error', msg)
        }
        await onPostUpdated()
        return
      }
      toast('success', 'Reel published')
      await onPostUpdated()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  if (!hasSlides) {
    return (
      <div
        className="rounded border p-4 text-sm"
        style={{ borderColor: Colors.dividerLight, color: Colors.textSecondary }}
      >
        Render slides first to preview and build a reel.
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border p-4 space-y-4 min-w-0 max-w-full overflow-hidden"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          className="text-sm font-semibold"
          style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Reel
        </h3>
        <span className="text-xs" style={{ color: Colors.textSecondary }}>
          {statusLabel}
        </span>
      </div>

      {slidesChangedAfterReel ? (
        <div
          className="rounded border px-3 py-2 text-sm"
          style={{ borderColor: Colors.warning, backgroundColor: '#FFF8E7', color: '#856404' }}
        >
          Slides changed, rebuild reel
        </div>
      ) : null}

      {post.reel_error || error ? (
        <div
          className="rounded border px-3 py-2 text-sm"
          style={{ borderColor: Colors.error, backgroundColor: '#FEE2E2', color: Colors.error }}
        >
          {post.reel_error || error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4 items-start min-w-0">
        <div className="relative w-full max-w-[360px] min-w-0">
          <div
            className="rounded border overflow-hidden"
            style={{
              borderColor: Colors.dividerLight,
              backgroundColor: Colors.surfaceDark,
              lineHeight: 0,
              // Remotion's unscaled 1080 canvas must not expand the page.
              contain: 'layout paint',
            }}
          >
            {reelProps ? (
              <Player
                component={DailyReel as unknown as React.FC<Record<string, unknown>>}
                inputProps={reelProps as unknown as Record<string, unknown>}
                durationInFrames={durationInFrames}
                compositionWidth={REEL_WIDTH}
                compositionHeight={REEL_HEIGHT}
                fps={FPS}
                style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}
                controls
                loop
                autoPlay
                initiallyMuted
              />
            ) : (
              <div
                className="flex items-center justify-center text-sm"
                style={{ aspectRatio: '9 / 16', color: Colors.textMuted }}
              >
                {preparing ? 'Preparing preview…' : 'No reel data'}
              </div>
            )}
          </div>
          {showSafeZones ? (
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background: `
                  linear-gradient(to bottom, rgba(248,199,1,0.25) 0, rgba(248,199,1,0.25) 8.3%, transparent 8.3%),
                  linear-gradient(to top, rgba(248,199,1,0.3) 0, rgba(248,199,1,0.3) 21.9%, transparent 21.9%),
                  linear-gradient(to left, rgba(248,199,1,0.25) 0, rgba(248,199,1,0.25) 13%, transparent 13%)
                `,
              }}
            />
          ) : null}
        </div>

        <div className="flex-1 min-w-[200px] space-y-3">
          <p className="text-xs" style={{ color: Colors.textMuted }}>
            Live from slide templates · 1080×1920 · 30 fps · keep this tab open while rendering.
          </p>

          {safari ? (
            <div
              className="rounded border px-3 py-2 text-sm"
              style={{ borderColor: Colors.warning, backgroundColor: '#FFF8E7', color: '#856404' }}
            >
              Use Chrome or Firefox to build reels (Safari can&apos;t render CSS blur).
            </div>
          ) : null}

          {building ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: Colors.textDark }}>
                <AdminSpinner /> Keep this tab open · {progress}%
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded"
                style={{ backgroundColor: Colors.surfaceLight }}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: Colors.primaryDark,
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <AdminButton
              variant="add"
              loading={building || preparing}
              disabled={building || preparing || safari || !reelProps}
              onClick={() => void handleBuild()}
            >
              Build reel
            </AdminButton>
            {post.reel_url ? (
              <a
                href={post.reel_url}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-2 py-1 text-xs rounded border"
                style={{
                  borderColor: Colors.primaryDark,
                  color: Colors.textDark,
                  backgroundColor: Colors.surface,
                }}
              >
                Download MP4
              </a>
            ) : null}
            <AdminButton
              variant="save"
              loading={publishing}
              disabled={publishing || post.reel_status !== 'ready' || !post.reel_url}
              onClick={() => void handlePublish()}
            >
              Publish reel
            </AdminButton>
          </div>

          <label className="flex items-center gap-2 text-xs" style={{ color: Colors.textSecondary }}>
            <input
              type="checkbox"
              checked={showSafeZones}
              onChange={(e) => setShowSafeZones(e.target.checked)}
            />
            Show Instagram safe-zone overlay
          </label>

          {post.reel_permalink ? (
            <a
              href={post.reel_permalink}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold underline"
              style={{ color: Colors.primary }}
            >
              View reel on Instagram
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
