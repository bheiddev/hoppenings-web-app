type MetaTokenResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
  error?: {
    message?: string
    type?: string
    code?: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

type MetaAccountsResponse = {
  data?: Array<{
    id?: string
    name?: string
    instagram_business_account?: { id?: string } | null
  }>
  error?: MetaTokenResponse['error']
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v || v.length === 0) throw new Error(`Missing env var: ${name}`)
  return v
}

export function getMetaConfig() {
  return {
    appId: requireEnv('META_APP_ID'),
    appSecret: requireEnv('META_APP_SECRET'),
    redirectUri: requireEnv('META_REDIRECT_URI'),
  }
}

function metaErrorToString(error: MetaTokenResponse['error'] | undefined): string | null {
  if (!error) return null
  const parts = [
    error.message ? `message=${error.message}` : null,
    error.type ? `type=${error.type}` : null,
    typeof error.code === 'number' ? `code=${error.code}` : null,
    typeof error.error_subcode === 'number' ? `subcode=${error.error_subcode}` : null,
    error.fbtrace_id ? `trace=${error.fbtrace_id}` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' ') : 'Unknown Meta error'
}

async function fetchJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const res = await fetch(url, { method: 'GET', cache: 'no-store' })
  const text = await res.text()
  let json: any
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }

  if (!res.ok) {
    const metaErr = json?.error ? metaErrorToString(json.error) : null
    return { ok: false, error: metaErr ?? `HTTP ${res.status}` }
  }

  return { ok: true, data: json as T }
}

export async function exchangeCodeForShortLivedToken(code: string) {
  const { appId, appSecret, redirectUri } = getMetaConfig()
  const url =
    `https://graph.facebook.com/v19.0/oauth/access_token` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&client_secret=${encodeURIComponent(appSecret)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code=${encodeURIComponent(code)}`

  const r = await fetchJson<MetaTokenResponse>(url)
  if (!r.ok) return r

  const token = r.data.access_token
  if (!token) return { ok: false as const, error: 'Meta did not return access_token for code exchange' }

  return { ok: true as const, data: r.data }
}

export async function exchangeShortForLongLivedToken(shortToken: string) {
  const { appId, appSecret } = getMetaConfig()
  const url =
    `https://graph.facebook.com/v19.0/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${encodeURIComponent(appId)}` +
    `&client_secret=${encodeURIComponent(appSecret)}` +
    `&fb_exchange_token=${encodeURIComponent(shortToken)}`

  const r = await fetchJson<MetaTokenResponse>(url)
  if (!r.ok) return r

  const token = r.data.access_token
  if (!token) return { ok: false as const, error: 'Meta did not return access_token for long-lived token exchange' }

  return { ok: true as const, data: r.data }
}

export async function fetchPagesWithInstagramBusiness(longToken: string) {
  const url =
    `https://graph.facebook.com/v19.0/me/accounts` +
    `?fields=${encodeURIComponent('id,name,instagram_business_account')}` +
    `&access_token=${encodeURIComponent(longToken)}`

  const r = await fetchJson<MetaAccountsResponse>(url)
  if (!r.ok) return r

  const pages = r.data.data ?? []
  const first = pages.find((p) => p.instagram_business_account?.id && p.id)
  if (!first || !first.id || !first.instagram_business_account?.id) {
    return {
      ok: false as const,
      error:
        'No Facebook Page with an instagram_business_account was found for this login. Ensure the Instagram Business account is connected to a Facebook Page and the user has access.',
    }
  }

  return {
    ok: true as const,
    data: {
      facebook_page_id: first.id,
      instagram_account_id: first.instagram_business_account.id,
      page_name: first.name ?? null,
    },
  }
}

