import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/debug-admin — Check if service role env is available on the server.
 * Remove or protect this route in production if you don't want to expose this check.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.service_role ??
    process.env.SERVICE_ROLE

  const admin = getSupabaseAdmin()
  return NextResponse.json({
    hasSupabaseUrl: !!url,
    hasServiceRoleKey: !!key,
    keyLength: key ? key.length : 0,
    adminClientOk: !!admin,
  })
}
