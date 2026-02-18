'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { ProposedEvent } from '@/types/supabase'

const BREWERIES_EVENTS_PATH = '/breweries-events'

export async function rejectProposedEvent(id: string) {
  const { error } = await supabase
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
  // If events_base is a view, change to the underlying table name (e.g. 'events')
  const { error: insertError } = await supabase
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

  const { error: deleteError } = await supabase
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
  const { error } = await supabase
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
