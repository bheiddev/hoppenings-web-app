import { Brewery } from '@/types/supabase'
import { generateBrewerySlug } from '@/lib/slug'
import {
  BreweryCardContext,
  DEFAULT_BREWERY_CARD_CONTEXT,
} from '@/lib/breweryCardContext'
import { BreweryShowcaseCard } from '@/components/BreweryShowcaseCard'

interface BreweryCardProps {
  brewery: Brewery
  context?: BreweryCardContext
}

export function BreweryCard({ brewery, context = DEFAULT_BREWERY_CARD_CONTEXT }: BreweryCardProps) {
  const slug = generateBrewerySlug(brewery.name, brewery.location, brewery.id)

  return (
    <BreweryShowcaseCard
      href={`/breweries/${slug}`}
      breweryName={brewery.name}
      imageUrl={brewery.image_url}
      latitude={brewery.latitude}
      longitude={brewery.longitude}
      context={context}
    />
  )
}
