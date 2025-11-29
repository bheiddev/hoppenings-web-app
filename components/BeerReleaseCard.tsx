import { BeerRelease } from '@/types/supabase';
import { formatReleaseDate } from '@/lib/utils';
import { generateReleaseSlug } from '@/lib/slug';
import Link from 'next/link';

interface BeerReleaseCardProps {
  beerRelease: BeerRelease;
}

export function BeerReleaseCard({ beerRelease }: BeerReleaseCardProps) {
  const slug = generateReleaseSlug(
    beerRelease.beer_name,
    beerRelease.Type,
    beerRelease.breweries.name,
    beerRelease.breweries.location || null,
    beerRelease.id
  )
  return (
    <div className="rounded-lg p-6 bg-white border border-zinc-200 shadow-sm">
      <div className="mb-3">
        <h3 className="text-xl font-bold mb-2 text-zinc-900" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
          {beerRelease.beer_name}
        </h3>
        {beerRelease.breweries && (
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-orange-500">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
            <span className="text-sm font-semibold text-zinc-700" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
              {beerRelease.breweries.name}
            </span>
          </div>
        )}
      </div>
      
      {beerRelease.description && (
        <p className="text-sm mb-4 line-clamp-2 text-zinc-600" style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}>
          {beerRelease.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {beerRelease.ABV && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-orange-500">
                <path d="M6 3h12v2H6V3zm0 16h12v2H6v-2zm6-13v12l-4-2V8l4-2z" fill="currentColor"/>
              </svg>
              <span className="text-xs font-medium text-zinc-700" style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}>
                ABV: {beerRelease.ABV}
              </span>
            </div>
          )}
          {beerRelease.release_date && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-orange-500">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
              </svg>
              <span className="text-xs font-medium text-zinc-700" style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}>
                {formatReleaseDate(beerRelease.release_date)}
              </span>
            </div>
          )}
        </div>
        <Link 
          href={`/releases/${slug}`}
          className="px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
          style={{ fontFamily: 'var(--font-fjalla-one)' }}
        >
          VIEW RELEASE
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-current">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

