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

export type SocialItemType = 'event' | 'release' | 'deal'

export type SocialPost = {
  id: string
  created_at: string
  updated_at: string
  format: string
  city: string | null
  post_date: string
  status: SocialPostStatus
  caption: string | null
  image_urls: string[]
  slide_count: number
  used_llm: boolean
  permalink: string | null
  error: string | null
  approved_by: string | null
  approved_at: string | null
  published_at: string | null
  slide_specs: unknown[] | null
  reel_url: string | null
  reel_status: 'rendering' | 'ready' | 'failed' | 'published' | null
  reel_error: string | null
  reel_rendered_at: string | null
  reel_media_id: string | null
  reel_permalink: string | null
}

export type SocialBrewery = {
  id: string
  name: string
  image_url?: string | null
  location?: string | null
  Region?: string | null
}

export type SocialEventBase = {
  id: string
  title: string
  description: string | null
  start_time: string | null
  cost: number | null
  is_recurring: boolean | null
  breweries: SocialBrewery | SocialBrewery[] | null
}

export type SocialReleaseBase = {
  id: number
  beer_name: string
  description: string | null
  ABV: string | null
  Type: string | null
  release_date: string | null
  b1: SocialBrewery | SocialBrewery[] | null
  b2: SocialBrewery | SocialBrewery[] | null
  b3: SocialBrewery | SocialBrewery[] | null
}

export type SocialDealBase = {
  id: string
  title: string
  description: string | null
  day_of_week: string | null
  deal_date: string | null
  time_start: number | null
  time_end: number | null
  breweries: SocialBrewery | SocialBrewery[] | null
}

export type SocialPostItem = {
  id: string
  post_id: string
  item_type: SocialItemType
  event_id: string | null
  release_id: number | null
  deal_id: string | null
  position: number
  included: boolean
  featured: boolean
  short_description: string | null
  image_override_url: string | null
  title_override: string | null
  time_override: string | null
  brewery_override: string | null
  description_override: string | null
  events_base: SocialEventBase | null
  beer_releases_base: SocialReleaseBase | null
  happy_hour_deals: SocialDealBase | null
}

export type BrandColors = {
  primary: string
  primary_dark: string
  accent: string
  cream: string
  tan: string
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
  app_image_url: string | null
  reel_audio_url: string | null
  handle: string
  cta_text: string
  is_default: boolean
}

/** Fallback if no brewery regions are loaded yet. */
export const SOCIAL_CITIES_FALLBACK = ['Colorado Springs'] as const

export const IG_CAPTION_LIMIT = 2200
export const FEATURED_DESC_SUGGEST = 300
export const SHORT_DESC_LIMIT = 64
/** Cover + 2 promo ads leave 7 item slots in a 10-slide Instagram carousel. */
export const MAX_FEATURED = 7
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024
export const APP_MOCKUP_MAX_BYTES = 1024 * 1024

export const ITEMS_SELECT = `*,
    events_base(id, title, description, start_time, cost, is_recurring, breweries(*)),
    beer_releases_base(id, beer_name, description, "ABV", "Type", release_date,
      b1:breweries!beer_releases_brewery_id_fkey(*),
      b2:breweries!beer_releases_brewery_id2_fkey(*),
      b3:breweries!beer_releases_brewery_id3_fkey(*)),
    happy_hour_deals(id, title, description, day_of_week, deal_date, time_start, time_end, breweries(*))`

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

export const ITEM_TYPE_LABEL: Record<SocialItemType, string> = {
  event: 'Event',
  release: 'Release',
  deal: 'Happy hour',
}

export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#5D2525',
  primary_dark: '#3A1515',
  accent: '#F8C701',
  cream: '#F9F7F2',
  tan: '#E5DFD6',
  charcoal: '#1A1A1A',
  text_primary: '#2D2926',
  text_secondary: '#665E5A',
  border: '#E5DFD6',
}

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

function formatHourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  if (h < 12) return `${h} AM`
  return `${h - 12} PM`
}

/**
 * Happy-hour window from whole hours 0–23.
 * e.g. "4–6 PM", "10 AM–2 PM", "After 8 PM", "Until 6 PM", "All day"
 */
export function formatSocialDealWindow(
  timeStart: number | null | undefined,
  timeEnd: number | null | undefined
): string {
  if (timeStart == null && timeEnd == null) return 'All day'
  if (timeStart != null && timeEnd == null) return `After ${formatHourLabel(timeStart)}`
  if (timeStart == null && timeEnd != null) return `Until ${formatHourLabel(timeEnd)}`

  const start = timeStart!
  const end = timeEnd!
  const startPeriod = start >= 12 ? 'PM' : 'AM'
  const endPeriod = end >= 12 ? 'PM' : 'AM'
  const startH = start % 12 || 12
  const endH = end % 12 || 12
  if (startPeriod === endPeriod) return `${startH}–${endH} ${endPeriod}`
  return `${startH} ${startPeriod}–${endH} ${endPeriod}`
}

export function formatCost(cost: number | null | undefined): string {
  if (cost == null || cost <= 0) return ''
  return Number.isInteger(cost) ? `$${cost}` : `$${cost.toFixed(2)}`
}

/** Normalize ABV for display; add "%" when the value is a bare number. */
export function formatAbv(abv: string | null | undefined): string {
  if (!abv?.trim()) return ''
  const t = abv.trim()
  if (/%/.test(t)) return t
  if (/^\d+(\.\d+)?$/.test(t)) return `${t}%`
  return t
}

