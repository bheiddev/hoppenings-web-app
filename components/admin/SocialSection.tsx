'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Colors } from '@/lib/colors'
import { AdminButton, AdminSpinner } from '@/components/breweriesEventsAdminButtons'
import { useAuth } from '@/components/auth/AuthProvider'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import {
  listBreweryFolderImages,
  uploadBreweryImageForSocial,
} from '@/app/admin/actions'
import {
  APP_MOCKUP_MAX_BYTES,
  DEFAULT_BRAND_COLORS,
  FEATURED_DESC_SUGGEST,
  IG_CAPTION_LIMIT,
  ITEMS_SELECT,
  ITEM_TYPE_LABEL,
  MAX_FEATURED,
  MAX_UPLOAD_BYTES,
  PIPELINE_STEPS,
  SHORT_DESC_LIMIT,
  SOCIAL_CITIES_FALLBACK,
  STATUS_BADGE,
  buildDraftToastMessage,
  denverToday,
  featuredPhotoUrl,
  functionErrorMessage,
  itemBreweryPlaceholder,
  itemCostBadge,
  itemDescription,
  itemOriginalDescription,
  itemSecondLine,
  itemTimeLabel,
  itemTimePlaceholder,
  itemTitle,
  itemTitlePlaceholder,
  itemTypeOf,
  pipelineStepIndex,
  primaryBrewery,
  type BrandColors,
  type BrandFonts,
  type BrandProfile,
  type SocialItemType,
  type SocialPost,
  type SocialPostItem,
  type SocialPostStatus,
} from '@/lib/socialAdmin'
import { SocialToasts, type SocialToast } from '@/components/admin/social/SocialToasts'
import { PostReelPanel } from '@/components/admin/social/PostReelPanel'

const inputStyle = {
  borderColor: Colors.dividerLight,
  color: Colors.textDark,
  backgroundColor: Colors.surface,
} as const

