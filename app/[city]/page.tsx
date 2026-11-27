import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  RegionExploreLanding,
  type ExploreDayGroup,
  type ExploreDayPage,
  type ExploreSection,
  type ExploreTeaserItem,
} from '@/components/RegionExploreLanding'
import { RegionSeoContent } from '@/components/RegionSeoContent'
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
  getTodayMountainDateString,
  isEventInPast,
  normalizeEventDateToMountainTime,
} from '@/lib/utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'
const EVENT_DAY_HORIZON = 14

export async function generateStaticParams() {
  const buckets = await listPublicRegionBuckets()
  return buckets.map((bucket) => ({ city: bucket.slug }))
}

async function regionHubStats(citySlug: string) {
  const today = getTodayMountainDateString()
  const [breweries, events, releases] = await Promise.all([
    getAllBreweriesWithSlugs(),
    getAllEventsWithSlugs(),
    getAllReleasesWithSlugs(),
  ])
  const cityBreweries = filterBreweriesForCity(breweries, citySlug)
  const cityEvents = filterEventsForCity(events, citySlug)
  const cityReleases = filterReleasesForCity(releases, citySlug)
  const todayEvents = cityEvents.filter(
    (e) => normalizeEventDateToMountainTime(e.event_date) === today
  )
  const deals = await getHappyHourDealsForBreweryIds(cityBreweries.map((b) => b.id))
  const todayHappyHours = getHappyHourDealsForCalendarDate(deals, today)
  return {
    breweryCount: cityBreweries.length,
    eventCountToday: todayEvents.length,
    releaseCount: cityReleases.length,
    happyHourCountToday: todayHappyHours.length,
    todayLabel: formatEventDateShort(today),
  }
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
  const stats = await regionHubStats(region.slug)

  const title = `${cityName} Brewery Guide — Events, Releases & Taprooms | Hoppenings`
  const description = `Daily-updated ${cityName} brewery guide: ${stats.eventCountToday} event${stats.eventCountToday === 1 ? '' : 's'} today, ${stats.releaseCount} beer release${stats.releaseCount === 1 ? '' : 's'}, ${stats.happyHourCountToday} happy hour${stats.happyHourCountToday === 1 ? '' : 's'}, and ${stats.breweryCount} taprooms. Crawled from local brewery posts — junk filtered out.`

  return {
    title,
    description,
    keywords: `${cityName} breweries, ${cityName} brewery events, ${cityName} beer releases, trivia ${cityName}, craft beer ${cityName}, Colorado brewery guide`,
    alternates: { canonical: `${BASE_URL}/${city}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${BASE_URL}/${city}`,
      siteName: 'Hoppenings',
    },
    twitter: { card: 'summary_large_image', title, description },
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

  const todayYmd = getTodayMountainDateString()
  const todayEvents = cityEvents
    .filter((e) => normalizeEventDateToMountainTime(e.event_date) === todayYmd)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  const todayHappyHours = getHappyHourDealsForCalendarDate(cityHappyHourDeals, todayYmd)
  const todayLabel = formatEventDateShort(todayYmd)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hoppenings', item: BASE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: cityName,
        item: `${BASE_URL}/${citySlug}`,
      },
    ],
  }

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cityName} Brewery Guide`,
    description: `Daily-updated brewery events, beer releases, happy hours, and taprooms in ${cityName}, Colorado.`,
    url: `${BASE_URL}/${citySlug}`,
    isPartOf: { '@type': 'WebSite', name: 'Hoppenings', url: BASE_URL },
    about: {
      '@type': 'Place',
      name: cityName,
      address: { '@type': 'PostalAddress', addressLocality: cityName, addressRegion: 'CO', addressCountry: 'US' },
    },
  }

  const todayEventsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Brewery events in ${cityName} — ${todayLabel}`,
    numberOfItems: todayEvents.length,
    itemListElement: todayEvents.slice(0, 30).map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${BASE_URL}/events/${event.slug}`,
      name: `${event.title} at ${event.breweries.name}`,
    })),
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What's happening at breweries in ${cityName} today?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            todayEvents.length > 0
              ? `Hoppenings lists ${todayEvents.length} brewery event${todayEvents.length === 1 ? '' : 's'} in ${cityName} for ${todayLabel}, including ${todayEvents
                  .slice(0, 5)
                  .map((e) => `${e.title} at ${e.breweries.name}`)
                  .join('; ')}. Listings are crawled daily from brewery posts.`
              : `Hoppenings tracks brewery events in ${cityName} daily. Check back for tonight's lineup, or browse the full ${cityName} calendar.`,
        },
      },
      {
        '@type': 'Question',
        name: `Where can I find new beer releases in ${cityName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Hoppenings currently lists ${cityReleases.length} beer release${cityReleases.length === 1 ? '' : 's'} for ${cityName} taprooms, updated from brewery announcements.`,
        },
      },
      {
        '@type': 'Question',
        name: `How many breweries are in ${cityName} on Hoppenings?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Hoppenings covers ${cityBreweries.length} brewery taproom${cityBreweries.length === 1 ? '' : 's'} in ${cityName}, with events, releases, and happy hours.`,
        },
      },
    ],
  }

  const subtitle = `${todayEvents.length} event${todayEvents.length === 1 ? '' : 's'} today · ${cityReleases.length} release${cityReleases.length === 1 ? '' : 's'} · ${cityBreweries.length} taprooms — updated daily from local brewery posts.`

  return (
    <>
      <RegionExploreLanding cityName={cityName} subtitle={subtitle} sections={sections}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(todayEventsJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </RegionExploreLanding>
      <div className="bg-[#3A1515]">
        <RegionSeoContent
          cityName={cityName}
          citySlug={citySlug}
          todayLabel={todayLabel}
          breweryCount={cityBreweries.length}
          eventCountToday={todayEvents.length}
          releaseCount={cityReleases.length}
          happyHourCountToday={todayHappyHours.length}
          todayEvents={todayEvents.slice(0, 40).map((event) => ({
            href: `/events/${event.slug}`,
            title: event.title,
            meta: [formatTime12Hour(event.start_time), event.breweries.name]
              .filter(Boolean)
              .join(' · '),
          }))}
          releases={flattenReleaseSections(splitReleasesForDisplay(cityReleases))
            .slice(0, 20)
            .map((release) => ({
              href: `/releases/${release.slug}`,
              title: release.beer_name,
              meta: [release.breweries.name, release.Type].filter(Boolean).join(' · '),
            }))}
          breweries={sortedCityBreweries.map((brewery) => ({
            href: `/breweries/${brewery.slug}`,
            title: brewery.name,
          }))}
        />
      </div>
    </>
  )
}
