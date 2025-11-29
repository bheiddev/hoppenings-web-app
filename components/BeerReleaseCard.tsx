import { BeerRelease } from '@/types/supabase';
import { formatReleaseDate } from '@/lib/utils';
import { generateReleaseSlug } from '@/lib/slug';
import { Colors } from '@/lib/colors';
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
    <div 
      className="rounded-lg p-6 border shadow-sm"
      style={{ 
        backgroundColor: Colors.background,
        borderColor: Colors.dividerLight,
      }}
    >
      <div className="mb-3">
        <h3 
          className="text-2xl font-bold mb-2" 
          style={{ 
            fontFamily: 'var(--font-fjalla-one)',
            color: Colors.textDark
          }}
        >
          {beerRelease.beer_name}
        </h3>
        {beerRelease.breweries && (
          <div className="mb-2">
            <span 
              className="text-sm font-semibold" 
              style={{ 
                fontFamily: 'var(--font-fjalla-one)',
                color: Colors.textDark
              }}
            >
              {beerRelease.breweries.name}
            </span>
          </div>
        )}
      </div>
      
      {beerRelease.description && (
        <p 
          className="text-sm mb-4 line-clamp-2" 
          style={{ 
            fontFamily: 'var(--font-be-vietnam-pro)',
            color: Colors.textSecondary
          }}
        >
          {beerRelease.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {beerRelease.ABV && (
            <div 
              className="flex items-center justify-center px-2.5 py-1 rounded-full"
              style={{ 
                backgroundColor: Colors.backgroundDark,
              }}
            >
              <span 
                className="text-xs font-medium leading-none" 
                style={{ 
                  fontFamily: 'var(--font-be-vietnam-pro)',
                  color: Colors.background
                }}
              >
                ABV: {beerRelease.ABV}
              </span>
            </div>
          )}
          {beerRelease.release_date && (
            <div 
              className="flex items-center justify-center px-2.5 py-1 rounded-full"
              style={{ 
                backgroundColor: Colors.backgroundDark,
              }}
            >
              <span 
                className="text-xs font-medium leading-none" 
                style={{ 
                  fontFamily: 'var(--font-be-vietnam-pro)',
                  color: Colors.background
                }}
              >
                {formatReleaseDate(beerRelease.release_date)}
              </span>
            </div>
          )}
        </div>
        <Link 
          href={`/releases/${slug}`}
          className="px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 transition-colors"
          style={{ 
            fontFamily: 'var(--font-fjalla-one)',
            backgroundColor: Colors.backgroundDark,
            color: Colors.textPrimary
          }}
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

