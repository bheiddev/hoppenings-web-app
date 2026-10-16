/**
 * SEO redirect / tombstone helpers for event & release public URLs.
 *
 * Slugs are computed from live fields. On delete or rename we persist
 * from_path → to_path so detail pages can 301 instead of 404.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  generateEventSlug,
  generateLegacyEventSlug,
  generateReleaseSlug,
  generateLegacyReleaseSlug,
} from '@/lib/slug'
import {
  addDaysToDateString,
  getTodayMountainDateString,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'
import { EXPIRED_EVENT_REDIRECT, EXPIRED_RELEASE_REDIRECT } from '@/lib/contentExpiry'

export type SlugRedirectReason = 'deleted' | 'renamed'
export type SlugRedirectSourceType = 'event' | 'release'

export type SlugRedirectRow = {
  from_path: string
  to_path: string
  source_type: SlugRedirectSourceType
  source_id: string | null
  reason: SlugRedirectReason
}

/** How far back to tombstone dated recurring occurrence URLs on delete/rename. */
const EVENT_REDIRECT_LOOKBACK_DAYS = 180
/** How far forward (matches expandRecurringEvents ~12 weeks). */
const EVENT_REDIRECT_LOOKAHEAD_DAYS = 84

const MAX_REDIRECT_HOPS = 5

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withSlash.replace(/\/+$/, '') || '/'
}

export function eventPublicPath(slug: string): string {
  return normalizePath(`/events/${slug}`)
}

export function releasePublicPath(slug: string): string {
  return normalizePath(`/releases/${slug}`)
}

type EventSlugInput = {
  id: string
  title: string
  event_date: string
  is_recurring?: boolean | null
  is_recurring_biweekly?: boolean | null
  is_recurring_monthly?: boolean | null
  breweryName: string
  location: string | null
}

type ReleaseSlugInput = {
  id: string
  beer_name: string
  Type: string | null
  breweryName: string
  location: string | null
}

function isRecurringFlags(event: EventSlugInput): boolean {
  return Boolean(
    event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly
  )
}

function compareYmd(a: string, b: string): number {
  return a.localeCompare(b)
}

/**
 * Dates we may have exposed in the sitemap for this event (lookback + lookahead).
 * One-offs: just the event_date. Recurring: cadence steps within the window.
 */
export function listEventOccurrenceDatesForRedirects(event: EventSlugInput): string[] {
  const base = normalizeEventDateToMountainTime(event.event_date)
  if (!base) return []

  const today = getTodayMountainDateString()
  const fromYmd = addDaysToDateString(today, -EVENT_REDIRECT_LOOKBACK_DAYS)
  const toYmd = addDaysToDateString(today, EVENT_REDIRECT_LOOKAHEAD_DAYS)

  if (!isRecurringFlags(event)) {
    return [base]
  }

  const stepDays = event.is_recurring_monthly
    ? null
    : event.is_recurring_biweekly
      ? 14
      : 7

  const dates = new Set<string>()

  if (stepDays == null) {
    // Monthly: same calendar day-of-month across the window
    const dayNum = Number(base.slice(8, 10))
    let y = Number(fromYmd.slice(0, 4))
    let m = Number(fromYmd.slice(5, 7))
    const endY = Number(toYmd.slice(0, 4))
    const endM = Number(toYmd.slice(5, 7))
    while (y < endY || (y === endY && m <= endM)) {
      const candidate = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      const [cy, cm, cd] = candidate.split('-').map(Number)
      const check = new Date(Date.UTC(cy, cm - 1, cd, 12, 0, 0))
      if (
        check.getUTCFullYear() === cy &&
        check.getUTCMonth() === cm - 1 &&
        check.getUTCDate() === cd &&
        compareYmd(candidate, fromYmd) >= 0 &&
        compareYmd(candidate, toYmd) <= 0
      ) {
        dates.add(candidate)
      }
      m += 1
      if (m > 12) {
        m = 1
        y += 1
      }
    }
  } else {
    let cursor = base
    while (compareYmd(cursor, fromYmd) > 0) {
      cursor = addDaysToDateString(cursor, -stepDays)
    }
    while (compareYmd(cursor, toYmd) <= 0) {
      if (compareYmd(cursor, fromYmd) >= 0) dates.add(cursor)
      cursor = addDaysToDateString(cursor, stepDays)
    }
  }

  dates.add(base)
  return Array.from(dates).sort()
}

