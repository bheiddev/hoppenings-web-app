'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { ProposedEvent, TaplistItem } from '@/types/supabase'

const BREWERIES_EVENTS_PATH = '/breweries-events'

function getAdmin() {
  const admin = getSupabaseAdmin()
  if (!admin) {
    return { admin: null, error: 'Server not configured for mutations. Add service_role (or SUPABASE_SERVICE_ROLE_KEY) to your environment with the Supabase service_role key (Dashboard → Settings → API).' }
  }
  return { admin, error: null }
}

export async function rejectProposedEvent(id: string) {
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
  revalidatePath(BREWERIES_EVENTS_PATH)
  return { ok: true }
}

export async function acceptProposedEvent(proposed: ProposedEvent) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  // If events_base is a view, change to the underlying table name (e.g. 'events')
  const { error: insertError } = await admin!
    .from('events_base')
    .insert({
      title: proposed.title ?? '',
      brewery_id: proposed.brewery_id,
      event_date: proposed.event_date ?? '',
      start_time: proposed.start_time,
      end_time: null,
      cost: null,
      is_recurring: false,
      is_recurring_biweekly: false,
      is_recurring_monthly: false,
      description: proposed.description,
      featured: false,
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

  revalidatePath(BREWERIES_EVENTS_PATH)
  return { ok: true }
}

export async function updateProposedEvent(
  id: string,
  data: { title: string | null; event_date: string | null; start_time: string | null; description: string | null }
) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!
    .from('proposed_events')
    .update({
      title: data.title,
      event_date: data.event_date,
      start_time: data.start_time,
      description: data.description,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating proposed event:', error)
    return { ok: false, error: error.message }
  }
  revalidatePath(BREWERIES_EVENTS_PATH)
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

export async function updateEventInEventsBase(eventId: string, data: UpdateEventPayload) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
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
    .eq('id', eventId)

  if (error) {
    console.error('Error updating event:', error)
    return { ok: false, error: error.message }
  }
  revalidatePath(BREWERIES_EVENTS_PATH)
  return { ok: true }
}

export async function deleteEventFromEventsBase(eventId: string) {
  const { admin, error: configError } = getAdmin()
  if (configError) return { ok: false, error: configError }
  const { error } = await admin!
    .from('events_base')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting event:', error)
    return { ok: false, error: error.message }
  }
  revalidatePath(BREWERIES_EVENTS_PATH)
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
  revalidatePath(BREWERIES_EVENTS_PATH)
  return { ok: true }
}
