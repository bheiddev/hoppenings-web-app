import { cache } from 'react'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

/** Signed URL lifetime when we mint a fresh one (Supabase commonly caps at ~1 year). */
const SIGNED_TTL_SECONDS = 60 * 60 * 24 * 365

/** Re-sign when the existing token expires within this window. */
const REFRESH_IF_EXPIRES_WITHIN_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Parse Supabase Storage object URLs:
 * `/storage/v1/object/sign/<bucket>/<path>?token=...`
 * `/storage/v1/object/public/<bucket>/<path>`
 */
export function parseSupabaseObjectUrl(
  url: string
): { bucket: string; path: string } | null {
  try {
    const u = new URL(url)
    const m = u.pathname.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/(.+)$/)
    if (!m) return null
    return {
      bucket: decodeURIComponent(m[1]),
      path: decodeURIComponent(m[2]),
    }
  } catch {
    return null
  }
}

function signedUrlStillFresh(url: string): boolean {
  try {
    const token = new URL(url).searchParams.get('token')
    if (!token) return false
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return false
    const padded = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const json = Buffer.from(padded + pad, 'base64').toString('utf8')
    const payload = JSON.parse(json) as { exp?: number }
    if (!payload.exp) return false
    return payload.exp * 1000 > Date.now() + REFRESH_IF_EXPIRES_WITHIN_MS
  } catch {
    return false
  }
}

async function mintSignedUrl(bucket: string, path: string): Promise<string | null> {
  const admin = getSupabaseAdmin()
  if (!admin) {
    console.error(
      'Cannot refresh storage URL: SUPABASE_SERVICE_ROLE_KEY is not configured'
    )
    return null
  }
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, SIGNED_TTL_SECONDS)
  if (error || !data?.signedUrl) {
    console.error('createSignedUrl failed:', bucket, path, error?.message)
    return null
  }
  return data.signedUrl
}

const ensureFreshStorageUrlCached = cache(async (url: string): Promise<string> => {
  const parsed = parseSupabaseObjectUrl(url)
  if (!parsed) return url

  // Public URLs only work if the bucket is public; brewery-images is private.
  // Always mint a signed URL for storage objects we control.
  if (url.includes('/object/sign/') && signedUrlStillFresh(url)) {
    return url
  }

  const fresh = await mintSignedUrl(parsed.bucket, parsed.path)
  return fresh ?? url
})

/**
 * Ensure a brewery (or other) storage image URL is still loadable.
 * Brewery images are stored as signed URLs that expire (~1 year); expired
 * tokens render as blank heroes/cards. Re-signs via the service role when needed.
 */
export async function ensureFreshStorageUrl(
  url: string | null | undefined
): Promise<string | null> {
  if (!url) return null
  return ensureFreshStorageUrlCached(url)
}

export async function ensureFreshBreweryImages<
  T extends { image_url?: string | null; tap_image?: string | null },
>(brewery: T): Promise<T> {
  const [image_url, tap_image] = await Promise.all([
    ensureFreshStorageUrl(brewery.image_url),
    ensureFreshStorageUrl(brewery.tap_image ?? null),
  ])
  return {
    ...brewery,
    image_url,
    ...(brewery.tap_image !== undefined ? { tap_image } : {}),
  }
}