/** All public paths this event may have been served under for the given field snapshot. */
export function collectEventPublicPaths(event: EventSlugInput): string[] {
  const recurring = isRecurringFlags(event)
  const paths = new Set<string>()

  for (const date of listEventOccurrenceDatesForRedirects(event)) {
    paths.add(
      eventPublicPath(
        generateEventSlug(
          event.title,
          event.breweryName,
          event.location,
          date,
          event.id,
          recurring
        )
      )
    )
    paths.add(
      eventPublicPath(
        generateLegacyEventSlug(
          event.title,
          event.breweryName,
          event.location,
          date,
          event.id,
          recurring
        )
      )
    )
  }

  return Array.from(paths)
}

export function collectReleasePublicPaths(release: ReleaseSlugInput): string[] {
  return [
    releasePublicPath(
      generateReleaseSlug(
        release.beer_name,
        release.Type,
        release.breweryName,
        release.location,
        release.id
      )
    ),
    releasePublicPath(
      generateLegacyReleaseSlug(
        release.beer_name,
        release.Type,
        release.breweryName,
        release.location,
        release.id
      )
    ),
  ]
}

async function upsertRedirectRows(
  admin: SupabaseClient,
  rows: SlugRedirectRow[]
): Promise<{ error?: string }> {
  if (rows.length === 0) return {}

  const payload = rows
    .map((row) => ({
      from_path: normalizePath(row.from_path),
      to_path: normalizePath(row.to_path),
      source_type: row.source_type,
      source_id: row.source_id,
      reason: row.reason,
    }))
    .filter((row) => row.from_path !== row.to_path)

  if (payload.length === 0) return {}

  // Dedupe by from_path (last wins)
  const byFrom = new Map<string, (typeof payload)[number]>()
  for (const row of payload) byFrom.set(row.from_path, row)

  const { error } = await admin.from('slug_redirects').upsert(Array.from(byFrom.values()), {
    onConflict: 'from_path',
  })

  if (error) {
    console.error('Error upserting slug_redirects:', error)
    return { error: error.message }
  }
  return {}
}

export async function recordEventDeletedRedirects(
  admin: SupabaseClient,
  event: EventSlugInput
): Promise<{ error?: string; paths: string[] }> {
  const paths = collectEventPublicPaths(event)
  const rows = paths.map((from_path) => ({
    from_path,
    to_path: EXPIRED_EVENT_REDIRECT,
    source_type: 'event' as const,
    source_id: event.id,
    reason: 'deleted' as const,
  }))
  const result = await upsertRedirectRows(admin, rows)
  return { ...result, paths }
}

export async function recordReleaseDeletedRedirects(
  admin: SupabaseClient,
  release: ReleaseSlugInput
): Promise<{ error?: string; paths: string[] }> {
  const paths = collectReleasePublicPaths(release)
  const rows = paths.map((from_path) => ({
    from_path,
    to_path: EXPIRED_RELEASE_REDIRECT,
    source_type: 'release' as const,
    source_id: release.id,
    reason: 'deleted' as const,
  }))
  const result = await upsertRedirectRows(admin, rows)
  return { ...result, paths }
}

/**
 * When slug-affecting fields change, map every old public path to the best new path.
 * Dated occurrence URLs keep the same date suffix when possible.
 */
