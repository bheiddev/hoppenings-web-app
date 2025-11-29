import { Event } from '@/types/supabase';
import { Colors } from '@/lib/colors';
import Link from 'next/link';
import { generateEventSlug } from '@/lib/slug';
import { formatTime12Hour } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  isFeatured?: boolean;
}

export function EventCard({ event, isFeatured = false }: EventCardProps) {
  const isRecurring = event.is_recurring || event.is_recurring_biweekly || event.is_recurring_monthly
  const slug = generateEventSlug(
    event.title,
    event.breweries.name,
    event.breweries.location || null,
    event.event_date,
    event.id,
    isRecurring
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
          {event.title}
        </h3>
        {event.breweries && (
          <div className="mb-2">
            <span 
              className="text-sm font-semibold" 
              style={{ 
                fontFamily: 'var(--font-fjalla-one)',
                color: Colors.textDark
              }}
            >
              {event.breweries.name}
            </span>
          </div>
        )}
      </div>
      
      {event.description && (
        <p 
          className="text-sm mb-4 line-clamp-2" 
          style={{ 
            fontFamily: 'var(--font-be-vietnam-pro)',
            color: Colors.textSecondary
          }}
        >
          {event.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {event.cost !== null && (
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
                ${event.cost.toFixed(2)}
              </span>
            </div>
          )}
          {event.start_time && (
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
                {formatTime12Hour(event.start_time)}
              </span>
            </div>
          )}
        </div>
        <Link 
          href={`/events/${slug}`}
          className="px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 transition-colors"
          style={{ 
            fontFamily: 'var(--font-fjalla-one)',
            backgroundColor: Colors.backgroundDark,
            color: Colors.textPrimary
          }}
        >
          VIEW EVENT
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-current">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

