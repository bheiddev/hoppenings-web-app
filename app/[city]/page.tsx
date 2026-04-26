import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { EventCard } from '@/components/EventCard'
import { BreweryCard } from '@/components/BreweryCard'
import { BeerReleaseCard } from '@/components/BeerReleaseCard'
import { getAllBreweriesWithSlugs } from '@/lib/breweries'
import { getAllEventsWithSlugs } from '@/lib/events'
import { getAllReleasesWithSlugs } from '@/lib/releases'
import {
  ACTIVITY_CONFIG,
  CITY_CONFIG,
  CitySlug,
  filterBreweriesForCity,
  filterEventsForCity,
  filterReleasesForCity,
} from '@/lib/seoCities'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export async function generateStaticParams() {
  return Object.keys(CITY_CONFIG).map((city) => ({ city }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city } = await params
  if (!(city in CITY_CONFIG)) return { title: 'City Not Found | Hoppenings' }
  const c = CITY_CONFIG[city as CitySlug]
  const title = `Brewery Events in ${c.name}, Colorado | Hoppenings`
  const description = `Find breweries, beer releases, trivia nights, run clubs, and live music in ${c.name}. Updated local listings from Hoppenings.`
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${city}` },
    openGraph: { title, description, type: 'website', url: `${BASE_URL}/${city}` },
  }
}

export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  if (!(city in CITY_CONFIG)) notFound()
  const citySlug = city as CitySlug
  const cityConfig = CITY_CONFIG[citySlug]

  const [breweries, events, releases] = await Promise.all([
    getAllBreweriesWithSlugs(),
    getAllEventsWithSlugs(),
    getAllReleasesWithSlugs(),
  ])

  const cityBreweries = filterBreweriesForCity(breweries, citySlug)
  const cityEvents = filterEventsForCity(events, citySlug)
  const cityReleases = filterReleasesForCity(releases, citySlug)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Where can I find trivia nights in ${cityConfig.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Use Hoppenings to browse weekly trivia nights and recurring brewery events in ${cityConfig.name}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What are the best breweries in ${cityConfig.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Hoppenings lists local breweries in ${cityConfig.name} with details, events, and new releases.`,
        },
      },
    ],
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Brewery Events in {cityConfig.name}, Colorado
        </h1>
        <p className="text-base mb-8 max-w-4xl" style={{ color: Colors.textPrimary }}>
          Hoppenings tracks the local craft beer scene in {cityConfig.name}, including brewery events,
          trivia nights, run clubs, live music, and new beer releases. Browse this week&apos;s happenings,
          discover taprooms, and jump into activity-specific pages below for quick planning.
        </p>

        <div className="flex flex-wrap gap-3 mb-10">
          {Object.entries(ACTIVITY_CONFIG).map(([slug, activity]) => (
            <Link
              key={slug}
              href={`/${citySlug}/${slug}`}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: Colors.primary, color: Colors.primaryDark }}
            >
              {activity.label}
            </Link>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.textPrimary }}>
            Breweries in {cityConfig.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cityBreweries.slice(0, 18).map((brewery) => (
              <BreweryCard key={brewery.id} brewery={brewery} />
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.textPrimary }}>
            This Week&apos;s Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cityEvents.slice(0, 18).map((event) => (
              <EventCard key={event.id} event={event} isFeatured={event.featured} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.textPrimary }}>
            Recent Beer Releases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cityReleases.slice(0, 18).map((release) => (
              <BeerReleaseCard key={release.id} beerRelease={release} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
