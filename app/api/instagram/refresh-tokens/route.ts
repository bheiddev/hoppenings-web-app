import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { exchangeShortForLongLivedToken } from '../_meta'

function jsonError(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v || v.length === 0) throw new Error(`Missing env var: ${name}`)
  return v
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  const expected = (() => {
    try {
      return requireEnv('INSTAGRAM_REFRESH_API_KEY')
    } catch {
      return null
    }
  })()

  if (!expected) return jsonError('Refresh endpoint not configured', 500)
  if (!apiKey || apiKey !== expected) return jsonError('Unauthorized', 401)

  const admin = getSupabaseAdmin()
  if (!admin) {
    return jsonError('Server not configured for mutations. Set SUPABASE_SERVICE_ROLE_KEY.', 500)
  }

  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await admin
    .from('brewery_instagram_tokens')
    .select('id, access_token, expires_at')
    .eq('status', 'active')
    .lte('expires_at', thirtyDaysFromNow)

  if (error) return jsonError(`DB read failed: ${error.message}`, 500)

  let refreshed = 0
  let expired = 0

  for (const row of rows ?? []) {
    const current = row.access_token as string | null
    if (!current) continue

    const refreshRes = await exchangeShortForLongLivedToken(current)
    if (!refreshRes.ok) {
      expired++
      await admin
        .from('brewery_instagram_tokens')
        .update({ status: 'expired', last_refreshed_at: new Date().toISOString() })
        .eq('id', row.id)
      continue
    }

    const newToken = refreshRes.data.access_token!
    const expiresIn = typeof refreshRes.data.expires_in === 'number' ? refreshRes.data.expires_in : null
    const expiresAt = new Date(Date.now() + (expiresIn ?? 60 * 24 * 60 * 60) * 1000).toISOString()

    const { error: updateError } = await admin
      .from('brewery_instagram_tokens')
      .update({
        access_token: newToken,
        expires_at: expiresAt,
        last_refreshed_at: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', row.id)

    if (updateError) {
      // If DB update fails, surface the error early (so n8n can alert)
      return jsonError(`DB update failed for ${row.id}: ${updateError.message}`, 500)
    }

    refreshed++
  }

  return NextResponse.json({ success: true, refreshed, expired })
}

