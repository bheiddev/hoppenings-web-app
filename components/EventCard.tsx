import { Event } from '@/types/supabase';
import { Colors } from '@/lib/colors';
import Link from 'next/link';
import { generateEventSlug } from '@/lib/slug';

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
    <div className={`rounded-lg p-6 ${isFeatured ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-white'} border border-zinc-200 shadow-sm`}>
      <div className="mb-3">
        <h3 className={`text-xl font-bold mb-2 ${isFeatured ? 'text-white' : 'text-zinc-900'}`} style={{ fontFamily: 'var(--font-fjalla-one)' }}>
          {event.title}
        </h3>
        {event.breweries && (
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-orange-500">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
            <span className={`text-sm font-semibold ${isFeatured ? 'text-white' : 'text-zinc-700'}`} style={{ fontFamily: 'var(--font-fjalla-one)' }}>
              {event.breweries.name}
            </span>
          </div>
        )}
      </div>
      
      {event.description && (
        <p className={`text-sm mb-4 line-clamp-2 ${isFeatured ? 'text-white/90' : 'text-zinc-600'}`} style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}>
          {event.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {event.cost !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-orange-500">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.09 1.05.82 1.87 2 2.05v-4.24h-2V8.5h5.02v1.98c1.83.24 3.15 1.4 3.15 3.1 0 1.72-1.39 2.84-3.15 2.95v.56z" fill="currentColor"/>
              </svg>
              <span className={`text-xs font-medium ${isFeatured ? 'text-zinc-900' : 'text-zinc-700'}`} style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}>
                ${event.cost.toFixed(2)}
              </span>
            </div>
          )}
          {event.start_time && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-orange-500">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
              </svg>
              <span className={`text-xs font-medium ${isFeatured ? 'text-zinc-900' : 'text-zinc-700'}`} style={{ fontFamily: 'var(--font-be-vietnam-pro)' }}>
                {event.start_time}
              </span>
            </div>
          )}
        </div>
        <Link 
          href={`/events/${slug}`}
          className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 ${
            isFeatured 
              ? 'bg-white text-zinc-900 hover:bg-zinc-100' 
              : 'bg-zinc-900 text-white hover:bg-zinc-800'
          } transition-colors`}
          style={{ fontFamily: 'var(--font-fjalla-one)' }}
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

