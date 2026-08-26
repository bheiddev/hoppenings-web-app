import type { Metadata } from 'next'
import { PoshLanding } from '@/components/PoshLanding'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

const REGIONS = [
  { label: 'Colorado Springs', href: '/colorado-springs' },
  { label: 'Fort Collins', href: '/fort-collins' },
  { label: 'Boulder & Longmont', href: '/boulder-longmont' },
] as const

export const metadata: Metadata = {
  title: 'Hoppenings | Colorado Brewery Guide by Region',
  description:
    'Choose your Colorado region to explore taproom events, beer releases, and local breweries across Colorado Springs, Fort Collins, and Boulder & Longmont.',
  openGraph: {
    title: 'Hoppenings | Colorado Brewery Guide by Region',
    description:
      'Choose your Colorado region to explore taproom events, beer releases, and local breweries.',
  },
}

export default function Home() {
  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Hoppenings',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/events`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <PoshLanding
      eyebrow="Colorado craft"
      title={
        <span className="font-bold uppercase leading-[0.9] tracking-wide text-[clamp(3.25rem,14vw,8.5rem)]">
          Hoppenings
        </span>
      }
      subtitle="Select a region to explore tonight's taprooms, events, and releases."
      links={[...REGIONS]}
      linksAriaLabel="Choose a region"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
    </PoshLanding>
  )
}
