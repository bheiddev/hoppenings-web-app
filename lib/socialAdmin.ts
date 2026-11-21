/** Types + helpers for the admin Social (Instagram) tab. */

export type SocialPostStatus =
  | 'draft'
  | 'rendering'
  | 'pending_review'
  | 'approved'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'skipped'

export type SocialPost = {
  id: string
  created_at: string
  updated_at: string
  format: string
  city: string | null
  post_date: string
  status: SocialPostStatus
  caption: string | null
  cover_line: string | null
  highlight_event_ids: string[]
  image_urls: string[]
  slide_count: number
  used_llm: boolean
  permalink: string | null
  error: string | null
  approved_by: string | null
  approved_at: string | null
  published_at: string | null
}

export type SocialBrewery = {
  id: string
  name: string
  display_name?: string | null
  image_url?: string | null
  location?: string | null
  Region?: string | null
}

export type SocialEventBase = {
  id: string
  title: string
  description: string | null
  start_time: string | null
  end_time: string | null
  cost: number | null
  event_date: string | null
  is_recurring: boolean | null
  breweries: SocialBrewery | SocialBrewery[] | null
}

export type SocialPostItem = {
  id: string
  post_id: string
  event_id: string
  position: number
  included: boolean
  image_override_url: string | null
  title_override: string | null
  time_override: string | null
  brewery_override: string | null
  description_override: string | null
  events_base: SocialEventBase | null
}

export type BrandColors = {
  primary: string
  primary_dark: string
  accent: string
  cream: string
  charcoal: string
  text_primary: string
  text_secondary: string
  border: string
}

export type BrandFonts = {
  display?: string | null
  body_400?: string | null
  body_600?: string | null
  body_700?: string | null
}

export type BrandProfile = {
  id: string
  slug: string
  name: string
  colors: BrandColors
  fonts: BrandFonts
  logo_url: string | null
  logo_light_url: string | null
  handle: string
  cta_text: string
  is_default: boolean
}

export const SOCIAL_CITIES = ['Colorado Springs'] as const

export const IG_CAPTION_LIMIT = 2200
export const FEATURED_DESC_SLIDE_LIMIT = 170
export const MAX_FEATURED = 2
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024

export const STATUS_BADGE: Record<
  SocialPostStatus,
  { bg: string; fg: string; label: string }
> = {
  draft: { bg: '#E5DFD6', fg: '#2D2926', label: 'Draft' },
  rendering: { bg: '#FFF3CD', fg: '#856404', label: 'Rendering' },
  pending_review: { bg: '#D1ECF1', fg: '#0C5460', label: 'Pending review' },
  approved: { bg: '#D4EDDA', fg: '#155724', label: 'Approved' },
  publishing: { bg: '#FFF3CD', fg: '#856404', label: 'Publishing' },
  published: { bg: '#2D5A27', fg: '#FFFFFF', label: 'Published' },
  failed: { bg: '#F8D7DA', fg: '#721C24', label: 'Failed' },
  skipped: { bg: '#E2E3E5', fg: '#383D41', label: 'Skipped' },
}

export const PIPELINE_STEPS = [
  { key: 'draft', label: 'Draft', statuses: ['draft', 'rendering'] },
  {
    key: 'rendered',
    label: 'Rendered',
    statuses: ['pending_review', 'failed'],
  },
  { key: 'approved', label: 'Approved', statuses: ['approved', 'publishing'] },
  { key: 'published', label: 'Published', statuses: ['published'] },
] as const

/** YYYY-MM-DD in America/Denver. */
export function denverToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** "6 PM" or "6:30 PM" from a HH:MM[:SS] string. */
export function formatSocialTime(time24: string | null | undefined): string {
  if (!time24) return ''
  const [h, m] = time24.split(':')
  const hour = parseInt(h, 10)
  if (Number.isNaN(hour)) return time24
  const minute = parseInt(m || '0', 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  if (minute === 0) return `${h12} ${period}`
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`
}

export function formatCost(cost: number | null | undefined): string {
  if (cost == null || cost <= 0) return ''
  return Number.isInteger(cost) ? `$${cost}` : `$${cost.toFixed(2)}`
}

export function breweryFromEvent(event: SocialEventBase | null): SocialBrewery | null {
  if (!event?.breweries) return null
  return Array.isArray(event.breweries) ? event.breweries[0] ?? null : event.breweries
}

export function breweryDisplayName(brewery: SocialBrewery | null | undefined): string {
  if (!brewery) return ''
  return (brewery.display_name?.trim() || brewery.name || '').trim()
}

export function itemTitle(item: SocialPostItem): string {
  return item.title_override?.trim() || item.events_base?.title || ''
}

export function itemTime(item: SocialPostItem): string {
  return item.time_override?.trim() || formatSocialTime(item.events_base?.start_time)
}

export function itemBrewery(item: SocialPostItem): string {
  return (
    item.brewery_override?.trim() ||
    breweryDisplayName(breweryFromEvent(item.events_base))
  )
}

export function itemDescription(item: SocialPostItem): string {
  return (
    item.description_override?.trim() ||
    item.events_base?.description?.trim() ||
    ''
  )
}

export function featuredPhotoUrl(item: SocialPostItem): string | null {
  if (item.image_override_url?.trim()) return item.image_override_url.trim()
  const brewery = breweryFromEvent(item.events_base)
  return brewery?.image_url?.trim() || null
}

export function pipelineStepIndex(status: SocialPostStatus): number {
  if (status === 'skipped') return -1
  for (let i = 0; i < PIPELINE_STEPS.length; i++) {
    if ((PIPELINE_STEPS[i].statuses as readonly string[]).includes(status)) return i
  }
  return 0
}

export function functionErrorMessage(data: unknown, error: { message?: string } | null): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const e = (data as { error: unknown }).error
    if (typeof e === 'string' && e.trim()) return e
  }
  return error?.message || 'Request failed'
}

export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#5D2525',
  primary_dark: '#3A1515',
  accent: '#F8C701',
  cream: '#F9F7F2',
  charcoal: '#1A1A1A',
  text_primary: '#2D2926',
  text_secondary: '#665E5A',
  border: '#E5DFD6',
}
