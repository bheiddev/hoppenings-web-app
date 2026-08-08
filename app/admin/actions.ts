'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { ProposedEvent, TaplistItem } from '@/types/supabase'

const ADMIN_PATH = '/admin'

function revalidateBreweriesEvents() {
  revalidatePath(ADMIN_PATH, 'layout')
}

/** Expanded recurring rows use synthetic ids `{uuid}-{YYYY-MM-DD}`; DB expects the base UUID. */
function normalizeEventsBaseId(raw: string): string {
  const trimmed = raw.trim()
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed
  }
  const m = trimmed.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-\d{4}-\d{2}-\d{2}$/i
  )
  if (m) return m[1]
  return trimmed
}

function getAdmin() {
  const admin = getSupabaseAdmin()
  if (!admin) {
    return { admin: null, error: 'Server not configured for mutations. Add service_role (or SUPABASE_SERVICE_ROLE_KEY) to your environment with the Supabase service_role key (Dashboard → Settings → API).' }
  }
  return { admin, error: null }
}

export async function rejectProposedEvent(id: number) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!
    .from('proposed_events')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error rejecting proposed event:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  return { ok: true }
}

export async function acceptProposedEvent(proposed: ProposedEvent) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  if (!proposed.brewery_id) {
    return { ok: false, error: 'Proposed event is missing brewery_id' }
  }
  // If events_base is a view, change to the underlying table name (e.g. 'events')
  const { error: insertError } = await admin!
    .from('events_base')
    .insert({
      title: proposed.title ?? '',
      brewery_id: proposed.brewery_id,
      event_date: proposed.event_date ?? '',
      start_time: proposed.start_time,
      end_time: proposed.end_time,
      cost: proposed.cost,
      is_recurring: proposed.is_recurring ?? false,
      is_recurring_biweekly: proposed.is_recurring_biweekly ?? false,
      is_recurring_monthly: proposed.is_recurring_monthly ?? false,
      description: proposed.description,
      featured: proposed.featured ?? false,
    })

  if (insertError) {
    console.error('Error accepting proposed event (insert):', insertError)
    return { ok: false, error: insertError.message }
  }

  const { error: deleteError } = await admin!
    .from('proposed_events')
    .delete()
    .eq('id', proposed.id)

  if (deleteError) {
    console.error('Error accepting proposed event (delete from proposed):', deleteError)
    return { ok: false, error: deleteError.message }
  }

  revalidateBreweriesEvents()
  return { ok: true }
}

export type UpdateProposedEventPayload = {
  title: string | null
  description: string | null
  event_date: string | null
  start_time: string | null
  end_time: string | null
  cost: number | null
  featured: boolean | null
  is_recurring: boolean | null
  is_recurring_biweekly: boolean | null
  is_recurring_monthly: boolean | null
  brewery_id: string | null
  brewery_id2: string | null
  brewery_id3: string | null
}

