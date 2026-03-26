import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  exchangeCodeForShortLivedToken,
  exchangeShortForLongLivedToken,
  fetchPagesWithInstagramBusiness,
} from '../_meta'

function jsonError(step: string, message: string, status: number = 400) {
  return NextResponse.json({ success: false, step, error: message }, { status })
}

export async function POST(request: Request) {
  const admin = getSupabaseAdmin()
  if (!admin) {
    return jsonError(
      'config',
      'Server not configured for mutations. Set SUPABASE_SERVICE_ROLE_KEY.',
      500
    )
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return jsonError('request', 'Invalid JSON body')
  }

  const code = typeof body?.code === 'string' ? body.code : null
  if (!code || code.length === 0) return jsonError('request', 'Missing code')

  // 1) Code → short-lived token
  const shortRes = await exchangeCodeForShortLivedToken(code)
  if (!shortRes.ok) return jsonError('exchange_code', shortRes.error, 502)
  const shortToken = shortRes.data.access_token!

  // 2) Short-lived → long-lived token (60 days)
  const longRes = await exchangeShortForLongLivedToken(shortToken)
  if (!longRes.ok) return jsonError('exchange_long_lived', longRes.error, 502)
  const longToken = longRes.data.access_token!
  const expiresIn = typeof longRes.data.expires_in === 'number' ? longRes.data.expires_in : null
  const expiresAt = new Date(Date.now() + (expiresIn ?? 60 * 24 * 60 * 60) * 1000).toISOString()

  // 3) Token → page + Instagram business account
  const accountsRes = await fetchPagesWithInstagramBusiness(longToken)
  if (!accountsRes.ok) return jsonError('fetch_accounts', accountsRes.error, 502)

  const { instagram_account_id, facebook_page_id } = accountsRes.data

  // 4) Store token (TODO: encrypt at rest)
  const now = new Date().toISOString()
  const { error: insertError } = await admin.from('brewery_instagram_tokens').insert({
    brewery_id: null,
    access_token: longToken,
    expires_at: expiresAt,
    instagram_account_id,
    facebook_page_id,
    connected_at: now,
    last_refreshed_at: now,
    status: 'active',
  })

  if (insertError) {
    return jsonError('db_insert', insertError.message, 500)
  }

  return NextResponse.json({ success: true, instagram_account_id })
}

