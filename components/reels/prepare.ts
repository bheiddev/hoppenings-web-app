// Before rendering: pick a working URL for every photo and put it where the templates expect
// it (imageData), so templates choose the photo layouts exactly like render-slide does.
import type { SlideSpec } from './shared/slides'
import { resolveColors, type Brand } from './shared/templates'
import type { ReelSpec } from './SlideScene'

/** Resolves to the first URL that loads as an image (CORS-clean), or null. */
async function firstLoadable(urls: (string | null | undefined)[]): Promise<string | null> {
  for (const url of [...new Set(urls.filter(Boolean) as string[])]) {
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
    })
    if (ok) return url
  }
  return null
}

/** Deep-copies specs and fills imageData from image.url / image.fallback_url. */
export async function prepareSpecs(specs: ReelSpec[]): Promise<ReelSpec[]> {
  const out = structuredClone(specs) as ReelSpec[]
  await Promise.all(
    out.map(async (s) => {
      if (s.kind === 'featured') {
        s.item.imageData = await firstLoadable([s.item.image?.url, s.item.image?.fallback_url])
      } else if (s.kind === 'cover' && s.previews?.[0]) {
        const hero = s.previews[0]
        hero.imageData = await firstLoadable([hero.image?.url, hero.image?.fallback_url])
      }
    })
  )
  return out
}

/** brand_profiles row -> the Brand object the templates take. */
export async function brandFromRow(
  row: {
    name?: string | null
    colors?: Record<string, string> | null
    logo_url?: string | null
    logo_light_url?: string | null
    handle?: string | null
    cta_text?: string | null
    app_image_url?: string | null
  } | null
): Promise<Brand> {
  return {
    name: row?.name || 'Hoppenings',
    colors: resolveColors(row?.colors),
    logo_url: row?.logo_url ?? null,
    logo_light_url: row?.logo_light_url ?? null,
    handle: row?.handle || '@hoppenings',
    cta_text: row?.cta_text || 'Get the app · Link in bio',
    appImageData: await firstLoadable([row?.app_image_url]),
  }
}

/** Older posts with no slide_specs → static slideshow of image_urls. */
export function specsFromPost(post: {
  slide_specs?: unknown[] | null
  image_urls?: string[] | null
}): ReelSpec[] {
  const specs = Array.isArray(post.slide_specs) ? (post.slide_specs as ReelSpec[]) : []
  if (specs.length > 0) return specs
  return (post.image_urls ?? []).map((url) => ({ kind: 'static' as const, url }))
}

export type { SlideSpec }
