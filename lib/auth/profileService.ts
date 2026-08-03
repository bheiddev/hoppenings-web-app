'use client'

import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import { validateDisplayName } from '@/lib/auth/displayNameValidation'
import type { Profile, ProfileUpdate } from '@/types/supabase'

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function checkDisplayNameAvailability(
  displayName: string,
  excludeUserId?: string
): Promise<{ available: boolean; error?: string }> {
  const supabase = getSupabaseBrowser()

  if (!displayName || displayName.trim().length === 0) {
    return { available: false, error: 'Display name cannot be empty' }
  }

  const trimmedName = displayName.trim()

  const nameCheck = validateDisplayName(trimmedName)
  if (!nameCheck.allowed) {
    return { available: false, error: nameCheck.error || 'This display name is not allowed' }
  }

  let query = supabase
    .from('profiles')
    .select('id, display_name')
    .ilike('display_name', trimmedName)
    .not('display_name', 'is', null)

  if (excludeUserId) {
    query = query.neq('id', excludeUserId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error checking display name availability:', error)
    return { available: false, error: 'Error checking display name availability' }
  }

  if (data && data.length > 0) {
    return { available: false, error: 'This display name is already taken' }
  }

  return { available: true }
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowser()
  const payload: ProfileUpdate = { ...updates }

  if (payload.display_name) {
    const trimmedName = payload.display_name.trim()
    if (trimmedName.length === 0) {
      return { success: false, error: 'Display name cannot be empty' }
    }

    const nameCheck = validateDisplayName(trimmedName)
    if (!nameCheck.allowed) {
      return { success: false, error: nameCheck.error || 'This display name is not allowed' }
    }

    const availability = await checkDisplayNameAvailability(trimmedName, userId)
    if (!availability.available) {
      return { success: false, error: availability.error || 'Display name is not available' }
    }

    payload.display_name = trimmedName
  }

  const { data: updatedRows, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('id')

  if (error) {
    console.error('Error updating profile:', error)
    if (
      error.code === '23505' ||
      error.message?.toLowerCase().includes('unique') ||
      error.message?.toLowerCase().includes('duplicate')
    ) {
      return { success: false, error: 'This display name is already taken' }
    }
    return { success: false, error: error.message || 'Failed to update profile' }
  }

  if (updatedRows && updatedRows.length > 0) {
    return { success: true }
  }

  // Fallback: profile row missing (trigger usually creates it) — upsert on id only
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const authUser = authData?.user
  if (authError || !authUser || authUser.id !== userId) {
    return { success: false, error: 'Could not verify your account. Please sign in again.' }
  }

  const provider =
    (typeof authUser.app_metadata?.provider === 'string' && authUser.app_metadata.provider) ||
    (Array.isArray(authUser.app_metadata?.providers) && authUser.app_metadata.providers[0]) ||
    'email'

  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: authUser.email ?? null,
      provider,
      updated_at: new Date().toISOString(),
      ...payload,
    },
    { onConflict: 'id' }
  )

  if (upsertError) {
    console.error('Profile upsert (no row updated):', upsertError)
    return { success: false, error: upsertError.message || 'Failed to save profile' }
  }

  return { success: true }
}

/** Optional avatar upload matching mobile path scheme: User_Profiles/{userId}/{userId}-{ts}.{ext} */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ publicUrl: string | null; error?: string }> {
  const supabase = getSupabaseBrowser()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  const fileExt = allowed.includes(ext) ? ext : 'jpg'
  const path = `${userId}/${userId}-${Date.now()}.${fileExt}`

  const { error } = await supabase.storage.from('User_Profiles').upload(path, file, {
    upsert: true,
    contentType: file.type || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
  })

  if (error) {
    return { publicUrl: null, error: error.message }
  }

  const { data } = supabase.storage.from('User_Profiles').getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}

export async function deleteAvatar(avatarUrl: string): Promise<void> {
  const supabase = getSupabaseBrowser()
  if (!avatarUrl) return
  const urlParts = avatarUrl.split('/User_Profiles/')
  if (urlParts.length < 2) return
  await supabase.storage.from('User_Profiles').remove([urlParts[1]])
}
