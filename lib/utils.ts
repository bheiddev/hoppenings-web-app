import { Event } from '@/types/supabase';

/**
 * Format date to display format (e.g., "Monday, January 1, 2024")
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format release date to MDY format
 */
export function formatReleaseDate(releaseDate: string | null): string | null {
  if (!releaseDate) return null;
  const date = new Date(releaseDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Group events by date
 */
export function groupEventsByDate(events: Event[]): Record<string, Event[]> {
  const grouped: Record<string, Event[]> = {};
  
  events.forEach((event) => {
    const dateKey = formatEventDate(event.event_date);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });
  
  return grouped;
}

/**
 * Expand recurring events to 12 weeks (for detail page generation)
 */
export function expandRecurringEvents(events: Event[]): Event[] {
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Denver'
  });
  
  const expandedEvents: Event[] = [];
  
  events.forEach((event) => {
    if (event.is_recurring) {
      // Weekly recurring - expand for next 12 weeks
      const baseEventDate = new Date(event.event_date);
      if (!isNaN(baseEventDate.getTime())) {
        let currentDate = new Date(baseEventDate);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (12 * 7)); // 12 weeks from today
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toLocaleDateString('en-CA', {
            timeZone: 'America/Denver'
          });
          if (dateStr >= today) {
            expandedEvents.push({
              ...event,
              id: `${event.id}-${dateStr}`,
              event_date: dateStr,
            });
          }
          currentDate.setDate(currentDate.getDate() + 7);
        }
      }
    } else if (event.is_recurring_biweekly) {
      // Bi-weekly recurring - expand for next 12 weeks
      const baseEventDate = new Date(event.event_date);
      if (!isNaN(baseEventDate.getTime())) {
        let currentDate = new Date(baseEventDate);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (12 * 7)); // 12 weeks from today
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toLocaleDateString('en-CA', {
            timeZone: 'America/Denver'
          });
          if (dateStr >= today) {
            expandedEvents.push({
              ...event,
              id: `${event.id}-${dateStr}`,
              event_date: dateStr,
            });
          }
          currentDate.setDate(currentDate.getDate() + 14);
        }
      }
    } else if (event.is_recurring_monthly) {
      // Monthly recurring - expand for next 3 months (12 weeks ≈ 3 months)
      const baseEventDate = new Date(event.event_date);
      if (!isNaN(baseEventDate.getTime())) {
        let currentDate = new Date(baseEventDate);
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toLocaleDateString('en-CA', {
            timeZone: 'America/Denver'
          });
          if (dateStr >= today) {
            expandedEvents.push({
              ...event,
              id: `${event.id}-${dateStr}`,
              event_date: dateStr,
            });
          }
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }
    } else {
      // One-time events - only include if from today forward
      if (event.event_date >= today) {
        expandedEvents.push(event);
      }
    }
  });
  
  // Sort by date
  expandedEvents.sort((a, b) => 
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  
  return expandedEvents;
}

