import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Vercel / deployment: set env var named "service_role" to the Supabase service_role key value
const serviceRoleKey = process.env.service_role ?? process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Server-only Supabase client that bypasses RLS.
 * Use only in server actions / API routes for admin operations (e.g. delete/update proposed_events).
 *
 * Required: set SUPABASE_SERVICE_ROLE_KEY in env (from Supabase Dashboard → Settings → API → service_role).
 * Do NOT use NEXT_PUBLIC_ — keep this key server-side only.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
