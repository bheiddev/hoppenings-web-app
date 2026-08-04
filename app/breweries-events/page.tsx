import { redirect } from 'next/navigation'

/** Legacy path — Content Admin now lives at /admin */
export default function BreweriesEventsRedirectPage() {
  redirect('/admin')
}