function asBrewery(
  value: SocialBrewery | SocialBrewery[] | null | undefined
): SocialBrewery | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export function breweryDisplayName(brewery: SocialBrewery | null | undefined): string {
  return (brewery?.name || '').trim()
}

export function itemTypeOf(item: SocialPostItem): SocialItemType {
  if (item.item_type === 'release' || item.item_type === 'deal' || item.item_type === 'event') {
    return item.item_type
  }
  if (item.release_id != null) return 'release'
  if (item.deal_id != null) return 'deal'
  return 'event'
}

export function primaryBrewery(item: SocialPostItem): SocialBrewery | null {
  const type = itemTypeOf(item)
  if (type === 'event') return asBrewery(item.events_base?.breweries)
  if (type === 'deal') return asBrewery(item.happy_hour_deals?.breweries)
  const release = item.beer_releases_base
  return (
    asBrewery(release?.b1) || asBrewery(release?.b2) || asBrewery(release?.b3) || null
  )
}

export function releaseBreweriesLine(release: SocialReleaseBase | null): string {
  if (!release) return ''
  return [asBrewery(release.b1), asBrewery(release.b2), asBrewery(release.b3)]
    .map((b) => breweryDisplayName(b))
    .filter(Boolean)
    .join(' × ')
}

/** "Hazy IPA · 6.8% ABV" */
export function formatReleaseMeta(release: SocialReleaseBase | null): string {
  if (!release) return ''
  const type = release.Type?.trim() || ''
  const abvRaw = formatAbv(release.ABV)
  const abv = abvRaw ? ( /ABV/i.test(abvRaw) ? abvRaw : `${abvRaw} ABV`) : ''
  if (type && abv) return `${type} · ${abv}`
  return type || abv
}

export function itemTitle(item: SocialPostItem): string {
  if (item.title_override?.trim()) return item.title_override.trim()
  const type = itemTypeOf(item)
  if (type === 'release') return item.beer_releases_base?.beer_name || ''
  if (type === 'deal') return item.happy_hour_deals?.title || ''
  return item.events_base?.title || ''
}

export function itemTimeLabel(item: SocialPostItem): string {
  if (item.time_override?.trim()) return item.time_override.trim()
  const type = itemTypeOf(item)
  if (type === 'release') return 'New'
  if (type === 'deal') {
    return formatSocialDealWindow(
      item.happy_hour_deals?.time_start,
      item.happy_hour_deals?.time_end
    )
  }
  return formatSocialTime(item.events_base?.start_time) || 'All day'
}

export function itemSecondLine(item: SocialPostItem): string {
  if (item.brewery_override?.trim()) {
    if (itemTypeOf(item) === 'release') {
      const meta = formatReleaseMeta(item.beer_releases_base)
      return meta ? `${item.brewery_override.trim()} · ${meta}` : item.brewery_override.trim()
    }
    return item.brewery_override.trim()
  }
  const type = itemTypeOf(item)
  if (type === 'release') {
    const names = releaseBreweriesLine(item.beer_releases_base)
    const meta = formatReleaseMeta(item.beer_releases_base)
    if (names && meta) return `${names} · ${meta}`
    return names || meta
  }
  if (type === 'deal') return breweryDisplayName(asBrewery(item.happy_hour_deals?.breweries))
  return breweryDisplayName(asBrewery(item.events_base?.breweries))
}

export function itemCostBadge(item: SocialPostItem): string {
  if (itemTypeOf(item) !== 'event') return ''
  return formatCost(item.events_base?.cost)
}

export function itemOriginalDescription(item: SocialPostItem): string {
  const type = itemTypeOf(item)
  if (type === 'release') return item.beer_releases_base?.description?.trim() || ''
  if (type === 'deal') return item.happy_hour_deals?.description?.trim() || ''
  return item.events_base?.description?.trim() || ''
}

export function itemDescription(item: SocialPostItem): string {
  return item.description_override?.trim() || itemOriginalDescription(item)
}

/** Placeholder for title / time / brewery override inputs. */
export function itemTitlePlaceholder(item: SocialPostItem): string {
  const type = itemTypeOf(item)
  if (type === 'release') return item.beer_releases_base?.beer_name || ''
  if (type === 'deal') return item.happy_hour_deals?.title || ''
  return item.events_base?.title || ''
}

export function itemTimePlaceholder(item: SocialPostItem): string {
  const type = itemTypeOf(item)
  if (type === 'release') return 'New'
  if (type === 'deal') {
    return formatSocialDealWindow(
      item.happy_hour_deals?.time_start,
      item.happy_hour_deals?.time_end
    )
  }
  return formatSocialTime(item.events_base?.start_time) || 'All day'
}

export function itemBreweryPlaceholder(item: SocialPostItem): string {
  const type = itemTypeOf(item)
  if (type === 'release') return releaseBreweriesLine(item.beer_releases_base)
  if (type === 'deal') return breweryDisplayName(asBrewery(item.happy_hour_deals?.breweries))
  return breweryDisplayName(asBrewery(item.events_base?.breweries))
}

export function featuredPhotoUrl(item: SocialPostItem): string | null {
  if (item.image_override_url?.trim()) return item.image_override_url.trim()
  return primaryBrewery(item)?.image_url?.trim() || null
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

export function buildDraftToastMessage(result: {
  found?: { events?: number; releases?: number; deals?: number }
  included?: number
}): string {
  const events = result.found?.events ?? 0
  const releases = result.found?.releases ?? 0
  const deals = result.found?.deals ?? 0
  const included = result.included ?? 0
  return `${events} events · ${releases} releases · ${deals} happy hours (${included} included)`
}
