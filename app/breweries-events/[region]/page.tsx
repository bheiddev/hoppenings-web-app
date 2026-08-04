import { redirect } from 'next/navigation'

/** Legacy path — Content Admin now lives at /admin/[region] */
export default async function BreweriesEventsRegionRedirectPage({
  params,
}: {
  params: Promise<{ region: string }>
}) {
  const { region } = await params
  redirect(`/admin/${region}`)
}
