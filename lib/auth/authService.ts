'use client'

import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import { getAuthCallbackUrl } from '@/lib/auth/redirect'

export type AuthResult = {
  success: boolean
  error?: string
  needsEmailVerification?: boolean
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowser()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: getAuthCallbackUrl() },
  })

  if (error) {
    const errorMessage = error.message.toLowerCase()
    const isUserExists =
      errorMessage.includes('user already registered') ||
      errorMessage.includes('email already registered') ||
      errorMessage.includes('already registered') ||
      errorMessage.includes('user already exists') ||
      errorMessage.includes('email already exists')

    const isEmailError =
      errorMessage.includes('error sending') ||
      errorMessage.includes('email sending') ||
      errorMessage.includes('sending confirmation email') ||
      errorMessage.includes('email delivery') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests')

    if (isUserExists) {
      return {
        success: false,
        error: 'A user already exists with this email, sign in to continue',
      }
    }
    if (isEmailError) {
      return {
        success: false,
        error:
          'Unable to send confirmation email. This may be due to rate limits or email service issues. Please try again in a few minutes or contact support.',
      }
    }
    return { success: false, error: error.message }
  }

  if (data?.user?.identities?.length === 0) {
    return {
      success: false,
      error: 'A user already exists with this email, sign in to continue',
    }
  }

  return {
    success: true,
    needsEmailVerification: !data.session,
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowser()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowser()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl(),
  })

  if (error) {
    const msg = error.message.toLowerCase()
    const isRateLimit = msg.includes('rate limit') || msg.includes('too many requests')
    return {
      success: false,
      error: isRateLimit
        ? 'Too many requests. Please try again in a few minutes.'
        : error.message,
    }
  }

  return { success: true }
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowser()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function signInWithOAuth(provider: 'google' | 'apple'): Promise<AuthResult> {
  const supabase = getSupabaseBrowser()
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: getAuthCallbackUrl() },
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowser()
  await supabase.auth.signOut()
}
