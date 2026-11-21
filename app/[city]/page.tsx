import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  RegionExploreLanding,
  type ExploreDayGroup,
  type ExploreDayPage,
  type ExploreSection,
  type ExploreTeaserItem,
} from '@/components/RegionExploreLanding'
import { getAllBreweriesWithSlugs, getHappyHourDealsForBreweryIds } from '@/lib/breweries'
import {
  getBreweryCardContext,
  getBreweryCardContextMap,
} from '@/lib/breweryCardContext'
import {
  BREWERY_EVENT_ICON_SRC,
  getBreweryHoursStatusLabel,
  isBreweryOpenIconStatus,
} from '@/lib/breweryCardStatus'
import { getAllEventsWithSlugs } from '@/lib/events'
import {
  formatHappyHourWindow,
  getHappyHourDealsForCalendarDate,
} from '@/lib/happyHourDeals'
import { getAllReleasesWithSlugs } from '@/lib/releases'
import { flattenReleaseSections, splitReleasesForDisplay } from '@/lib/releaseSections'
import {
  ACTIVITY_CONFIG,
  ActivitySlug,
  displayNameForRegionSlug,
  filterBreweriesForCity,
  filterEventsForActivity,
  filterEventsForCity,
  filterReleasesForCity,
  listPublicRegionBuckets,
  resolvePublicRegion,
} from '@/lib/seoCities'
import {
  formatActivityDayGroupLabels,
  formatEventDateShort,
  formatReleaseDate,
  formatTime12Hour,
  getMountainDateRangeFromToday,
  isEventInPast,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'
const EVENT_DAY_HORIZON = 14

export async function generateStaticParams() {
  const buckets = await listPublicRegionBuckets()
  return buckets.map((bucket) => ({ city: bucket.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city } = await params
  const region = await resolvePublicRegion(city)
  if (!region) return { title: 'City Not Found | Hoppenings' }
  const cityName = displayNameForRegionSlug(region.slug, region.displayLabel)
  const title = `Brewery Events in ${cityName}, Colorado | Hoppenings`
  const description = `Find breweries, beer releases, trivia nights, run clubs, and live music in ${cityName}. Updated local listings from Hoppenings.`
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
  const region = await resolvePublicRegion(city)
  if (!region) notFound()
  const citySlug = region.slug
  const cityName = displayNameForRegionSlug(region.slug, region.displayLabel)

  const [breweries, events, releases, breweryCardContext] = await Promise.all([
    getAllBreweriesWithSlugs(),
    getAllEventsWithSlugs(),
    getAllReleasesWithSlugs(),
    getBreweryCardContextMap(),
  ])

  const cityBreweries = filterBreweriesForCity(breweries, citySlug)
  const cityEvents = filterEventsForCity(events, citySlug)
  const cityReleases = filterReleasesForCity(releases, citySlug)
  const cityHappyHourDeals = await getHappyHourDealsForBreweryIds(
    cityBreweries.map((brewery) => brewery.id)
  )
  const breweryById = new Map(cityBreweries.map((brewery) => [brewery.id, brewery]))
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
      items: dayEvents.map(eventTeaser),
      emptyMessage: `No events listed for ${dateLabel} in ${cityName}. Browse the full calendar for what's coming up.`,
    }
  })

  const sortedCityBreweries = cityBreweries
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))

  const breweryEmptyMessage = `No breweries currently listed in ${cityName}.`
  const breweryTeasers: ExploreTeaserItem[] = sortedCityBreweries.map((brewery) => {
    const context = getBreweryCardContext(breweryCardContext, brewery.id)
    const hoursLabel = getBreweryHoursStatusLabel(context.hoursStatus)
    const hoursOpen = isBreweryOpenIconStatus(context.hoursStatus)
    return {
      id: brewery.id,
      title: brewery.name,
      href: `/breweries/${brewery.slug}`,
      imageUrl: brewery.image_url || brewery.tap_image,
      breweryStatus: {
        hoursOpen,
        hoursLabel,
        hoursDetail: context.hoursDetail,
        hoursRange: context.hoursRange,
        releaseName:
          context.hasNewRelease && context.releaseName ? context.releaseName : null,
        eventTitle: context.todayEventTitle,
        eventIconSrc: BREWERY_EVENT_ICON_SRC[context.todayEventIcon],
        happyHourTitle: context.happyHourTitle,
        happyHourActive: context.happyHourActive,
      },
    }
  })

  const releaseTeasers: ExploreTeaserItem[] = flattenReleaseSections(
    splitReleasesForDisplay(cityReleases)
  ).map((release) => ({
    id: release.id,
    title: release.beer_name,
    subtitle: release.breweries.name,
    meta: formatReleaseDate(release.release_date) || release.Type || undefined,
    description: release.description?.trim() || undefined,
    href: `/releases/${release.slug}`,
    imageUrl: breweryImageById.get(release.brewery_id) ?? null,
  }))

  const happyHourDayPages: ExploreDayPage[] = getMountainDateRangeFromToday(
    EVENT_DAY_HORIZON
  ).map((ymd) => {
    const dateLabel = formatEventDateShort(ymd)
    const dayDeals = getHappyHourDealsForCalendarDate(cityHappyHourDeals, ymd)
    const items: ExploreTeaserItem[] = dayDeals
      .map((deal) => {
        const brewery = breweryById.get(deal.brewery_id)
        return {
          id: deal.id,
          title: deal.title,
          subtitle: brewery?.name,
          meta: formatHappyHourWindow(deal.time_start, deal.time_end),
          description: deal.description?.trim() || undefined,
          href: brewery ? `/breweries/${brewery.slug}` : `/${citySlug}`,
          imageUrl: brewery
            ? brewery.image_url || brewery.tap_image || null
            : null,
        }
      })
      .sort((a, b) => {
        const byBrewery = (a.subtitle || '').localeCompare(b.subtitle || '')
        if (byBrewery !== 0) return byBrewery
        return (a.meta || '').localeCompare(b.meta || '')
      })
    return {
      dateLabel,
      items,
      emptyMessage: `No happy hours listed for ${dateLabel} in ${cityName}.`,
    }
  })

  const sections: ExploreSection[] = [
    {
      id: 'events',
      label: 'Events',
      href: `/${citySlug}/events`,
      panelLabel: eventDayPages[0]?.dateLabel ?? 'Events',
      emptyMessage:
        eventDayPages[0]?.emptyMessage ??
        `No events listed in ${cityName}. Browse the full calendar for what's coming up.`,
      items: eventDayPages[0]?.items ?? [],
      dayPages: eventDayPages,
    },
    {
      id: 'breweries',
      label: 'Breweries',
      href: `/${citySlug}/breweries`,
      panelLabel: `Taprooms in ${cityName}`,
      emptyMessage: breweryEmptyMessage,
      items: breweryTeasers,
    },
    {
      id: 'releases',
      label: 'Beer Releases',
      href: `/${citySlug}/releases`,
      panelLabel: 'Fresh on tap',
      emptyMessage: `No beer releases listed right now in ${cityName}.`,
      items: releaseTeasers,
    },
    {
      id: 'happy-hours',
      label: 'Happy Hours',
      href: `/${citySlug}/happy-hours`,
      panelLabel: happyHourDayPages[0]?.dateLabel ?? 'Happy Hours',
      emptyMessage:
        happyHourDayPages[0]?.emptyMessage ??
        `No happy hours listed in ${cityName}.`,
      items: happyHourDayPages[0]?.items ?? [],
      dayPages: happyHourDayPages,
    },
    ...(Object.keys(ACTIVITY_CONFIG) as ActivitySlug[]).map((activitySlug) => {
      const activity = ACTIVITY_CONFIG[activitySlug]
      const activityEvents = filterEventsForActivity(upcomingEvents, activitySlug)

      const byDay = new Map<string, typeof activityEvents>()
      for (const event of activityEvents) {
        const ymd = normalizeEventDateToMountainTime(event.event_date)
        const list = byDay.get(ymd) ?? []
        list.push(event)
        byDay.set(ymd, list)
      }

      const dayGroups: ExploreDayGroup[] = [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ymd, dayEvents]) => {
          const labels = formatActivityDayGroupLabels(ymd)
          const sorted = [...dayEvents].sort((a, b) =>
            (a.start_time || '').localeCompare(b.start_time || '')
          )
          return {
            weekdayLabel: labels.weekdayLabel,
            dateLabel: labels.dateLabel,
            items: sorted.map(eventTeaser),
          }
        })

      return {
        id: activitySlug,
        label: activity.label,
        href: `/${citySlug}/${activitySlug}`,
        panelLabel: `Upcoming in ${cityName}`,
        emptyMessage: `No upcoming ${activity.label.toLowerCase()} listed in ${cityName}.`,
        items: [],
        dayGroups,
      }
    }),
  ]

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Where can I find trivia nights in ${cityName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Use Hoppenings to browse weekly trivia nights and recurring brewery events in ${cityName}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What are the best breweries in ${cityName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Hoppenings lists local breweries in ${cityName} with details, events, and new releases.`,
        },
      },
    ],
  }

  return (
    <RegionExploreLanding
      cityName={cityName}
      subtitle={`Select a category to preview what's on in ${cityName}, then open the full list.`}
      sections={sections}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </RegionExploreLanding>
  )
}
