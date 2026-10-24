/**
 * Admin overview: coupon usage + pour-contest (tap tracker) progress.
 * Reads user_coupons, pour_contest_runs, profiles, breweries.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabase'

function getReadClient() {
  return getSupabaseAdmin() ?? supabase
}

export type CouponUsagePersonRow = {
  userId: string
  displayName: string | null
  email: string | null
  awardedCount: number
  redeemedCount: number
  readyCount: number
  breweryNames: string[]
  lastAwardedAt: string | null
  lastRedeemedAt: string | null
}

export type CouponAwardRow = {
  id: string
  userId: string | null
  deviceId: string | null
  displayName: string | null
  email: string | null
  breweryId: string
  breweryName: string
  kind: string
  status: string
  source: string
  offerLabel: string | null
  awardedAt: string
  redeemedAt: string | null
  expiresAt: string | null
}

export type TapTrackerProgressRow = {
  runId: string
  userId: string
  displayName: string | null
  email: string | null
  breweryId: string
  breweryName: string
  status: string
  visitsCounted: number
  visitsRequired: number
  startedAt: string
  completedAt: string | null
  closedAt: string | null
  closeReason: string | null
  couponPourCounted: boolean
  optedInAt: string | null
}

export type CouponsTapTrackersSummary = {
  couponsAwarded: number
  couponsRedeemed: number
  uniqueUsersWithCoupon: number
  uniqueUsersRedeemed: number
  guestDeviceCoupons: number
  activeTapTrackers: number
  rewardedTapTrackers: number
  closedTapTrackers: number
  activeEnrollments: number
}

export type CouponsTapTrackersResult = {
  summary: CouponsTapTrackersSummary
  people: CouponUsagePersonRow[]
  recentAwards: CouponAwardRow[]
  tapTrackers: TapTrackerProgressRow[]
  error: string | null
}

const emptySummary = (): CouponsTapTrackersSummary => ({
  couponsAwarded: 0,
  couponsRedeemed: 0,
  uniqueUsersWithCoupon: 0,
  uniqueUsersRedeemed: 0,
  guestDeviceCoupons: 0,
  activeTapTrackers: 0,
  rewardedTapTrackers: 0,
  closedTapTrackers: 0,
  activeEnrollments: 0,
})

type ProfileLite = { display_name: string | null; email: string | null }

async function fetchProfilesByIds(
  client: ReturnType<typeof getReadClient>,
  userIds: string[]
): Promise<Map<string, ProfileLite>> {
  const map = new Map<string, ProfileLite>()
  const unique = [...new Set(userIds.filter(Boolean))]
  if (unique.length === 0) return map

  const chunkSize = 200
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize)
    const { data, error } = await client
      .from('profiles')
      .select('id, display_name, email')
      .in('id', chunk)

    if (error) {
      console.error('Error fetching profiles for coupon admin:', error)
      continue
    }
    for (const p of data ?? []) {
      map.set(p.id as string, {
        display_name: (p.display_name as string | null) ?? null,
        email: (p.email as string | null) ?? null,
      })
    }
  }
  return map
}

async function fetchBreweryNames(
  client: ReturnType<typeof getReadClient>,
  breweryIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const unique = [...new Set(breweryIds.filter(Boolean))]
  if (unique.length === 0) return map

  const { data, error } = await client.from('breweries').select('id, name').in('id', unique)
  if (error) {
    console.error('Error fetching brewery names for coupon admin:', error)
    return map
  }
  for (const b of data ?? []) {
    map.set(b.id as string, (b.name as string) || 'Unknown brewery')
  }
  return map
}

async function fetchOfferLabels(
  client: ReturnType<typeof getReadClient>,
  offerIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const unique = [...new Set(offerIds.filter(Boolean))]
  if (unique.length === 0) return map

  const { data, error } = await client.from('coupon_offers').select('*').in('id', unique)

  if (error) {
    console.error('Error fetching coupon_offers:', error)
    return map
  }

  for (const row of data ?? []) {
    const record = row as Record<string, unknown>
    const candidates = ['title', 'name', 'headline', 'label', 'description']
    let label: string | null = null
    for (const key of candidates) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) {
        label = value.trim()
        break
      }
    }
    map.set(String(record.id), label || String(record.id).slice(0, 8))
  }
  return map
}

/**
 * Load coupon + tap-tracker admin overview.
 * Caps recent award rows for the detail table; people/trackers aggregate from full pages.
 */