export async function updateProposedEvent(id: number, data: UpdateProposedEventPayload) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!
    .from('proposed_events')
    .update({
      title: data.title,
      description: data.description,
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time,
      cost: data.cost,
      featured: data.featured,
      is_recurring: data.is_recurring,
      is_recurring_biweekly: data.is_recurring_biweekly,
      is_recurring_monthly: data.is_recurring_monthly,
      brewery_id: data.brewery_id,
      brewery_id2: data.brewery_id2,
      brewery_id3: data.brewery_id3,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating proposed event:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  return { ok: true }
}

export type UpdateEventPayload = {
  title: string
  description: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  cost: number | null
  featured: boolean
  is_recurring: boolean
  is_recurring_biweekly: boolean
  is_recurring_monthly: boolean
}

export async function createEventInEventsBase(breweryId: string, data: UpdateEventPayload) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!
    .from('events_base')
    .insert({
      title: data.title,
      brewery_id: breweryId,
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time,
      cost: data.cost,
      is_recurring: data.is_recurring,
      is_recurring_biweekly: data.is_recurring_biweekly,
      is_recurring_monthly: data.is_recurring_monthly,
      description: data.description,
      featured: data.featured,
    })

  if (error) {
    console.error('Error creating event:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  revalidatePath('/events')
  return { ok: true }
}

export async function updateEventInEventsBase(eventId: string, data: UpdateEventPayload) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const id = normalizeEventsBaseId(eventId)
  const { error } = await admin!
    .from('events_base')
    .update({
      title: data.title,
      description: data.description,
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time,
      cost: data.cost,
      featured: data.featured,
      is_recurring: data.is_recurring,
      is_recurring_biweekly: data.is_recurring_biweekly,
      is_recurring_monthly: data.is_recurring_monthly,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating event:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  return { ok: true }
}

export async function deleteEventFromEventsBase(eventId: string) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const id = normalizeEventsBaseId(eventId)
  const { error } = await admin!
    .from('events_base')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting event:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  return { ok: true }
}

export type UpdateBeerReleasePayload = {
  beer_name: string
  ABV: string | null
  Type: string | null
  description: string | null
  brewery_id: string
  brewery_id2: string | null
  brewery_id3: string | null
  release_date: string | null
}

export async function createBeerReleaseInBase(data: UpdateBeerReleasePayload) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!
    .from('beer_releases_base')
    .insert({
      beer_name: data.beer_name,
      ABV: data.ABV,
      Type: data.Type,
      description: data.description,
      brewery_id: data.brewery_id,
      brewery_id2: data.brewery_id2,
      brewery_id3: data.brewery_id3,
      release_date: data.release_date,
    })

  if (error) {
    console.error('Error creating beer release:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  revalidatePath('/releases')
  return { ok: true }
}

export async function updateBeerReleaseInBase(releaseId: string, data: UpdateBeerReleasePayload) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!
    .from('beer_releases_base')
    .update({
      beer_name: data.beer_name,
      ABV: data.ABV,
      Type: data.Type,
      description: data.description,
      brewery_id: data.brewery_id,
      brewery_id2: data.brewery_id2,
      brewery_id3: data.brewery_id3,
      release_date: data.release_date,
    })
    .eq('id', releaseId)

  if (error) {
    console.error('Error updating beer release:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  revalidatePath('/releases')
  return { ok: true }
}

export type UpdateFoodTruckPayload = {
  name: string | null
  brewery_id: string | null
  date: string | null
  permanent: boolean | null
  closed: number[] | null
}

export async function updateFoodTruck(foodTruckId: number, data: UpdateFoodTruckPayload) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!
    .from('food_trucks')
    .update({
      name: data.name,
      brewery_id: data.brewery_id,
      date: data.date,
      permanent: data.permanent,
      closed: data.closed,
    })
    .eq('id', foodTruckId)

  if (error) {
    console.error('Error updating food truck:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  return { ok: true }
}

export async function deleteFoodTruck(foodTruckId: number) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!.from('food_trucks').delete().eq('id', foodTruckId)

  if (error) {
    console.error('Error deleting food truck:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  return { ok: true }
}

export async function deleteBeerReleaseFromBase(releaseId: string) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!.from('beer_releases_base').delete().eq('id', releaseId)

  if (error) {
    console.error('Error deleting beer release:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  revalidatePath('/releases')
  return { ok: true }
}

export async function addTaplistItemToReleases(item: TaplistItem) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!
    .from('beer_releases_base')
    .insert({
      beer_name: item.beer_name,
      ABV: item.abv,
      Type: item.type,
      description: item.description,
      brewery_id: item.brewery_id,
      brewery_id2: null,
      brewery_id3: null,
      release_date: item.first_seen ?? null,
    })

  if (error) {
    console.error('Error adding taplist item to releases:', error)
    return { ok: false, error: error.message }
  }
  revalidateBreweriesEvents()
  return { ok: true }
}

const BREWERY_IMAGES_BUCKET = 'brewery-images'
const TAP_IMAGES_BUCKET = 'Tap Images'

function formText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function formBool(formData: FormData, key: string): boolean {
  const raw = formData.get(key)
  return raw === 'true' || raw === 'on' || raw === '1'
}

function formOptionalNumber(formData: FormData, key: string): number | null {
  const raw = formText(formData, key)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function fileExt(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

async function uploadBreweryImage(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  bucket: string,
  breweryId: string,
  file: File,
  prefix: string
): Promise<{ publicUrl: string | null; error?: string }> {
  const ext = fileExt(file)
  const path = `${breweryId}/${prefix}-${Date.now()}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: true,
  })
  if (error) {
    console.error(`Error uploading to ${bucket}:`, error)
    return { publicUrl: null, error: error.message }
  }
  const { data } = admin.storage.from(bucket).getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}

/**
 * Create a brewery row and optionally upload images to
 * `brewery-images` (image_url) and `Tap Images` (tap_image).
 * Expects multipart FormData from the admin BreweryFormModal.
 */
export async function createBrewery(formData: FormData) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false as const, error: configError }

  const name = formText(formData, 'name')
  const address = formText(formData, 'address')
  const phone = formText(formData, 'phone')
  const description = formText(formData, 'description')
  const region = formText(formData, 'region')
  const location = formText(formData, 'location') || region || null

  if (!name) return { ok: false as const, error: 'Name is required' }
  if (!address) return { ok: false as const, error: 'Address is required' }
  if (!phone) return { ok: false as const, error: 'Phone is required' }
  if (!description) return { ok: false as const, error: 'Description is required' }
  if (!region) return { ok: false as const, error: 'Region is required' }

  const breweryId = crypto.randomUUID()
  let imageUrl: string | null = null
  let tapImage: string | null = null

  const breweryImage = formData.get('brewery_image')
  if (breweryImage instanceof File && breweryImage.size > 0) {
    const uploaded = await uploadBreweryImage(
      admin!,
      BREWERY_IMAGES_BUCKET,
      breweryId,
      breweryImage,
      'brewery'
    )
    if (uploaded.error) return { ok: false as const, error: `Brewery image: ${uploaded.error}` }
    imageUrl = uploaded.publicUrl
  }

  const tapImageFile = formData.get('tap_image')
  if (tapImageFile instanceof File && tapImageFile.size > 0) {
    const uploaded = await uploadBreweryImage(
      admin!,
      TAP_IMAGES_BUCKET,
      breweryId,
      tapImageFile,
      'tap'
    )
    if (uploaded.error) return { ok: false as const, error: `Tap image: ${uploaded.error}` }
    tapImage = uploaded.publicUrl
  }

  const { error } = await admin!.from('breweries').insert({
    id: breweryId,
    name,
    address,
    phone,
    description,
    is_pet_friendly: formBool(formData, 'is_pet_friendly'),
    has_outdoor_seating: formBool(formData, 'has_outdoor_seating'),
    has_food_trucks: formBool(formData, 'has_food_trucks'),
    has_wifi: formBool(formData, 'has_wifi'),
    has_na_beer: formBool(formData, 'has_na_beer'),
    image_url: imageUrl,
    tap_image: tapImage,
    latitude: formOptionalNumber(formData, 'latitude'),
    longitude: formOptionalNumber(formData, 'longitude'),
    location,
    Region: region,
  })

  if (error) {
    console.error('Error creating brewery:', error)
    return { ok: false as const, error: error.message }
  }

  revalidateBreweriesEvents()
  revalidatePath('/breweries')
  revalidatePath('/')
  return { ok: true as const, id: breweryId }
}
