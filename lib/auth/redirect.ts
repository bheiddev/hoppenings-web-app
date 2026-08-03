/**
 * Web OAuth / email confirm / password-reset callback URL.
 * Uses the current origin in the browser so localhost and production both work
 * (both must be listed in Supabase Auth → Redirect URLs).
 */
export function getAuthCallbackUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://hoppeningsco.com'
  return `${site}/auth/callback`
}