export async function getCouponsTapTrackersOverview(): Promise<CouponsTapTrackersResult> {
  const client = getReadClient()
  const summary = emptySummary()

  try {
    const [
      couponsResult,
      runsResult,
      enrollmentsResult,
    ] = await Promise.all([
      client
        .from('user_coupons')
        .select(
          'id, offer_id, user_id, device_id, brewery_id, kind, status, awarded_at, redeemed_at, expires_at, source'
        )
        .order('awarded_at', { ascending: false })
        .limit(5000),
      client
        .from('pour_contest_runs')
        .select(
          `
          id,
          user_id,
          brewery_id,
          enrollment_id,
          status,
          visits_required,
          visits_counted,
          started_at,
          completed_at,
          closed_at,
          close_reason,
          coupon_pour_counted
        `
        )
        .order('started_at', { ascending: false })
        .limit(5000),
      client
        .from('user_pour_enrollments')
        .select('id, user_id, brewery_id, opted_in_at, opted_out_at')
        .is('opted_out_at', null)
        .limit(5000),
    ])

    if (couponsResult.error) {
      console.error('Error fetching user_coupons:', couponsResult.error)
      return {
        summary,
        people: [],
        recentAwards: [],
        tapTrackers: [],
        error: couponsResult.error.message,
      }
    }
    if (runsResult.error) {
      console.error('Error fetching pour_contest_runs:', runsResult.error)
      return {
        summary,
        people: [],
        recentAwards: [],
        tapTrackers: [],
        error: runsResult.error.message,
      }
    }
    if (enrollmentsResult.error) {
      console.warn('user_pour_enrollments read failed:', enrollmentsResult.error.message)
    }

    const coupons = couponsResult.data ?? []
    const runs = runsResult.data ?? []
    const enrollments = enrollmentsResult.data ?? []

    summary.couponsAwarded = coupons.length
    summary.couponsRedeemed = coupons.filter(
      (c) => c.status === 'redeemed' || c.redeemed_at
    ).length
    summary.guestDeviceCoupons = coupons.filter((c) => !c.user_id && c.device_id).length
    summary.activeEnrollments = enrollments.length
    summary.activeTapTrackers = runs.filter((r) => r.status === 'active').length
    summary.rewardedTapTrackers = runs.filter((r) => r.status === 'rewarded').length
    summary.closedTapTrackers = runs.filter((r) => r.status === 'closed').length

    const userIdsWithCoupon = new Set<string>()
    const userIdsRedeemed = new Set<string>()
    for (const c of coupons) {
      if (c.user_id) {
        userIdsWithCoupon.add(c.user_id as string)
        if (c.status === 'redeemed' || c.redeemed_at) {
          userIdsRedeemed.add(c.user_id as string)
        }
      }
    }
    summary.uniqueUsersWithCoupon = userIdsWithCoupon.size
    summary.uniqueUsersRedeemed = userIdsRedeemed.size

    const allUserIds = [
      ...userIdsWithCoupon,
      ...runs.map((r) => r.user_id as string),
      ...enrollments.map((e) => e.user_id as string),
    ]
    const allBreweryIds = [
      ...coupons.map((c) => c.brewery_id as string),
      ...runs.map((r) => r.brewery_id as string),
    ]
    const offerIds = coupons.map((c) => c.offer_id as string)

    const [profiles, breweryNames, offerLabels] = await Promise.all([
      fetchProfilesByIds(client, allUserIds),
      fetchBreweryNames(client, allBreweryIds),
      fetchOfferLabels(client, offerIds),
    ])

    const enrollmentById = new Map<string, { opted_in_at: string | null }>()
    for (const e of enrollments) {
      enrollmentById.set(e.id as string, {
        opted_in_at: (e.opted_in_at as string | null) ?? null,
      })
    }
    // Also fetch opted-in dates for runs whose enrollment may be opted out (still useful)
    const missingEnrollmentIds = runs
      .map((r) => r.enrollment_id as string)
      .filter((id) => id && !enrollmentById.has(id))
    if (missingEnrollmentIds.length > 0) {
      const uniqueMissing = [...new Set(missingEnrollmentIds)]
      const { data: extraEnrollments } = await client
        .from('user_pour_enrollments')
        .select('id, opted_in_at')
        .in('id', uniqueMissing.slice(0, 1000))
      for (const e of extraEnrollments ?? []) {
        enrollmentById.set(e.id as string, {
          opted_in_at: (e.opted_in_at as string | null) ?? null,
        })
      }
    }

    const peopleMap = new Map<string, CouponUsagePersonRow>()
    for (const c of coupons) {
      const uid = c.user_id as string | null
      if (!uid) continue
      const profile = profiles.get(uid)
      const breweryName = breweryNames.get(c.brewery_id as string) ?? 'Unknown brewery'
      const existing = peopleMap.get(uid) ?? {
        userId: uid,
        displayName: profile?.display_name ?? null,
        email: profile?.email ?? null,
        awardedCount: 0,
        redeemedCount: 0,
        readyCount: 0,
        breweryNames: [],
        lastAwardedAt: null,
        lastRedeemedAt: null,
      }
      existing.awardedCount += 1
      if (c.status === 'redeemed' || c.redeemed_at) existing.redeemedCount += 1
      if (c.status === 'ready') existing.readyCount += 1
      if (!existing.breweryNames.includes(breweryName)) {
        existing.breweryNames.push(breweryName)
      }
      const awardedAt = c.awarded_at as string
      if (!existing.lastAwardedAt || awardedAt > existing.lastAwardedAt) {
        existing.lastAwardedAt = awardedAt
      }
      const redeemedAt = c.redeemed_at as string | null
      if (redeemedAt && (!existing.lastRedeemedAt || redeemedAt > existing.lastRedeemedAt)) {
        existing.lastRedeemedAt = redeemedAt
      }
      peopleMap.set(uid, existing)
    }

    const people = Array.from(peopleMap.values()).sort((a, b) => {
      if (b.redeemedCount !== a.redeemedCount) return b.redeemedCount - a.redeemedCount
      if (b.awardedCount !== a.awardedCount) return b.awardedCount - a.awardedCount
      const aKey = (a.displayName || a.email || a.userId).toLowerCase()
      const bKey = (b.displayName || b.email || b.userId).toLowerCase()
      return aKey.localeCompare(bKey)
    })

    const recentAwards: CouponAwardRow[] = coupons.slice(0, 200).map((c) => {
      const uid = (c.user_id as string | null) ?? null
      const profile = uid ? profiles.get(uid) : undefined
      return {
        id: c.id as string,
        userId: uid,
        deviceId: (c.device_id as string | null) ?? null,
        displayName: profile?.display_name ?? null,
        email: profile?.email ?? null,
        breweryId: c.brewery_id as string,
        breweryName: breweryNames.get(c.brewery_id as string) ?? 'Unknown brewery',
        kind: c.kind as string,
        status: c.status as string,
        source: c.source as string,
        offerLabel: offerLabels.get(c.offer_id as string) ?? null,
        awardedAt: c.awarded_at as string,
        redeemedAt: (c.redeemed_at as string | null) ?? null,
        expiresAt: (c.expires_at as string | null) ?? null,
      }
    })

    const tapTrackers: TapTrackerProgressRow[] = runs.map((r) => {
      const uid = r.user_id as string
      const profile = profiles.get(uid)
      const enrollment = enrollmentById.get(r.enrollment_id as string)
      return {
        runId: r.id as string,
        userId: uid,
        displayName: profile?.display_name ?? null,
        email: profile?.email ?? null,
        breweryId: r.brewery_id as string,
        breweryName: breweryNames.get(r.brewery_id as string) ?? 'Unknown brewery',
        status: r.status as string,
        visitsCounted: Number(r.visits_counted) || 0,
        visitsRequired: Number(r.visits_required) || 0,
        startedAt: r.started_at as string,
        completedAt: (r.completed_at as string | null) ?? null,
        closedAt: (r.closed_at as string | null) ?? null,
        closeReason: (r.close_reason as string | null) ?? null,
        couponPourCounted: Boolean(r.coupon_pour_counted),
        optedInAt: enrollment?.opted_in_at ?? null,
      }
    })

    // Active/rewarded first, then by progress, then brewery name
    tapTrackers.sort((a, b) => {
      const statusRank = (s: string) =>
        s === 'active' ? 0 : s === 'rewarded' ? 1 : 2
      const sr = statusRank(a.status) - statusRank(b.status)
      if (sr !== 0) return sr
      const progress =
        b.visitsCounted / Math.max(b.visitsRequired, 1) -
        a.visitsCounted / Math.max(a.visitsRequired, 1)
      if (progress !== 0) return progress
      return a.breweryName.localeCompare(b.breweryName)
    })

    return {
      summary,
      people,
      recentAwards,
      tapTrackers,
      error: null,
    }
  } catch (err) {
    console.error('getCouponsTapTrackersOverview failed:', err)
    return {
      summary,
      people: [],
      recentAwards: [],
      tapTrackers: [],
      error: err instanceof Error ? err.message : 'Failed to load coupons / tap trackers',
    }
  }
}
