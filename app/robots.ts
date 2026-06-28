import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: ['/breweries-events', '/breweries-events/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
