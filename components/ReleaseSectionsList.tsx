import Link from 'next/link'
import { BeerReleaseCard } from '@/components/BeerReleaseCard'
import { CardCarousel } from '@/components/CardCarousel'
import { Colors } from '@/lib/colors'
import { formatReleaseDate } from '@/lib/utils'
import { splitReleasesForDisplay, type ReleaseListSection } from '@/lib/releaseSections'
import type { BeerRelease } from '@/types/supabase'

const ICON_SIZE = 28

function BeerIcon({ accent = true }: { accent?: boolean }) {
  return (
    <span
      className="mt-0.5 block shrink-0"
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: accent ? Colors.accent : Colors.primary,
        WebkitMaskImage: 'url(/beer.svg)',
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: 'url(/beer.svg)',
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
      aria-hidden
    />
  )
}

function SectionHeading({
  title,
  variant,
}: {
  title: string
  variant: 'posh' | 'light'
}) {
  return (
    <h2
      className="mb-2 text-2xl font-bold uppercase tracking-wide sm:text-3xl"
      style={{
        color: variant === 'posh' ? Colors.accent : Colors.primary,
        fontFamily: 'var(--font-fjalla-one)',
      }}
    >
      {title}
    </h2>
  )
}

function PoshReleaseRow({
  release,
  href,
  showBrewery,
}: {
  release: BeerRelease
  href: string
  showBrewery: boolean
}) {
  const meta = [
    showBrewery ? release.breweries?.name : null,
    release.Type,
    formatReleaseDate(release.release_date),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-3 border-t border-white/10 py-4 transition-opacity hover:opacity-85 sm:gap-4"
      >
        <BeerIcon />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-lg font-bold uppercase tracking-wide sm:text-xl"
            style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
          >
            {release.beer_name}
          </span>
          {meta ? (
            <span
              className="mt-1 block text-sm"
              style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              {meta}
            </span>
          ) : null}
          {release.description?.trim() ? (
            <span
              className="mt-1.5 block text-sm leading-snug line-clamp-2"
              style={{
                color: 'rgba(249, 247, 242, 0.62)',
                fontFamily: 'var(--font-be-vietnam-pro)',
              }}
            >
              {release.description.trim()}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  )
}

function LightReleaseRow({
  release,
  href,
}: {
  release: BeerRelease
  href: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="block border-t py-4 transition-opacity hover:opacity-85"
        style={{ borderColor: Colors.border }}
      >
        <span
          className="block text-lg font-bold uppercase tracking-wide sm:text-xl"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {release.beer_name}
        </span>
        {release.description ? (
          <span
            className="mt-1.5 block text-sm leading-snug line-clamp-2"
            style={{
              color: Colors.textSecondary,
              fontFamily: 'var(--font-be-vietnam-pro)',
            }}
          >
            {release.description}
          </span>
        ) : null}
        <span
          className="mt-1.5 block text-xs uppercase tracking-[0.14em]"
          style={{ color: Colors.primary, fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          {[release.Type, formatReleaseDate(release.release_date)].filter(Boolean).join(' · ')}
        </span>
      </Link>
    </li>
  )
}

function releaseHref(
  release: BeerRelease,
  getHref?: (release: BeerRelease) => string
): string {
  if (getHref) return getHref(release)
  // Fallback when caller did not attach slugs — detail pages prefer generateReleaseSlug upstream.
  return `/releases/${release.id}`
}

export function ReleaseSectionsList({
  releases,
  variant = 'posh',
  showBrewery = true,
  getHref,
  /** When true, Just Dropped has no section header (mobile parity). */
  hideJustDroppedHeading = true,
  mode = 'rows',
}: {
  releases: BeerRelease[]
  variant?: 'posh' | 'light'
  showBrewery?: boolean
  getHref?: (release: BeerRelease) => string
  hideJustDroppedHeading?: boolean
  mode?: 'rows' | 'cards'
}) {
  const sections = splitReleasesForDisplay(releases)
  if (sections.length === 0) return null

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <ReleaseSectionBlock
          key={section.id}
          section={section}
          variant={variant}
          showBrewery={showBrewery}
          getHref={getHref}
          hideJustDroppedHeading={hideJustDroppedHeading}
          mode={mode}
        />
      ))}
    </div>
  )
}

function ReleaseSectionBlock({
  section,
  variant,
  showBrewery,
  getHref,
  hideJustDroppedHeading,
  mode,
}: {
  section: ReleaseListSection
  variant: 'posh' | 'light'
  showBrewery: boolean
  getHref?: (release: BeerRelease) => string
  hideJustDroppedHeading: boolean
  mode: 'rows' | 'cards'
}) {
  const showHeading =
    section.title != null &&
    !(hideJustDroppedHeading && section.id === 'just-dropped')

  return (
    <section>
      {showHeading && section.title ? (
        <SectionHeading title={section.title} variant={variant} />
      ) : null}

      {mode === 'cards' ? (
        <CardCarousel>
          {section.releases.map((release) => (
            <BeerReleaseCard key={release.id} beerRelease={release} />
          ))}
        </CardCarousel>
      ) : (
        <ul className="flex flex-col">
          {section.releases.map((release) =>
            variant === 'posh' ? (
              <PoshReleaseRow
                key={release.id}
                release={release}
                href={releaseHref(release, getHref)}
                showBrewery={showBrewery}
              />
            ) : (
              <LightReleaseRow
                key={release.id}
                release={release}
                href={releaseHref(release, getHref)}
              />
            )
          )}
        </ul>
      )}
    </section>
  )
}
