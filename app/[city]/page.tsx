import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  RegionExploreLanding,
  type ExploreSection,
  type ExploreTeaserItem,
} from '@/components/RegionExploreLanding'
import { getAllBreweriesWithSlugs } from '@/lib/breweries'
import { getAllEventsWithSlugs } from '@/lib/events'
import { getAllReleasesWithSlugs } from '@/lib/releases'
import {
  ACTIVITY_CONFIG,
  ActivitySlug,
  CITY_CONFIG,
  CitySlug,
  filterBreweriesForCity,
  filterEventsForActivity,
  filterEventsForCity,
  filterReleasesForCity,
} from '@/lib/seoCities'
import {
  formatEventDateShort,
  formatReleaseDate,
  formatTime12Hour,
  getMountainDateRangeFromToday,
  isEventInPast,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'
const TEASER_LIMIT = 5
const EVENT_DAY_HORIZON = 14

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

export const dynamic = 'force-dynamic'

function eventTeaser(event: {
  id: string
  title: string
  slug: string
  start_time: string | null
  event_date: string
  description?: string | null
  breweries: { name: string; image_url?: string | null }
}): ExploreTeaserItem {
  const time = formatTime12Hour(event.start_time)
  return {
    id: event.id,
    title: event.title,
    subtitle: event.breweries.name,
    meta: time || undefined,
    description: event.description?.trim() || undefined,
    href: `/events/${event.slug}`,
    imageUrl: event.breweries.image_url ?? null,
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
  const breweryImageById = new Map(
    cityBreweries.map((brewery) => [brewery.id, brewery.image_url || brewery.tap_image || null])
  )

  const upcomingEvents = cityEvents
    .filter((event) => !isEventInPast(event.event_date))
    .sort((a, b) => {
      const byDate = a.event_date.localeCompare(b.event_date)
      if (byDate !== 0) return byDate
      return (a.start_time || '').localeCompare(b.start_time || '')
    })

  const eventDayPages = getMountainDateRangeFromToday(EVENT_DAY_HORIZON).map((ymd) => {
    const dayEvents = cityEvents
      .filter((event) => normalizeEventDateToMountainTime(event.event_date) === ymd)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    const dateLabel = formatEventDateShort(ymd)
    return {
      dateLabel,
      items: dayEvents.slice(0, TEASER_LIMIT).map(eventTeaser),
      emptyMessage: `No events listed for ${dateLabel} in ${cityConfig.name}. Browse the full calendar for what's coming up.`,
    }
  })

  const breweryTeasers: ExploreTeaserItem[] = cityBreweries
    .slice()
    .sort((a, b) => {
      const aImg = a.image_url || a.tap_image ? 0 : 1
      const bImg = b.image_url || b.tap_image ? 0 : 1
      if (aImg !== bImg) return aImg - bImg
      return a.name.localeCompare(b.name)
    })
    .slice(0, TEASER_LIMIT)
    .map((brewery) => ({
      id: brewery.id,
      title: brewery.name,
      subtitle: brewery.location || undefined,
      href: `/breweries/${brewery.slug}`,
      imageUrl: brewery.image_url || brewery.tap_image,
    }))

  const releaseTeasers: ExploreTeaserItem[] = cityReleases
    .slice()
    .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
    .slice(0, TEASER_LIMIT)
    .map((release) => ({
      id: release.id,
      title: release.beer_name,
      subtitle: release.breweries.name,
      meta: formatReleaseDate(release.release_date) || release.Type || undefined,
      description: release.description?.trim() || undefined,
      href: `/releases/${release.slug}`,
      imageUrl: breweryImageById.get(release.brewery_id) ?? null,
    }))

  const sections: ExploreSection[] = [
    {
      id: 'events',
      label: 'Events',
      href: `/${citySlug}/events`,
      panelLabel: eventDayPages[0]?.dateLabel ?? 'Events',
      emptyMessage:
        eventDayPages[0]?.emptyMessage ??
        `No events listed in ${cityConfig.name}. Browse the full calendar for what's coming up.`,
      items: eventDayPages[0]?.items ?? [],
      dayPages: eventDayPages,
    },
    {
      id: 'breweries',
      label: 'Breweries',
      href: `/${citySlug}/breweries`,
      panelLabel: `Taprooms in ${cityConfig.name}`,
      emptyMessage: `No breweries currently listed in ${cityConfig.name}.`,
      items: breweryTeasers,
    },
    {
      id: 'releases',
      label: 'Beer Releases',
      href: `/${citySlug}/releases`,
      panelLabel: 'Fresh on tap',
      emptyMessage: `No beer releases listed right now in ${cityConfig.name}.`,
      items: releaseTeasers,
    },
    ...(Object.keys(ACTIVITY_CONFIG) as ActivitySlug[]).map((activitySlug) => {
      const activity = ACTIVITY_CONFIG[activitySlug]
      const activityEvents = filterEventsForActivity(upcomingEvents, activitySlug)
      return {
        id: activitySlug,
        label: activity.label,
        href: `/${citySlug}/${activitySlug}`,
        panelLabel: `Upcoming in ${cityConfig.name}`,
        emptyMessage: `No upcoming ${activity.label.toLowerCase()} listed in ${cityConfig.name}.`,
        items: activityEvents.slice(0, TEASER_LIMIT).map(eventTeaser),
      }
    }),
  ]

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
    <RegionExploreLanding
      cityName={cityConfig.name}
      subtitle={`Select a category to preview what's on in ${cityConfig.name}, then open the full list.`}
      sections={sections}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </RegionExploreLanding>
  )
}
