import type { Metadata } from 'next'
import { CheckInLanding } from '@/components/CheckInLanding'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Hoppenings – Check in',
  description: 'Open Hoppenings to log your brewery visit, or download the app.',
  robots: { index: false, follow: false },
  other: {
    'apple-itunes-app': 'app-id=6749239343, app-argument=https://hoppenings.app/',
  },
}

export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ breweryId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { breweryId: rawBreweryId } = await params
  const query = await searchParams

  const breweryId = decodeURIComponent(rawBreweryId || '').trim()
  const tokenRaw = query.t ?? query.token
  const token = (Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw)?.trim() ?? ''
  const noRedirectRaw = query['no-redirect']
  const noRedirect =
    (Array.isArray(noRedirectRaw) ? noRedirectRaw[0] : noRedirectRaw) === '1'

  return (
    <CheckInLanding breweryId={breweryId} token={token} noRedirect={noRedirect} />
  )
}
