import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getReleaseBySlug, getReleaseBySlugIncludingExpired, getAllReleasesWithSlugs, getReleaseBreweries } from '@/lib/releases'
import { EXPIRED_RELEASE_REDIRECT } from '@/lib/contentExpiry'
import { formatReleaseDate } from '@/lib/utils'
import { generateBrewerySlug } from '@/lib/slug'
import { Colors } from '@/lib/colors'
import Image from 'next/image'
import Link from 'next/link'
import { BackLink } from '@/components/BackLink'
import { PoshCta, PoshEyebrow, PoshPageShell, PoshSectionTitle } from '@/components/PoshPageShell'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hoppeningsco.com'

export async function generateStaticParams() {
  const releases = await getAllReleasesWithSlugs()
  return releases.map((release) => ({
    slug: release.slug,
  }))
}

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const release = await getReleaseBySlug(slug)

  if (!release) {
    return {
      title: 'Beer Release Not Found | Hoppenings',
    }
  }

  const breweryName = release.breweries.name
  const location = release.breweries.location || ''
  const city = location ? location.split(',')[0].trim() : 'Colorado'
  const releaseDate = release.release_date ? formatReleaseDate(release.release_date) : ''
  const description = release.description
    ? `${release.description.substring(0, 155)}...`
    : `New ${release.beer_name}${release.Type ? ` ${release.Type}` : ''} release${releaseDate ? ` on ${releaseDate}` : ''} at ${breweryName}.`

  return {
    title: `${release.beer_name}${release.Type ? ` ${release.Type}` : ''} | ${city} Beer Release | Hoppenings`,
    description: description,
    keywords: `${release.beer_name}, ${release.Type || 'beer'}, ${breweryName}, ${location}, beer release, craft beer${releaseDate ? `, ${releaseDate}` : ''}`,
    alternates: {
      canonical: `${BASE_URL}/releases/${release.slug}`,
    },
    openGraph: {
      title: `${release.beer_name}${release.Type ? ` - ${release.Type}` : ''} at ${breweryName}`,
      description: description,
      type: 'article',
      url: `${BASE_URL}/releases/${release.slug}`,
    },
  }
}

export default async function ReleaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const release = await getReleaseBySlug(slug)

  if (!release) {
    const expiredRelease = await getReleaseBySlugIncludingExpired(slug)
    if (expiredRelease) {
      permanentRedirect(EXPIRED_RELEASE_REDIRECT)
    }
    notFound()
  }
  if (slug !== release.slug) {
    permanentRedirect(`/releases/${release.slug}`)
  }

  const associatedBreweries = await getReleaseBreweries(release)
  const heroBrewery = associatedBreweries[0] ?? null

  const releaseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: release.beer_name,
    description: release.description || undefined,
    brand: release.breweries.name,
    category: release.Type || 'Beer',
    releaseDate: release.release_date || undefined,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
      price: '0',
      url: `${BASE_URL}/releases/${release.slug}`,
    },
  }

  return (
    <PoshPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(releaseJsonLd) }} />

      {heroBrewery?.image_url ? (
        <div className="relative h-[42vh] min-h-[240px] w-full overflow-hidden sm:h-[48vh]">
          <Image
            src={heroBrewery.image_url}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(58,21,21,0.95) 0%, rgba(58,21,21,0.45) 45%, rgba(58,21,21,0.25) 100%)',
            }}
            aria-hidden
          />
        </div>
      ) : null}

      <div
        className={`mx-auto max-w-4xl px-6 sm:px-10 lg:px-12 lg:pb-14 ${
          heroBrewery?.image_url ? 'py-10 lg:pt-14' : 'pb-10 pt-24 lg:pb-14 lg:pt-28'
        }`}
      >
        <BackLink
          fallbackHref="/releases"
          style={{ color: 'rgba(249, 247, 242, 0.75)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        />

        <PoshEyebrow>{release.Type || 'Beer Release'}</PoshEyebrow>
        <h1
          className="hop-home-fade mb-6 font-bold uppercase leading-[0.95] tracking-wide text-[clamp(2rem,7vw,4.25rem)]"
          style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {release.beer_name}
        </h1>

        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2">
          {release.ABV ? (
            <span
              className="text-sm uppercase tracking-[0.14em]"
              style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              ABV: {release.ABV}
            </span>
          ) : null}
          {release.release_date ? (
            <span
              className="text-sm uppercase tracking-[0.14em]"
              style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              {formatReleaseDate(release.release_date)}
            </span>
          ) : null}
        </div>

        {release.description ? (
          <p
            className="mb-12 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: 'rgba(249, 247, 242, 0.82)', fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            {release.description}
          </p>
        ) : null}

        {associatedBreweries.length > 0 ? (
          <div className="border-t border-white/10 pt-10">
            <PoshSectionTitle>Available At</PoshSectionTitle>
            <ul className="flex flex-col">
              {associatedBreweries.map((brewery) => {
                const brewerySlug = generateBrewerySlug(brewery.name, brewery.location, brewery.id)
                return (
                  <li key={brewery.id} className="border-t border-white/10 py-8">
                    <Link href={`/breweries/${brewerySlug}`} className="group block">
                      <h3
                        className="mb-4 text-2xl font-bold uppercase tracking-wide transition-opacity group-hover:opacity-90 sm:text-3xl"
                        style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                      >
                        {brewery.name}
                      </h3>
                    </Link>

                    {brewery.image_url && associatedBreweries.length > 1 ? (
                      <div className="relative mb-5 h-56 w-full overflow-hidden sm:h-72">
                        <Image
                          src={brewery.image_url}
                          alt={brewery.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : null}

                    {brewery.description ? (
                      <p
                        className="mb-6 max-w-2xl text-base leading-relaxed"
                        style={{
                          color: 'rgba(249, 247, 242, 0.72)',
                          fontFamily: 'var(--font-be-vietnam-pro)',
                        }}
                      >
                        {brewery.description}
                      </p>
                    ) : null}

                    <PoshCta href={`/breweries/${brewerySlug}`}>View Brewery</PoshCta>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </PoshPageShell>
  )
}
