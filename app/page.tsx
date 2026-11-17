import type { Metadata } from 'next'
import { PoshLanding } from '@/components/PoshLanding'
import {
  displayNameForRegionSlug,
  listPublicRegionBuckets,
  REGION_LINK_ORDER,
} from '@/lib/seoCities'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Hoppenings | Colorado Brewery Guide by Region',
  description:
    'Choose your Colorado region to explore tonight\'s taprooms, events, and releases across the Front Range.',
  openGraph: {
    title: 'Hoppenings | Colorado Brewery Guide by Region',
    description:
      'Choose your Colorado region to explore tonight\'s taprooms, events, and releases.',
  },
}

export default async function Home() {
  const regionBuckets = await listPublicRegionBuckets()
  const regionLinks = regionBuckets
    .map((bucket) => ({
      label: displayNameForRegionSlug(bucket.slug, bucket.displayLabel),
      href: `/${bucket.slug}`,
      slug: bucket.slug,
    }))
    .sort((a, b) => {
      const ai = REGION_LINK_ORDER.indexOf(a.slug)
      const bi = REGION_LINK_ORDER.indexOf(b.slug)
      if (ai === -1 && bi === -1) return a.label.localeCompare(b.label)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    .map(({ label, href }) => ({ label, href }))

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
      links={regionLinks}
      linksAriaLabel="Choose a region"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
    </PoshLanding>
  )
}