function normalizePost(row: Record<string, unknown>): SocialPost {
  return {
    id: String(row.id),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    format: String(row.format ?? 'daily'),
    city: (row.city as string | null) ?? null,
    post_date: String(row.post_date ?? ''),
    status: (row.status as SocialPostStatus) || 'draft',
    caption: (row.caption as string | null) ?? null,
    image_urls: Array.isArray(row.image_urls) ? (row.image_urls as string[]) : [],
    slide_count: Number(row.slide_count ?? 0),
    used_llm: Boolean(row.used_llm),
    permalink: (row.permalink as string | null) ?? null,
    error: (row.error as string | null) ?? null,
    approved_by: (row.approved_by as string | null) ?? null,
    approved_at: (row.approved_at as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    slide_specs: Array.isArray(row.slide_specs) ? (row.slide_specs as unknown[]) : null,
    reel_url: (row.reel_url as string | null) ?? null,
    reel_status:
      (row.reel_status as SocialPost['reel_status']) ?? null,
    reel_error: (row.reel_error as string | null) ?? null,
    reel_rendered_at: (row.reel_rendered_at as string | null) ?? null,
    reel_media_id: (row.reel_media_id as string | null) ?? null,
    reel_permalink: (row.reel_permalink as string | null) ?? null,
  }
}

function normalizeItem(row: Record<string, unknown>): SocialPostItem {
  const itemType = (row.item_type as SocialItemType) || 'event'
  return {
    id: String(row.id),
    post_id: String(row.post_id),
    item_type: itemType,
    event_id: (row.event_id as string | null) ?? null,
    release_id: row.release_id == null ? null : Number(row.release_id),
    deal_id: (row.deal_id as string | null) ?? null,
    position: Number(row.position ?? 0),
    included: row.included !== false,
    featured: Boolean(row.featured),
    short_description: (row.short_description as string | null) ?? null,
    image_override_url: (row.image_override_url as string | null) ?? null,
    title_override: (row.title_override as string | null) ?? null,
    time_override: (row.time_override as string | null) ?? null,
    brewery_override: (row.brewery_override as string | null) ?? null,
    description_override: (row.description_override as string | null) ?? null,
    events_base: (row.events_base as SocialPostItem['events_base']) ?? null,
    beer_releases_base:
      (row.beer_releases_base as SocialPostItem['beer_releases_base']) ?? null,
    happy_hour_deals: (row.happy_hour_deals as SocialPostItem['happy_hour_deals']) ?? null,
  }
}

function normalizeBrand(row: Record<string, unknown>): BrandProfile {
  return {
    id: String(row.id),
    slug: String(row.slug ?? 'hoppenings'),
    name: String(row.name ?? 'Hoppenings'),
    colors: { ...DEFAULT_BRAND_COLORS, ...((row.colors as Partial<BrandColors>) || {}) },
    fonts: ((row.fonts as BrandFonts) || {}) as BrandFonts,
    logo_url: (row.logo_url as string | null) ?? null,
    logo_light_url: (row.logo_light_url as string | null) ?? null,
    app_image_url: (row.app_image_url as string | null) ?? null,
    reel_audio_url: (row.reel_audio_url as string | null) ?? null,
    handle: String(row.handle ?? '@hoppenings'),
    cta_text: String(row.cta_text ?? 'Get the app · Link in bio'),
    is_default: Boolean(row.is_default),
  }
}

function sectionItems(items: SocialPostItem[], type: SocialItemType) {
  const ofType = items.filter((i) => itemTypeOf(i) === type)
  const included = ofType
    .filter((i) => i.included)
    .sort((a, b) => a.position - b.position)
  const excluded = ofType
    .filter((i) => !i.included)
    .sort((a, b) => a.position - b.position)
  return { ofType, included, excluded, ordered: [...included, ...excluded] }
}

export function SocialSection({ cities = [] }: { cities?: string[] }) {
  const { user } = useAuth()
  const cityOptions = useMemo(() => {
    const cleaned = cities.map((c) => c.trim()).filter(Boolean)
    return cleaned.length > 0 ? cleaned : [...SOCIAL_CITIES_FALLBACK]
  }, [cities])
  const defaultCity =
    cityOptions.find((c) => c.localeCompare('Colorado Springs', undefined, { sensitivity: 'base' }) === 0) ??
    cityOptions[0]

  const [posts, setPosts] = useState<SocialPost[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [localItems, setLocalItems] = useState<SocialPostItem[]>([])
  const [brand, setBrand] = useState<BrandProfile | null>(null)

  const [draftDate, setDraftDate] = useState(denverToday)
  const [draftCity, setDraftCity] = useState(defaultCity)
  const [useLlm, setUseLlm] = useState(true)

  useEffect(() => {
    if (!cityOptions.includes(draftCity)) {
      setDraftCity(defaultCity)
    }
  }, [cityOptions, defaultCity, draftCity])

  const [caption, setCaption] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const [slidesStale, setSlidesStale] = useState(false)
  const [itemsDirty, setItemsDirty] = useState(false)
  const [captionDirty, setCaptionDirty] = useState(false)

  const [building, setBuilding] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savingCaption, setSavingCaption] = useState(false)
  const [savingItems, setSavingItems] = useState(false)
  const [approving, setApproving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [savingBrand, setSavingBrand] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [publishConfirm, setPublishConfirm] = useState(false)
  const [photoPickerItemId, setPhotoPickerItemId] = useState<string | null>(null)
  const [brandOpen, setBrandOpen] = useState(false)
  const [toasts, setToasts] = useState<SocialToast[]>([])
  const toastSeq = useRef(0)

  const selected = useMemo(
    () => posts.find((p) => p.id === selectedId) ?? null,
    [posts, selectedId]
  )

  const toast = useCallback((kind: SocialToast['kind'], message: string) => {
    const id = `t-${++toastSeq.current}`
    setToasts((prev) => [...prev, { id, kind, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 7000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const refreshPosts = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    if (error) {
      toast('error', error.message)
      setLoadingPosts(false)
      return
    }
    setPosts((data ?? []).map((r) => normalizePost(r as Record<string, unknown>)))
    setLoadingPosts(false)
  }, [toast])

  const loadBrand = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('slug', 'hoppenings')
      .maybeSingle()
    if (error) {
      toast('error', error.message)
      return
    }
    if (data) setBrand(normalizeBrand(data as Record<string, unknown>))
  }, [toast])

  const loadItems = useCallback(
    async (postId: string) => {
      setLoadingDetail(true)
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase
        .from('social_post_items')
        .select(ITEMS_SELECT)
        .eq('post_id', postId)
        .order('position')
      if (error) {
        toast('error', error.message)
        setLocalItems([])
        setLoadingDetail(false)
        return
      }
      setLocalItems((data ?? []).map((r) => normalizeItem(r as Record<string, unknown>)))
      setItemsDirty(false)
      setLoadingDetail(false)
    },
    [toast]
  )

  const selectPost = useCallback(
    async (post: SocialPost) => {
      setSelectedId(post.id)
      setCaption(post.caption ?? '')
      setCaptionDirty(false)
      setSlidesStale(false)
      setEditingItemId(null)
      setPublishConfirm(false)
      await loadItems(post.id)
    },
    [loadItems]
  )

  useEffect(() => {
    void refreshPosts()
    void loadBrand()
  }, [refreshPosts, loadBrand])

  useEffect(() => {
    if (!selectedId || captionDirty) return
    const post = posts.find((p) => p.id === selectedId)
    if (post) setCaption(post.caption ?? '')
  }, [posts, selectedId, captionDirty])

  const needsPoll = posts.some((p) => p.status === 'rendering' || p.status === 'publishing')
  useEffect(() => {
    if (!needsPoll) return
    const id = window.setInterval(() => {
      void refreshPosts()
    }, 3000)
    return () => window.clearInterval(id)
  }, [needsPoll, refreshPosts])

  async function invokeAndRefresh(
    name: string,
    body: Record<string, unknown>
  ): Promise<{ data: unknown; errorMsg: string | null }> {
    const supabase = getSupabaseBrowser()
    const { data, error } = await supabase.functions.invoke(name, { body })
    const errMsg = functionErrorMessage(data, error)
    if (error || (data && typeof data === 'object' && 'error' in (data as object))) {
      toast('error', errMsg)
      await refreshPosts()
      if (selectedId) await loadItems(selectedId)
      return { data, errorMsg: errMsg }
    }
    await refreshPosts()
    return { data, errorMsg: null }
  }

  async function handleBuildDraft() {
    if (building) return
    setBuilding(true)
    try {
      const { data, errorMsg } = await invokeAndRefresh('build-draft', {
        date: draftDate,
        city: draftCity,
        use_llm: useLlm,
      })
      if (errorMsg) return
      const result = data as {
        post_id?: string
        found?: { events?: number; releases?: number; deals?: number }
        included?: number
        warning?: string
      }
      toast('success', buildDraftToastMessage(result))
      if (result.warning) toast('warning', result.warning)
      await refreshPosts()
      if (result.post_id) {
        const supabase = getSupabaseBrowser()
        const { data: postRow } = await supabase
          .from('social_posts')
          .select('*')
          .eq('id', result.post_id)
          .maybeSingle()
        if (postRow) {
          await selectPost(normalizePost(postRow as Record<string, unknown>))
        } else {
          setSelectedId(result.post_id)
          await loadItems(result.post_id)
        }
      }
    } finally {
      setBuilding(false)
    }
  }

  async function saveCaption() {
    if (!selected || savingCaption) return
    setSavingCaption(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase
        .from('social_posts')
        .update({ caption })
        .eq('id', selected.id)
      if (error) {
        toast('error', error.message)
        return
      }
      setCaptionDirty(false)
      toast('success', 'Caption saved')
      await refreshPosts()
    } finally {
      setSavingCaption(false)
    }
  }

  async function saveItems() {
    if (!selected || savingItems) return false
    setSavingItems(true)
    try {
      const supabase = getSupabaseBrowser()
      for (const item of localItems) {
        const { error } = await supabase
          .from('social_post_items')
          .update({
            position: item.position,
            included: item.included,
            featured: item.featured,
            short_description: item.short_description,
            title_override: item.title_override,
            time_override: item.time_override,
            brewery_override: item.brewery_override,
            description_override: item.description_override,
            image_override_url: item.image_override_url,
          })
          .eq('id', item.id)
        if (error) {
          toast('error', error.message)
          return false
        }
      }
      setItemsDirty(false)
      setSlidesStale(true)
      toast('success', 'Items saved')
      await refreshPosts()
      return true
    } finally {
      setSavingItems(false)
    }
  }

  async function saveUnsavedEdits() {
    if (!selected) return true
    if (captionDirty) {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase
        .from('social_posts')
        .update({ caption })
        .eq('id', selected.id)
      if (error) {
        toast('error', error.message)
        return false
      }
      setCaptionDirty(false)
    }
    if (itemsDirty) {
      const ok = await saveItems()
      if (!ok) return false
    }
    return true
  }

  async function handleRender() {
    if (!selected || rendering) return
    if (['publishing', 'published'].includes(selected.status)) return
    setRendering(true)
    try {
      const ok = await saveUnsavedEdits()
      if (!ok) return
      const { data, errorMsg } = await invokeAndRefresh('render-post', {
        post_id: selected.id,
      })
      if (errorMsg) return
      const result = data as { warning?: string; slide_count?: number }
      setSlidesStale(false)
      toast('success', `Rendered ${result.slide_count ?? ''} slides`.trim())
      if (result.warning) toast('warning', result.warning)
      await loadItems(selected.id)
    } finally {
      setRendering(false)
    }
  }

  async function handleApprove() {
    if (!selected || approving || selected.status !== 'pending_review') return
    setApproving(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase
        .from('social_posts')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id ?? null,
        })
        .eq('id', selected.id)
      if (error) {
        toast('error', error.message)
        return
      }
      toast('success', 'Approved')
      await refreshPosts()
    } finally {
      setApproving(false)
    }
  }

  async function handlePublish() {
    if (!selected || publishing) return
    setPublishing(true)
    try {
      const { errorMsg } = await invokeAndRefresh('publish-post', {
        post_id: selected.id,
      })
      if (errorMsg) return
      toast('success', 'Published to Instagram')
      setPublishConfirm(false)
      await refreshPosts()
    } finally {
      setPublishing(false)
    }
  }

  async function handleSkip() {
    if (!selected || skipping || selected.status === 'published') return
    setSkipping(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase
        .from('social_posts')
        .update({ status: 'skipped' })
        .eq('id', selected.id)
      if (error) {
        toast('error', error.message)
        return
      }
      toast('info', 'Post skipped')
      await refreshPosts()
    } finally {
      setSkipping(false)
    }
  }

  async function handleDelete() {
    if (!selected || deleting || selected.status === 'published') return
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    setDeleting(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.from('social_posts').delete().eq('id', selected.id)
      if (error) {
        toast('error', error.message)
        return
      }
      toast('info', 'Post deleted')
      setSelectedId(null)
      setLocalItems([])
      await refreshPosts()
    } finally {
      setDeleting(false)
    }
  }

  function markItemsDirty(next: SocialPostItem[]) {
    setLocalItems(next)
    setItemsDirty(true)
    setSlidesStale(true)
  }

  function moveItemWithinType(id: string, dir: -1 | 1) {
    const item = localItems.find((i) => i.id === id)
    if (!item) return
    const type = itemTypeOf(item)
    const peers = localItems
      .filter((i) => itemTypeOf(i) === type)
      .sort((a, b) => a.position - b.position)
    const idx = peers.findIndex((i) => i.id === id)
    const swap = idx + dir
    if (idx < 0 || swap < 0 || swap >= peers.length) return
    const a = peers[idx]
    const b = peers[swap]
    markItemsDirty(
      localItems.map((row) => {
        if (row.id === a.id) return { ...row, position: b.position }
        if (row.id === b.id) return { ...row, position: a.position }
        return row
      })
    )
  }

  function toggleIncluded(id: string) {
    markItemsDirty(
      localItems.map((i) => (i.id === id ? { ...i, included: !i.included } : i))
    )
  }

  function toggleFeatured(id: string) {
    const item = localItems.find((i) => i.id === id)
    if (!item) return
    if (item.featured) {
      markItemsDirty(localItems.map((i) => (i.id === id ? { ...i, featured: false } : i)))
      return
    }
    const featuredCount = localItems.filter((i) => i.featured).length
    if (featuredCount >= MAX_FEATURED) {
      toast('warning', 'Only 5 featured items; unstar one first')
      return
    }
    markItemsDirty(localItems.map((i) => (i.id === id ? { ...i, featured: true } : i)))
  }

  function updateItem(
    id: string,
    patch: Partial<
      Pick<
        SocialPostItem,
        | 'title_override'
        | 'time_override'
        | 'brewery_override'
        | 'description_override'
        | 'short_description'
        | 'image_override_url'
      >
    >
  ) {
    markItemsDirty(localItems.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  const isPublished = selected?.status === 'published'
  const hasUnsaved = captionDirty || itemsDirty
  const canRender =
    !!selected && !['publishing', 'published'].includes(selected.status) && !rendering
  const canApprove = selected?.status === 'pending_review' && !approving
  const canPublish =
    !!selected &&
    ['pending_review', 'approved', 'failed'].includes(selected.status) &&
    (selected.image_urls?.length ?? 0) > 0 &&
    !hasUnsaved &&
    !publishing
  const canSkip = !!selected && selected.status !== 'published' && !skipping
  const canDelete = !!selected && selected.status !== 'published' && !deleting

  const featuredItems = useMemo(
    () => localItems.filter((i) => i.featured).sort((a, b) => a.position - b.position),
    [localItems]
  )

  const releases = useMemo(() => sectionItems(localItems, 'release'), [localItems])
  const events = useMemo(() => sectionItems(localItems, 'event'), [localItems])
  const deals = useMemo(() => sectionItems(localItems, 'deal'), [localItems])

  const stepIdx = selected ? pipelineStepIndex(selected.status) : -1

  return (
    <section className="space-y-6">
      <SocialToasts toasts={toasts} onDismiss={dismissToast} />

      <div>
        <h2
          className="text-2xl font-bold"
          style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Social
        </h2>
        <p className="mt-1 text-sm max-w-3xl" style={{ color: Colors.textSecondary }}>
          Build an Instagram carousel from the day&apos;s events, beer releases, and happy hours,
          then review and publish to @hoppenings.
        </p>
      </div>

      <div
        className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
      >
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: Colors.textSecondary }}>
            Date
          </label>
          <input
            type="date"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: Colors.textSecondary }}>
            City
          </label>
          <select
            value={draftCity}
            onChange={(e) => setDraftCity(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
            style={inputStyle}
          >
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm pb-2" style={{ color: Colors.textDark }}>
          <input type="checkbox" checked={useLlm} onChange={(e) => setUseLlm(e.target.checked)} />
          Use AI curation
        </label>
        <AdminButton variant="save" loading={building} disabled={building} onClick={handleBuildDraft}>
          Build draft
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
        >
          <div
            className="px-3 py-2 text-sm font-semibold border-b"
            style={{
              borderColor: Colors.dividerLight,
              backgroundColor: Colors.surfaceLight,
              color: Colors.textDark,
              fontFamily: 'var(--font-fjalla-one)',
            }}
          >
            Recent posts
          </div>
          {loadingPosts ? (
            <div className="p-4 flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
              <AdminSpinner /> Loading…
            </div>
          ) : posts.length === 0 ? (
            <p className="p-4 text-sm" style={{ color: Colors.textSecondary }}>
              No posts yet. Build a draft to start.
            </p>
          ) : (
            <ul className="max-h-[720px] overflow-y-auto divide-y" style={{ borderColor: Colors.dividerLight }}>
              {posts.map((p) => {
                const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.draft
                const selectedRow = p.id === selectedId
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => void selectPost(p)}
                      className="w-full text-left px-3 py-2.5 hover:opacity-90 transition-opacity"
                      style={{
                        backgroundColor: selectedRow ? Colors.surfaceLight : Colors.surface,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold" style={{ color: Colors.textDark }}>
                          {p.post_date}
                        </span>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: badge.bg, color: badge.fg }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div
                        className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs"
                        style={{ color: Colors.textSecondary }}
                      >
                        <span>{p.city || '—'}</span>
                        <span>·</span>
                        <span>{p.slide_count || 0} slides</span>
                        {p.used_llm ? (
                          <span
                            className="px-1 rounded text-[10px] font-semibold"
                            style={{ backgroundColor: Colors.accent, color: Colors.textDark }}
                          >
                            AI
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: Colors.textMuted }}>
                        {p.created_at
                          ? new Date(p.created_at).toLocaleString('en-US', {
                              timeZone: 'America/Denver',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : ''}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div
          className="rounded-lg border p-4 space-y-5 min-h-[320px]"
          style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
        >
          {!selected ? (
            <p className="text-sm" style={{ color: Colors.textSecondary }}>
              Select a post to review and edit.
            </p>
          ) : loadingDetail ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
              <AdminSpinner /> Loading post…
            </div>
          ) : (
            <>
              {selected.error ? (
                <div
                  className="rounded border px-3 py-2 text-sm"
                  style={{ borderColor: Colors.error, backgroundColor: '#FEE2E2', color: Colors.error }}
                >
                  {selected.error}
                </div>
              ) : null}

              {slidesStale && selected.status !== 'published' ? (
                <div
                  className="rounded border px-3 py-2 text-sm"
                  style={{
                    borderColor: Colors.warning,
                    backgroundColor: '#FFF8E7',
                    color: '#856404',
                  }}
                >
                  Slides are out of date. Re-render to see changes.
                </div>
              ) : null}

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: (STATUS_BADGE[selected.status] ?? STATUS_BADGE.draft).bg,
                      color: (STATUS_BADGE[selected.status] ?? STATUS_BADGE.draft).fg,
                    }}
                  >
                    {(STATUS_BADGE[selected.status] ?? STATUS_BADGE.draft).label}
                  </span>
                  {selected.permalink ? (
                    <a
                      href={selected.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold underline"
                      style={{ color: Colors.primary }}
                    >
                      View on Instagram
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1">
                  {PIPELINE_STEPS.map((step, i) => {
                    const active = stepIdx === i
                    const done = stepIdx > i
                    return (
                      <div
                        key={step.key}
                        className="px-2.5 py-1 text-xs font-semibold rounded border"
                        style={{
                          borderColor: active || done ? Colors.primaryDark : Colors.dividerLight,
                          backgroundColor: active
                            ? Colors.primaryDark
                            : done
                              ? Colors.surfaceLight
                              : Colors.surface,
                          color: active ? Colors.onPrimary : Colors.textDark,
                        }}
                      >
                        {step.label}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Slides */}
              <div>
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  Slides
                </h3>
                {(selected.image_urls?.length ?? 0) === 0 ? (
                  <p className="text-sm" style={{ color: Colors.textMuted }}>
                    Not rendered yet
                  </p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selected.image_urls.map((url, i) => (
                      <button
                        key={`${url}-${i}`}
                        type="button"
                        onClick={() => setLightboxUrl(url)}
                        className="shrink-0 rounded border overflow-hidden"
                        style={{
                          width: 220,
                          aspectRatio: '4 / 5',
                          borderColor: Colors.dividerLight,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Slide ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <PostReelPanel
                post={selected}
                brand={brand}
                onPostUpdated={async () => {
                  await refreshPosts()
                }}
                toast={toast}
              />

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                  Caption
                </label>
                <textarea
                  value={caption}
                  disabled={isPublished}
                  onChange={(e) => {
                    setCaption(e.target.value)
                    setCaptionDirty(true)
                  }}
                  rows={5}
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={inputStyle}
                />
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span style={{ color: Colors.textMuted }}>
                    The first ~125 characters show before &apos;more&apos;.
                  </span>
                  <span
                    style={{
                      color: caption.length > IG_CAPTION_LIMIT ? Colors.error : Colors.textSecondary,
                    }}
                  >
                    {caption.length} / {IG_CAPTION_LIMIT}
                  </span>
                </div>
                {!isPublished ? (
                  <div className="mt-2">
                    <AdminButton
                      variant="save"
                      loading={savingCaption}
                      disabled={!captionDirty || savingCaption}
                      onClick={() => void saveCaption()}
                    >
                      Save caption
                    </AdminButton>
                  </div>
                ) : null}
              </div>

              {/* Featured */}
              <div>
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  Featured ({featuredItems.length} of {MAX_FEATURED})
                </h3>
                {featuredItems.length === 0 ? (
                  <p className="text-xs" style={{ color: Colors.textMuted }}>
                    Star up to {MAX_FEATURED} items below to give them their own slides after the cover.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {featuredItems.map((item) => {
                      const photo = featuredPhotoUrl(item)
                      const desc = item.description_override ?? ''
                      const type = itemTypeOf(item)
                      return (
                        <div
                          key={item.id}
                          className="flex flex-wrap gap-3 rounded border p-3"
                          style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surfaceLight }}
                        >
                          <div className="w-[120px] space-y-1">
                            <div
                              className="aspect-[4/5] rounded border overflow-hidden flex items-center justify-center text-[11px] text-center px-2"
                              style={{
                                borderColor: Colors.dividerLight,
                                backgroundColor: Colors.surface,
                                color: Colors.textMuted,
                              }}
                            >
                              {photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={photo} alt="" className="h-full w-full object-cover" />
                              ) : (
                                'No photo: text-only slide'
                              )}
                            </div>
                            {!isPublished ? (
                              <div className="flex flex-wrap gap-1">
                                <AdminButton
                                  variant="edit"
                                  onClick={() => setPhotoPickerItemId(item.id)}
                                >
                                  Change photo
                                </AdminButton>
                                {item.image_override_url ? (
                                  <button
                                    type="button"
                                    className="text-[11px] underline"
                                    style={{ color: Colors.textSecondary }}
                                    onClick={() =>
                                      updateItem(item.id, { image_override_url: null })
                                    }
                                  >
                                    Reset
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-[200px] space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: Colors.dividerLight, color: Colors.textDark }}
                              >
                                {ITEM_TYPE_LABEL[type]}
                              </span>
                              <span className="text-sm font-semibold" style={{ color: Colors.textDark }}>
                                {itemTitle(item)}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: Colors.textSecondary }}>
                              {itemSecondLine(item)}
                            </p>
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <label className="text-xs" style={{ color: Colors.textSecondary }}>
                                  Description (featured slide)
                                </label>
                                {item.description_override != null && !isPublished ? (
                                  <button
                                    type="button"
                                    className="text-[11px] underline"
                                    style={{ color: Colors.textMuted }}
                                    onClick={() =>
                                      updateItem(item.id, { description_override: null })
                                    }
                                  >
                                    reset
                                  </button>
                                ) : null}
                              </div>
                              <textarea
                                disabled={isPublished}
                                value={desc}
                                placeholder={itemOriginalDescription(item)}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    description_override: e.target.value.trim()
                                      ? e.target.value
                                      : null,
                                  })
                                }
                                rows={3}
                                className="w-full px-2 py-1.5 border rounded text-sm"
                                style={inputStyle}
                              />
                              <p
                                className="text-[11px] mt-0.5 text-right"
                                style={{
                                  color:
                                    (desc || itemDescription(item)).length > FEATURED_DESC_SUGGEST
                                      ? Colors.warning
                                      : Colors.textMuted,
                                }}
                              >
                                {(desc || itemDescription(item)).length} chars · suggest under ~
                                {FEATURED_DESC_SUGGEST}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Items sections */}
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
                  >
                    Items
                  </h3>
                  {!isPublished ? (
                    <AdminButton
                      variant="save"
                      loading={savingItems}
                      disabled={!itemsDirty || savingItems}
                      onClick={() => void saveItems()}
                    >
                      Save items
                    </AdminButton>
                  ) : null}
                </div>

                <ItemTypeSection
                  title="New releases"
                  section={releases}
                  isPublished={isPublished}
                  editingItemId={editingItemId}
                  setEditingItemId={setEditingItemId}
                  onMove={moveItemWithinType}
                  onToggleIncluded={toggleIncluded}
                  onToggleFeatured={toggleFeatured}
                  onUpdate={updateItem}
                />
                <ItemTypeSection
                  title="Events"
                  section={events}
                  isPublished={isPublished}
                  editingItemId={editingItemId}
                  setEditingItemId={setEditingItemId}
                  onMove={moveItemWithinType}
                  onToggleIncluded={toggleIncluded}
                  onToggleFeatured={toggleFeatured}
                  onUpdate={updateItem}
                />
                <ItemTypeSection
                  title="Happy hours"
                  section={deals}
                  isPublished={isPublished}
                  editingItemId={editingItemId}
                  setEditingItemId={setEditingItemId}
                  onMove={moveItemWithinType}
                  onToggleIncluded={toggleIncluded}
                  onToggleFeatured={toggleFeatured}
                  onUpdate={updateItem}
                />
              </div>

              <div
                className="flex flex-wrap gap-2 pt-2 border-t"
                style={{ borderColor: Colors.dividerLight }}
              >
                {!isPublished ? (
                  <>
                    <AdminButton
                      variant="add"
                      loading={rendering}
                      disabled={!canRender}
                      onClick={() => void handleRender()}
                    >
                      {(selected.image_urls?.length ?? 0) > 0 ? 'Re-render' : 'Render'}
                    </AdminButton>
                    <AdminButton
                      variant="accept"
                      loading={approving}
                      disabled={!canApprove}
                      onClick={() => void handleApprove()}
                    >
                      Approve
                    </AdminButton>
                    <AdminButton
                      variant="save"
                      loading={publishing}
                      disabled={!canPublish}
                      onClick={() => setPublishConfirm(true)}
                    >
                      Publish to Instagram
                    </AdminButton>
                    <AdminButton
                      variant="cancel"
                      loading={skipping}
                      disabled={!canSkip}
                      onClick={() => void handleSkip()}
                    >
                      Skip
                    </AdminButton>
                    <AdminButton
                      variant="delete"
                      loading={deleting}
                      disabled={!canDelete}
                      onClick={() => void handleDelete()}
                    >
                      Delete
                    </AdminButton>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: Colors.success }}>
                    Published
                    {selected.permalink ? (
                      <>
                        {' · '}
                        <a
                          href={selected.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-semibold"
                        >
                          View on Instagram
                        </a>
                      </>
                    ) : null}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <BrandSettingsPanel
        open={brandOpen}
        onToggle={() => setBrandOpen((o) => !o)}
        brand={brand}
        saving={savingBrand}
        onSave={async (next) => {
          if (!brand || savingBrand) return
          setSavingBrand(true)
          try {
            const supabase = getSupabaseBrowser()
            const { error } = await supabase
              .from('brand_profiles')
              .update({
                colors: next.colors,
                fonts: next.fonts,
                logo_url: next.logo_url,
                logo_light_url: next.logo_light_url,
                app_image_url: next.app_image_url,
                handle: next.handle,
                cta_text: next.cta_text,
              })
              .eq('id', brand.id)
            if (error) {
              toast('error', error.message)
              return
            }
            setBrand(next)
            toast('success', 'Brand settings saved')
          } finally {
            setSavingBrand(false)
          }
        }}
        toast={toast}
      />

      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: Colors.overlayDark }}
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Slide preview"
            className="max-h-[90vh] max-w-[90vw] rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}

      {publishConfirm && selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: Colors.overlayDark }}
          role="dialog"
          aria-modal
        >
          <div
            className="w-full max-w-md rounded-lg border p-4 space-y-3"
            style={{ backgroundColor: Colors.surface, borderColor: Colors.dividerLight }}
          >
            <h3
              className="text-lg font-bold"
              style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
            >
              Publish to Instagram?
            </h3>
            {selected.image_urls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.image_urls[0]}
                alt="First slide"
                className="w-40 aspect-[4/5] object-cover rounded border mx-auto"
                style={{ borderColor: Colors.dividerLight }}
              />
            ) : null}
            <p
              className="text-sm whitespace-pre-wrap max-h-40 overflow-y-auto"
              style={{ color: Colors.textDark }}
            >
              {caption || selected.caption || '(no caption)'}
            </p>
            <p className="text-sm font-medium" style={{ color: Colors.error }}>
              This posts publicly to @hoppenings and can&apos;t be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <AdminButton
                variant="cancel"
                disabled={publishing}
                onClick={() => setPublishConfirm(false)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="save"
                loading={publishing}
                disabled={publishing}
                onClick={() => void handlePublish()}
              >
                Publish
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}

      {(() => {
        const pickerItem = localItems.find((i) => i.id === photoPickerItemId)
        if (!pickerItem || !photoPickerItemId) return null
        return (
          <PhotoPickerModal
            item={pickerItem}
            onClose={() => setPhotoPickerItemId(null)}
            onPick={(url) => {
              updateItem(photoPickerItemId, { image_override_url: url })
              setPhotoPickerItemId(null)
            }}
            toast={toast}
          />
        )
      })()}
    </section>
  )
}

function ItemTypeSection({
  title,
  section,
  isPublished,
  editingItemId,
  setEditingItemId,
  onMove,
  onToggleIncluded,
  onToggleFeatured,
  onUpdate,
}: {
  title: string
  section: ReturnType<typeof sectionItems>
  isPublished: boolean
  editingItemId: string | null
  setEditingItemId: (id: string | null) => void
  onMove: (id: string, dir: -1 | 1) => void
  onToggleIncluded: (id: string) => void
  onToggleFeatured: (id: string) => void
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<
        SocialPostItem,
        | 'title_override'
        | 'time_override'
        | 'brewery_override'
        | 'short_description'
        | 'description_override'
      >
    >
  ) => void
}) {
  if (section.ofType.length === 0) return null
  const includedCount = section.included.length

  return (
    <div>
      <h4
        className="text-sm font-semibold mb-2"
        style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
      >
        {title} · {section.ofType.length} ({includedCount} included)
      </h4>
      <div className="overflow-x-auto rounded border" style={{ borderColor: Colors.dividerLight }}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr style={{ backgroundColor: Colors.surfaceLight }}>
              {['', 'Incl.', '★', 'Time', 'Title', 'Details', ''].map((h, i) => (
                <th
                  key={`${h}-${i}`}
                  className="px-2 py-2 font-semibold text-xs"
                  style={{ color: Colors.textDark }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.ordered.map((item) => {
              const editing = editingItemId === item.id
              const grey = !item.included
              const cost = itemCostBadge(item)
              const type = itemTypeOf(item)
              return (
                <tr
                  key={item.id}
                  className="border-t align-top"
                  style={{ borderColor: Colors.dividerLight, opacity: grey ? 0.55 : 1 }}
                >
                  <td className="px-2 py-2 whitespace-nowrap">
                    {!isPublished ? (
                      <div className="flex flex-col gap-0.5">
                        <button type="button" className="text-xs" onClick={() => onMove(item.id, -1)}>
                          ↑
                        </button>
                        <button type="button" className="text-xs" onClick={() => onMove(item.id, 1)}>
                          ↓
                        </button>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={item.included}
                      disabled={isPublished}
                      onChange={() => onToggleIncluded(item.id)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      disabled={isPublished}
                      onClick={() => onToggleFeatured(item.id)}
                      className="text-base leading-none"
                      style={{ color: item.featured ? Colors.accent : Colors.textMuted }}
                      aria-label={item.featured ? 'Unfeature' : 'Feature'}
                    >
                      ★
                    </button>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap" style={{ color: Colors.textDark }}>
                    {type === 'release' && !item.time_override ? (
                      <span
                        className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: Colors.accent, color: Colors.textDark }}
                      >
                        New
                      </span>
                    ) : (
                      itemTimeLabel(item)
                    )}
                  </td>
                  <td className="px-2 py-2" style={{ color: Colors.textDark }}>
                    <div className="font-medium">{itemTitle(item)}</div>
                  </td>
                  <td className="px-2 py-2" style={{ color: Colors.textSecondary }}>
                    <div>
                      {itemSecondLine(item)}
                      {cost ? (
                        <span
                          className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: Colors.surfaceLight, color: Colors.textDark }}
                        >
                          {cost}
                        </span>
                      ) : null}
                    </div>
                    {(type === 'event' || type === 'deal') && item.short_description ? (
                      <div className="text-xs mt-0.5" style={{ color: Colors.textMuted }}>
                        {item.short_description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">
                    {!isPublished ? (
                      <AdminButton
                        variant="edit"
                        onClick={() => setEditingItemId(editing ? null : item.id)}
                      >
                        {editing ? 'Close' : 'Edit'}
                      </AdminButton>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {(() => {
        const editingItem = section.ordered.find((i) => i.id === editingItemId)
        if (!editingItem) return null
        return (
          <ItemOverrideEditor
            item={editingItem}
            disabled={isPublished}
            onChange={(patch) => onUpdate(editingItem.id, patch)}
          />
        )
      })()}
    </div>
  )
}

function ItemOverrideEditor({
  item,
  disabled,
  onChange,
}: {
  item: SocialPostItem
  disabled: boolean
  onChange: (
    patch: Partial<
      Pick<
        SocialPostItem,
        'title_override' | 'time_override' | 'brewery_override' | 'short_description'
      >
    >
  ) => void
}) {
  const type = itemTypeOf(item)
  const showShort = type === 'event' || type === 'deal'
  const shortVal = item.short_description ?? ''

  return (
    <div
      className="mt-3 rounded border p-3 space-y-2"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surfaceLight }}
    >
      <p className="text-xs font-semibold" style={{ color: Colors.textDark }}>
        Overrides · {ITEM_TYPE_LABEL[type]} · {itemTitle(item)}
      </p>
      {(
        [
          ['title_override', 'Title', itemTitlePlaceholder(item)],
          ['time_override', 'Time', itemTimePlaceholder(item)],
          ['brewery_override', 'Brewery', itemBreweryPlaceholder(item)],
        ] as const
      ).map(([key, label, placeholder]) => (
        <div key={key}>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs" style={{ color: Colors.textSecondary }}>
              {label}
            </label>
            {item[key] != null ? (
              <button
                type="button"
                disabled={disabled}
                className="text-[11px] underline"
                style={{ color: Colors.textMuted }}
                onClick={() => onChange({ [key]: null })}
              >
                reset
              </button>
            ) : null}
          </div>
          <input
            type="text"
            disabled={disabled}
            value={item[key] ?? ''}
            placeholder={placeholder}
            onChange={(e) =>
              onChange({ [key]: e.target.value.trim() ? e.target.value : null })
            }
            className="w-full px-2 py-1.5 border rounded text-sm"
            style={inputStyle}
          />
        </div>
      ))}
      {showShort ? (
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs" style={{ color: Colors.textSecondary }}>
              Short description
            </label>
          </div>
          <input
            type="text"
            disabled={disabled}
            value={shortVal}
            onChange={(e) =>
              onChange({
                short_description: e.target.value.trim() ? e.target.value : null,
              })
            }
            className="w-full px-2 py-1.5 border rounded text-sm"
            style={inputStyle}
            placeholder="One-line blurb for lineup slides"
          />
          <p
            className="text-[11px] mt-0.5 text-right"
            style={{
              color: shortVal.length > SHORT_DESC_LIMIT ? Colors.warning : Colors.textMuted,
            }}
          >
            {shortVal.length} / ~{SHORT_DESC_LIMIT}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function PhotoPickerModal({
  item,
  onClose,
  onPick,
  toast,
}: {
  item: SocialPostItem
  onClose: () => void
  onPick: (url: string) => void
  toast: (kind: SocialToast['kind'], message: string) => void
}) {
  const brewery = primaryBrewery(item)
  const [images, setImages] = useState<{ path: string; url: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!brewery?.id) {
        setLoading(false)
        return
      }
      const res = await listBreweryFolderImages(brewery.id)
      if (cancelled) return
      if (!res.ok) toast('error', res.error)
      setImages(res.images)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [brewery?.id, toast])

  async function onUpload(file: File) {
    if (!brewery?.id) return
    if (file.size > MAX_UPLOAD_BYTES) {
      toast('error', 'Image must be under 6 MB')
      return
    }
    const type = (file.type || '').toLowerCase()
    const name = file.name.toLowerCase()
    if (type === 'image/avif' || type === 'image/gif' || /\.(avif|gif)$/.test(name)) {
      toast('error', 'AVIF and GIF are not supported')
      return
    }
    const ok =
      type === 'image/jpeg' ||
      type === 'image/jpg' ||
      type === 'image/png' ||
      type === 'image/webp' ||
      /\.(jpe?g|png|webp)$/.test(name)
    if (!ok) {
      toast('error', 'Only JPEG, PNG, or WebP are supported')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.set('brewery_id', brewery.id)
      fd.set('file', file)
      const res = await uploadBreweryImageForSocial(fd)
      if (!res.ok) {
        toast('error', res.error)
        return
      }
      onPick(res.url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: Colors.overlayDark }}
      role="dialog"
      aria-modal
    >
      <div
        className="w-full max-w-lg rounded-lg border p-4 space-y-3 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: Colors.surface, borderColor: Colors.dividerLight }}
      >
        <div className="flex items-center justify-between">
          <h3
            className="text-lg font-bold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            Change photo
          </h3>
          <AdminButton variant="cancel" onClick={onClose}>
            Close
          </AdminButton>
        </div>
        <p className="text-xs" style={{ color: Colors.textSecondary }}>
          {brewery?.name || 'Brewery'} · JPEG / PNG / WebP under 6 MB
        </p>
        {brewery?.image_url ? (
          <button
            type="button"
            onClick={() => onPick(brewery.image_url!)}
            className="flex items-center gap-2 rounded border p-2 w-full text-left hover:opacity-90"
            style={{ borderColor: Colors.dividerLight }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brewery.image_url} alt="" className="h-14 w-14 object-cover rounded" />
            <span className="text-sm" style={{ color: Colors.textDark }}>
              Current brewery photo
            </span>
          </button>
        ) : null}
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
            <AdminSpinner /> Loading gallery…
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <button
                key={img.path}
                type="button"
                onClick={() => onPick(img.url)}
                className="aspect-square rounded border overflow-hidden"
                style={{ borderColor: Colors.dividerLight }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onUpload(f)
              e.target.value = ''
            }}
          />
          <AdminButton
            variant="add"
            loading={uploading}
            disabled={uploading || !brewery?.id}
            onClick={() => fileRef.current?.click()}
          >
            Upload new
          </AdminButton>
        </div>
      </div>
    </div>
  )
}

const COLOR_KEYS: (keyof BrandColors)[] = [
  'primary',
  'primary_dark',
  'accent',
  'cream',
  'charcoal',
  'text_primary',
  'text_secondary',
  'border',
]

const FONT_SLOTS: { key: keyof BrandFonts; label: string }[] = [
  { key: 'display', label: 'Display (Fjalla One)' },
  { key: 'body_400', label: 'Body regular' },
  { key: 'body_600', label: 'Body semibold' },
  { key: 'body_700', label: 'Body bold' },
]

function BrandSettingsPanel({
  open,
  onToggle,
  brand,
  saving,
  onSave,
  toast,
}: {
  open: boolean
  onToggle: () => void
  brand: BrandProfile | null
  saving: boolean
  onSave: (next: BrandProfile) => Promise<void>
  toast: (kind: SocialToast['kind'], message: string) => void
}) {
  const [draft, setDraft] = useState<BrandProfile | null>(brand)
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)

  useEffect(() => {
    setDraft(brand)
  }, [brand])

  if (!draft) {
    return (
      <div className="rounded-lg border p-4" style={{ borderColor: Colors.dividerLight }}>
        <p className="text-sm" style={{ color: Colors.textSecondary }}>
          Brand profile not loaded yet.
        </p>
      </div>
    )
  }

  async function uploadAsset(
    file: File,
    path: string,
    slot: string
  ): Promise<string | null> {
    setUploadingSlot(slot)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.storage.from('brand-assets').upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      })
      if (error) {
        toast('error', error.message)
        return null
      }
      const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
      return data.publicUrl
    } finally {
      setUploadingSlot(null)
    }
  }

  return (
    <div
      className="rounded-lg border"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span
          className="font-semibold"
          style={{ color: Colors.primaryDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Brand settings
        </span>
        <span className="text-sm" style={{ color: Colors.textSecondary }}>
          {open ? 'Hide' : 'Show'}
        </span>
      </button>
      {open ? (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: Colors.dividerLight }}>
          <p className="text-xs pt-3" style={{ color: Colors.textMuted }}>
            Changes apply on the next render.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLOR_KEYS.map((key) => (
              <label key={key} className="text-xs space-y-1" style={{ color: Colors.textSecondary }}>
                <span className="block font-medium">{key}</span>
                <input
                  type="color"
                  value={draft.colors[key] || '#000000'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      colors: { ...draft.colors, [key]: e.target.value },
                    })
                  }
                  className="h-9 w-full cursor-pointer rounded border"
                  style={{ borderColor: Colors.dividerLight }}
                />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs space-y-1" style={{ color: Colors.textSecondary }}>
              <span className="block font-medium">Handle</span>
              <input
                type="text"
                value={draft.handle}
                onChange={(e) => setDraft({ ...draft, handle: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
                style={inputStyle}
              />
            </label>
            <label className="text-xs space-y-1" style={{ color: Colors.textSecondary }}>
              <span className="block font-medium">CTA text</span>
              <input
                type="text"
                value={draft.cta_text}
                onChange={(e) => setDraft({ ...draft, cta_text: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
                style={inputStyle}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FONT_SLOTS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <p className="text-xs font-medium" style={{ color: Colors.textSecondary }}>
                  {label}
                </p>
                <p className="text-[11px]" style={{ color: Colors.textMuted }}>
                  {draft.fonts[key] ? 'Custom font set' : 'using default'}
                </p>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff"
                  disabled={uploadingSlot === key}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    const name = file.name.toLowerCase()
                    if (name.endsWith('.woff2')) {
                      toast('error', "the renderer can't read .woff2")
                      return
                    }
                    if (!/\.(ttf|otf|woff)$/.test(name)) {
                      toast('error', 'Fonts must be .ttf, .otf, or .woff')
                      return
                    }
                    const ext = name.split('.').pop() || 'ttf'
                    const url = await uploadAsset(
                      file,
                      `fonts/${key}-${Date.now()}.${ext}`,
                      key
                    )
                    if (url) {
                      setDraft({
                        ...draft,
                        fonts: { ...draft.fonts, [key]: url },
                      })
                    }
                  }}
                  className="text-xs"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                ['logo_url', 'Logo on dark'],
                ['logo_light_url', 'Logo on light'],
              ] as const
            ).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <p className="text-xs font-medium" style={{ color: Colors.textSecondary }}>
                  {label}
                </p>
                {draft[field] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft[field]!} alt="" className="h-10 object-contain" />
                ) : (
                  <p className="text-[11px]" style={{ color: Colors.textMuted }}>
                    Empty = text wordmark
                  </p>
                )}
                <input
                  type="file"
                  accept=".png,.svg,image/png,image/svg+xml"
                  disabled={uploadingSlot === field}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    const t = (file.type || '').toLowerCase()
                    const n = file.name.toLowerCase()
                    if (
                      t !== 'image/png' &&
                      t !== 'image/svg+xml' &&
                      !n.endsWith('.png') &&
                      !n.endsWith('.svg')
                    ) {
                      toast('error', 'Logos must be PNG or SVG')
                      return
                    }
                    const ext = n.endsWith('.svg') ? 'svg' : 'png'
                    const url = await uploadAsset(
                      file,
                      `logos/${field}-${Date.now()}.${ext}`,
                      field
                    )
                    if (url) setDraft({ ...draft, [field]: url })
                  }}
                  className="text-xs"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: Colors.textSecondary }}>
              App mockup (last slide)
            </p>
            <p className="text-[11px]" style={{ color: Colors.textMuted }}>
              PNG (keeps transparency) or JPEG · ideally ~600×1100 · under 1 MB. Always uploads under
              a new file name.
            </p>
            {draft.app_image_url ? (
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.app_image_url}
                  alt="App mockup"
                  className="h-40 w-auto object-contain rounded border"
                  style={{ borderColor: Colors.dividerLight }}
                />
                <AdminButton
                  variant="delete"
                  disabled={saving}
                  onClick={() => setDraft({ ...draft, app_image_url: null })}
                >
                  Remove
                </AdminButton>
              </div>
            ) : (
              <p className="text-[11px]" style={{ color: Colors.textMuted }}>
                Empty = text-only last slide
              </p>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              disabled={uploadingSlot === 'app_image'}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                if (file.size > APP_MOCKUP_MAX_BYTES) {
                  toast('error', 'App mockup should be under 1 MB')
                  return
                }
                const t = (file.type || '').toLowerCase()
                const n = file.name.toLowerCase()
                if (
                  t !== 'image/png' &&
                  t !== 'image/jpeg' &&
                  t !== 'image/jpg' &&
                  !/\.(png|jpe?g)$/.test(n)
                ) {
                  toast('error', 'App mockup must be PNG or JPEG')
                  return
                }
                const ext = n.endsWith('.png') || t === 'image/png' ? 'png' : 'jpg'
                const url = await uploadAsset(
                  file,
                  `app-mockup-${Date.now()}.${ext}`,
                  'app_image'
                )
                if (url) setDraft({ ...draft, app_image_url: url })
              }}
              className="text-xs"
            />
          </div>

          <AdminButton
            variant="save"
            loading={saving}
            disabled={saving}
            onClick={() => void onSave(draft)}
          >
            Save brand
          </AdminButton>
        </div>
      ) : null}
    </div>
  )
}
