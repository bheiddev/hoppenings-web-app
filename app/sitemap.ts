import type { MetadataRoute } from 'next'
import { getAllReleasesWithSlugs } from '@/lib/releases'
import { getAllEventsWithSlugs } from '@/lib/events'
import { getAllBreweriesWithSlugs } from '@/lib/breweries'
import { ACTIVITY_CONFIG, CITY_CONFIG } from '@/lib/seoCities'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export const revalidate = 3600

/**
 * Sitemap only lists indexable URLs (see lib/contentExpiry.ts).
 * Expired release/event URLs are not included; visits to those URLs get a 301 to the listing page.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [releases, events, breweries] = await Promise.all([
    getAllReleasesWithSlugs(),
    getAllEventsWithSlugs(),
    getAllBreweriesWithSlugs(),
  ])

  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/releases`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/breweries`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ]

  const cityPages: MetadataRoute.Sitemap = Object.keys(CITY_CONFIG).map((city) => ({
    url: `${BASE_URL}/${city}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  const cityCategoryPages: MetadataRoute.Sitemap = Object.keys(CITY_CONFIG).flatMap((city) => ([
    {
      url: `${BASE_URL}/${city}/breweries`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/${city}/releases`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ]))

  const cityActivityPages: MetadataRoute.Sitemap = Object.keys(CITY_CONFIG).flatMap((city) =>
    Object.keys(ACTIVITY_CONFIG).map((activity) => ({
      url: `${BASE_URL}/${city}/${activity}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.75,
    }))
  )

  const releasePages: MetadataRoute.Sitemap = releases.map((r) => ({
    url: `${BASE_URL}/releases/${r.slug}`,
    lastModified: new Date(r.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const eventPages: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${BASE_URL}/events/${e.slug}`,
    lastModified: new Date(e.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const breweryPages: MetadataRoute.Sitemap = breweries.map((b) => ({
    url: `${BASE_URL}/breweries/${b.slug}`,
    lastModified: new Date(b.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...cityPages,
    ...cityCategoryPages,
    ...cityActivityPages,
    ...releasePages,
    ...eventPages,
    ...breweryPages,
  ]
}