export async function recordEventRenamedRedirects(
  admin: SupabaseClient,
  before: EventSlugInput,
  after: EventSlugInput
): Promise<{ error?: string; paths: string[] }> {
  const oldPaths = collectEventPublicPaths(before)
  const newPaths = new Set(collectEventPublicPaths(after))
  const afterRecurring = isRecurringFlags(after)

  const rows: SlugRedirectRow[] = []
  for (const from_path of oldPaths) {
    if (newPaths.has(from_path)) continue

    const slug = from_path.replace(/^\/events\//, '')
    const dateMatch = slug.match(/-(\d{4}-\d{2}-\d{2})$/)
    let to_path = eventPublicPath(
      generateEventSlug(
        after.title,
        after.breweryName,
        after.location,
        after.event_date,
        after.id,
        afterRecurring
      )
    )

    if (dateMatch) {
      const date = dateMatch[1]
      to_path = eventPublicPath(
        generateEventSlug(
          after.title,
          after.breweryName,
          after.location,
          date,
          after.id,
          afterRecurring
        )
      )
    }

    if (from_path !== to_path) {
      rows.push({
        from_path,
        to_path,
        source_type: 'event',
        source_id: after.id,
        reason: 'renamed',
      })
    }
  }

  const result = await upsertRedirectRows(admin, rows)
  return { ...result, paths: rows.map((r) => r.from_path) }
}

export async function recordReleaseRenamedRedirects(
  admin: SupabaseClient,
  before: ReleaseSlugInput,
  after: ReleaseSlugInput
): Promise<{ error?: string; paths: string[] }> {
  const oldPaths = collectReleasePublicPaths(before)
  const newCanonical = releasePublicPath(
    generateReleaseSlug(
      after.beer_name,
      after.Type,
      after.breweryName,
      after.location,
      after.id
    )
  )
  const newPaths = new Set(collectReleasePublicPaths(after))

  const rows: SlugRedirectRow[] = []
  for (const from_path of oldPaths) {
    if (newPaths.has(from_path)) continue
    if (from_path === newCanonical) continue
    rows.push({
      from_path,
      to_path: newCanonical,
      source_type: 'release',
      source_id: after.id,
      reason: 'renamed',
    })
  }

  const result = await upsertRedirectRows(admin, rows)
  return { ...result, paths: rows.map((r) => r.from_path) }
}

/**
 * Resolve a public path through the redirect table (follows short chains).
 * Uses anon client by default; falls back to admin if provided / needed.
 */
export async function resolveSlugRedirect(
  pathOrSlug: string,
  options?: { kind?: 'event' | 'release'; client?: SupabaseClient }
): Promise<string | null> {
  let path = pathOrSlug.trim()
  if (!path.startsWith('/')) {
    path =
      options?.kind === 'release'
        ? releasePublicPath(path)
        : eventPublicPath(path)
  } else {
    path = normalizePath(path)
  }

  const client = options?.client ?? supabase ?? getSupabaseAdmin()
  if (!client) return null

  const visited = new Set<string>()
  let current = path

  for (let hop = 0; hop < MAX_REDIRECT_HOPS; hop++) {
    if (visited.has(current)) return null
    visited.add(current)

    const { data, error } = await client
      .from('slug_redirects')
      .select('to_path')
      .eq('from_path', current)
      .maybeSingle()

    if (error) {
      // Table may not exist yet before SQL is applied — fail open (no redirect).
      if (error.code === '42P01' || /slug_redirects/i.test(error.message)) {
        return null
      }
      console.error('Error resolving slug redirect:', error)
      return null
    }

    if (!data?.to_path) {
      return hop === 0 ? null : current
    }

    const next = normalizePath(data.to_path)
    if (next === current) return next
    current = next
  }

  return current === path ? null : current
}

/** Convenience: redirect target for an event detail slug, or null. */
export async function resolveEventSlugRedirect(slug: string): Promise<string | null> {
  return resolveSlugRedirect(slug, { kind: 'event' })
}

/** Convenience: redirect target for a release detail slug, or null. */
export async function resolveReleaseSlugRedirect(slug: string): Promise<string | null> {
  return resolveSlugRedirect(slug, { kind: 'release' })
}
