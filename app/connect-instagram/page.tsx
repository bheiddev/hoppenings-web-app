import { Metadata } from 'next'
import Link from 'next/link'
import { Colors } from '@/lib/colors'

export const metadata: Metadata = {
  title: 'Connect Instagram | Hoppenings',
  description: 'Connect your Instagram Business account to Hoppenings.',
}

const OAUTH_BASE_URL = 'https://www.facebook.com/v19.0/dialog/oauth'
const REDIRECT_URI = 'https://hoppeningsco.com/connect-instagram/callback'
const SCOPE = 'instagram_basic,instagram_manage_insights,pages_read_engagement'

export default function ConnectInstagramPage() {
  // Next.js server components can read both NEXT_PUBLIC_* and VITE_* env vars.
  // This keeps the route resilient if the env naming differs between environments.
  const clientId = process.env.NEXT_PUBLIC_META_APP_ID ?? process.env.VITE_META_APP_ID

  const oauthUrl = clientId
    ? `${OAUTH_BASE_URL}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&scope=${encodeURIComponent(SCOPE)}&response_type=code`
    : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/breweries"
            className="inline-flex items-center gap-2 mb-4 text-sm font-medium hover:underline"
            style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
            </svg>
            Back to Breweries
          </Link>

          <h1 className="text-4xl font-bold mb-2" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
            Connect Instagram
          </h1>

          <p className="text-base leading-relaxed" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
            Let Hoppenings display your latest Instagram posts to craft beer fans in your area
          </p>
        </div>

        <div
          className="rounded-lg p-6"
          style={{ backgroundColor: Colors.background, borderColor: Colors.dividerLight, borderWidth: 1 }}
        >
          <h2 className="text-lg font-bold mb-3" style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}>
            What we’ll access
          </h2>

          <ul className="list-disc pl-5 space-y-2 text-sm" style={{ color: Colors.textDark, fontFamily: 'var(--font-be-vietnam-pro)' }}>
            <li>Read your posts so your latest updates can be shown on Hoppenings.</li>
            <li>Read your profile info so we can verify you connected the right Instagram Business account.</li>
            <li>Read insights so we can improve what we display (we never post or message on your behalf).</li>
            <li>We never post on your behalf — you’re always in control of your Instagram.</li>
          </ul>

          <div className="mt-8 flex justify-center">
            {oauthUrl ? (
              <a
                href={oauthUrl}
                className="inline-flex items-center justify-center gap-2 px-10 py-3 rounded-full font-semibold text-base transition-colors hover:opacity-90"
                style={{
                  backgroundColor: Colors.primary,
                  color: Colors.textDark,
                  fontFamily: 'var(--font-fjalla-one)',
                }}
              >
                Connect Instagram
              </a>
            ) : (
              <div className="text-sm" style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
                Instagram integration isn’t configured yet. Please contact support.
              </div>
            )}
          </div>

          {oauthUrl && (
            <p className="mt-4 text-xs" style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              You’ll be redirected to Meta to authorize access.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

