import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: ['/admin', '/admin/', '/breweries-events', '/breweries-events/', '/profile', '/account', '/auth'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
