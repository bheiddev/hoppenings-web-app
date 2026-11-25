import type { ReelBrand, ReelBrandColors } from './types'

export const DEFAULT_COLORS: ReelBrandColors = {
  primary: '#5D2525',
  primary_dark: '#3A1515',
  accent: '#F8C701',
  cream: '#F9F7F2',
  charcoal: '#1A1A1A',
  text_primary: '#2D2926',
  text_secondary: '#665E5A',
  border: '#E5DFD6',
}

export const REEL_WIDTH = 1080
export const REEL_HEIGHT = 1920
export const REEL_FPS = 30

/** Design content inside this box (Instagram UI chrome). */
export const SAFE = {
  left: 72,
  right: 940,
  top: 180,
  bottom: 1500,
  bottomDanger: 420,
  rightDanger: 140,
  topChrome: 160,
} as const

export const FONT_DISPLAY = 'HopDisplay, "Fjalla One", Impact, sans-serif'
export const FONT_BODY = 'HopBody, "Be Vietnam Pro", Helvetica, Arial, sans-serif'

export function mergeBrandColors(partial?: Partial<ReelBrandColors> | null): ReelBrandColors {
  return { ...DEFAULT_COLORS, ...(partial || {}) }
}

export function brandFromProfile(row: {
  name?: string | null
  colors?: Partial<ReelBrandColors> | null
  handle?: string | null
  cta_text?: string | null
  logo_url?: string | null
  logo_light_url?: string | null
  app_image_url?: string | null
  reel_audio_url?: string | null
} | null): ReelBrand {
  return {
    name: row?.name || 'Hoppenings',
    colors: mergeBrandColors(row?.colors),
    handle: row?.handle || '@hoppenings',
    cta_text: row?.cta_text || 'Get the app · Link in bio',
    logo_url: row?.logo_url ?? null,
    logo_light_url: row?.logo_light_url ?? null,
    app_image_url: row?.app_image_url ?? null,
    reel_audio_url: row?.reel_audio_url ?? null,
  }
}
