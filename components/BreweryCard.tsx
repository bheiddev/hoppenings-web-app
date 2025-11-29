import { Brewery } from '@/types/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { generateBrewerySlug } from '@/lib/slug';

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
    <div className="rounded-lg overflow-hidden bg-white border border-zinc-200 shadow-sm">
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
        <h3 className="text-xl font-bold mb-2 text-zinc-900" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
          {brewery.name}
        </h3>
        {brewery.location && (
          <p className="text-sm text-zinc-600 mb-3 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-orange-500">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
            {brewery.location}
          </p>
        )}
        {brewery.description && (
          <p className="text-sm text-zinc-600 mb-4 line-clamp-2" style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}>
            {brewery.description}
          </p>
        )}
        <Link 
          href={`/breweries/${slug}`}
          className="w-full px-4 py-2 rounded-full font-semibold text-sm flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
          style={{ fontFamily: 'var(--font-fjalla-one)' }}
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

