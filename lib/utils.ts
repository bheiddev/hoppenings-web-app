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
  const todayDate = new Date(today);
  
  const expandedEvents: Event[] = [];
  
  events.forEach((event) => {
    if (event.is_recurring) {
      // Weekly recurring - expand for next 12 weeks
      const baseEventDate = new Date(event.event_date);
      if (!isNaN(baseEventDate.getTime())) {
        // Start from today if base date is in the past, otherwise start from base date
        let currentDate = baseEventDate < todayDate ? new Date(todayDate) : new Date(baseEventDate);
        
        // For past events, find the next occurrence
        if (baseEventDate < todayDate) {
          const daysDiff = Math.floor((todayDate.getTime() - baseEventDate.getTime()) / (1000 * 60 * 60 * 24));
          const weeksPast = Math.floor(daysDiff / 7);
          currentDate = new Date(baseEventDate);
          currentDate.setDate(currentDate.getDate() + (weeksPast + 1) * 7);
        }
        
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
        // Start from today if base date is in the past, otherwise start from base date
        let currentDate = baseEventDate < todayDate ? new Date(todayDate) : new Date(baseEventDate);
        
        // For past events, find the next occurrence
        if (baseEventDate < todayDate) {
          const daysDiff = Math.floor((todayDate.getTime() - baseEventDate.getTime()) / (1000 * 60 * 60 * 24));
          const biweeksPast = Math.floor(daysDiff / 14);
          currentDate = new Date(baseEventDate);
          currentDate.setDate(currentDate.getDate() + (biweeksPast + 1) * 14);
        }
        
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
        // Start from today if base date is in the past, otherwise start from base date
        let currentDate = baseEventDate < todayDate ? new Date(todayDate) : new Date(baseEventDate);
        
        // For past events, find the next occurrence
        if (baseEventDate < todayDate) {
          currentDate = new Date(baseEventDate);
          currentDate.setMonth(currentDate.getMonth() + 1);
          // Keep incrementing until we're at or past today
          while (currentDate < todayDate) {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }
        
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

