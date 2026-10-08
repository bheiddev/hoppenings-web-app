import type { Metadata } from 'next'
import { OpenAppLanding } from '@/components/OpenAppLanding'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const query = await searchParams
  const noRedirectRaw = query['no-redirect']
  const noRedirect =
    (Array.isArray(noRedirectRaw) ? noRedirectRaw[0] : noRedirectRaw) === '1'

  return {
    title: 'Hoppenings – Perks',
    description: 'Open Hoppenings to view brewery perks, or download the app.',
    robots: { index: false, follow: false },
    other: {
      'apple-itunes-app': `app-id=6749239343, app-argument=${SITE_URL}/perks${
        noRedirect ? '?no-redirect=1' : ''
      }`,
    },
  }
}

export default async function PerksDeepLinkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = await searchParams
  const noRedirectRaw = query['no-redirect']
  const noRedirect =
    (Array.isArray(noRedirectRaw) ? noRedirectRaw[0] : noRedirectRaw) === '1'

  return <OpenAppLanding noRedirect={noRedirect} />
}
