export type SlideItemType = 'event' | 'release' | 'deal'

export interface SlideItem {
  type: SlideItemType
  time: string
  title: string
  brewery: string
  price: string | null
  meta?: string | null
  blurb?: string | null
  description?: string | null
  image?: { url: string; fallback_url: string } | null
}

export interface CoverPreview {
  itemId?: string
  type: SlideItemType
  label: string
  title: string
  time: string
  brewery: string
  description?: string | null
  image?: { url: string; fallback_url: string } | null
}

export type SlideSpec =
  | {
      kind: 'cover'
      dateEyebrow: string
      city: string
      statLine: string
      itemCount?: number
      previews?: CoverPreview[]
      moreCount?: number
    }
  | {
      kind: 'featured'
      n: number
      of: number
      label?: string
      itemId?: string
      dateEyebrow: string
      item: SlideItem
    }
  | { kind: 'end'; city: string; cta: string; handle: string }
  | { kind: 'static'; url: string }
  | { kind: string; [key: string]: unknown }

export type ReelStatus = 'rendering' | 'ready' | 'failed' | 'published'

export type ReelBrandColors = {
  primary: string
  primary_dark: string
  accent: string
  cream: string
  charcoal: string
  text_primary: string
  text_secondary: string
  border: string
}

export type ReelBrand = {
  name: string
  colors: ReelBrandColors
  handle: string
  cta_text: string
  logo_url?: string | null
  logo_light_url?: string | null
  app_image_url?: string | null
  reel_audio_url?: string | null
}

export type DailyReelProps = {
  specs: SlideSpec[]
  imageUrls: string[]
  brand: ReelBrand
  postDate: string
  city: string
  audioUrl?: string | null
}
