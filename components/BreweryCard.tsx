import { Brewery } from '@/types/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { generateBrewerySlug } from '@/lib/slug';
import { Colors } from '@/lib/colors';

interface BreweryCardProps {
  brewery: Brewery;
}

export function BreweryCard({ brewery }: BreweryCardProps) {
  const slug = generateBrewerySlug(
    brewery.name,
    brewery.location,
    brewery.id
  )
  return (
    <div 
      className="rounded-lg overflow-hidden border shadow-sm"
      style={{ 
        backgroundColor: Colors.background,
        borderColor: Colors.dividerLight,
      }}
    >
      {brewery.image_url && (
        <div className="relative w-full h-48">
          <Image
            src={brewery.image_url}
            alt={brewery.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="p-6">
        <h3 
          className="text-2xl font-bold mb-2" 
          style={{ 
            fontFamily: 'var(--font-fjalla-one)',
            color: Colors.textDark
          }}
        >
          {brewery.name}
        </h3>
        {brewery.location && (
          <p 
            className="text-sm mb-3" 
            style={{ 
              fontFamily: 'var(--font-be-vietnam-pro)',
              color: Colors.textSecondary
            }}
          >
            {brewery.location}
          </p>
        )}
        {brewery.description && (
          <p 
            className="text-sm mb-4 line-clamp-2" 
            style={{ 
              fontFamily: 'var(--font-be-vietnam-pro)',
              color: Colors.textSecondary
            }}
          >
            {brewery.description}
          </p>
        )}
        <Link 
          href={`/breweries/${slug}`}
          className="w-full px-4 py-2 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          style={{ 
            fontFamily: 'var(--font-fjalla-one)',
            backgroundColor: Colors.backgroundDark,
            color: Colors.textPrimary
          }}
        >
          VIEW BREWERY
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-current">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

