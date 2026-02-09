import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth redirect service for the mobile app.
 *
 * The app opens this URL first (e.g. https://hoppeningsco.com/oauth?url=<encoded-supabase-auth-url>)
 * so the system prompt shows "Hoppenings wants to use hoppeningsco.com" instead of Supabase.
 * This route immediately 302-redirects to the Supabase auth URL; no UI, no extra step.
 *
 * Flow:
 * 1. App gets data.url from signInWithOAuth({ provider: 'google', ... })
 * 2. App opens: https://<your-domain>/oauth?url=<encodeURIComponent(data.url)>
 * 3. This route validates and redirects to data.url
 * 4. User completes Google flow on Supabase → redirects to hoppenings://auth/callback
 * 5. App handles callback and exchangeCodeForSession as today
 */

const SUPABASE_AUTH_PATH = '/auth/v1/authorize'

function getAllowedOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  try {
    const u = new URL(url)
    return u.origin
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const encoded = request.nextUrl.searchParams.get('url')

  if (!encoded || encoded.length === 0) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  let target: URL
  try {
    const decoded = decodeURIComponent(encoded)
    target = new URL(decoded)
  } catch {
    return new NextResponse('Invalid url parameter', { status: 400 })
  }

  const allowedOrigin = getAllowedOrigin()
  if (!allowedOrigin) {
    return new NextResponse('OAuth redirect not configured', { status: 500 })
  }

  if (target.origin !== allowedOrigin) {
    return new NextResponse('Invalid redirect target', { status: 400 })
  }

  if (!target.pathname.includes(SUPABASE_AUTH_PATH)) {
    return new NextResponse('Invalid redirect target', { status: 400 })
  }

  return NextResponse.redirect(target.toString(), 302)
}
