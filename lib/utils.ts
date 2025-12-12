import { Event } from '@/types/supabase';

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * Example: "18:30:00" -> "6:30 PM", "09:00:00" -> "9:00 AM"
 */
export function formatTime12Hour(time24: string | null): string {
  if (!time24) return ''
  
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours, 10)
  const minute = minutes || '00'
  
  if (hour === 0) {
    return `12:${minute} AM`
  } else if (hour === 12) {
    return `12:${minute} PM`
  } else if (hour < 12) {
    return `${hour}:${minute} AM`
  } else {
    return `${hour - 12}:${minute} PM`
  }
}

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
 * Get current date/time components in Mountain Time
 */
function getCurrentMountainTime(): { date: string; hours: number; minutes: number; seconds: number } {
  const now = new Date();
  
  // Get date components in Mountain Time
  const dateStr = now.toLocaleDateString('en-CA', {
    timeZone: 'America/Denver'
  });
  
  // Get time components in Mountain Time
  const timeStr = now.toLocaleTimeString('en-US', {
    timeZone: 'America/Denver',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  
  return {
    date: dateStr,
    hours,
    minutes,
    seconds
  };
}

/**
 * Normalize an event date to Mountain Time format (YYYY-MM-DD)
 */
function normalizeEventDateToMountainTime(eventDate: string): string {
  // Parse the event date - it might be in various formats
  const date = new Date(eventDate);
  
  // Convert to Mountain Time date string (YYYY-MM-DD)
  return date.toLocaleDateString('en-CA', {
    timeZone: 'America/Denver'
  });
}

/**
 * Check if an event should be shown (happening today or in the future in Mountain Time)
 */
function shouldShowEvent(eventDate: string, startTime: string | null): boolean {
  const mountainTime = getCurrentMountainTime();
  const todayMountain = mountainTime.date;
  
  // Normalize the event date to Mountain Time format
  const eventDateMountain = normalizeEventDateToMountainTime(eventDate);
  
  // Compare dates
  if (eventDateMountain > todayMountain) {
    // Event is in the future
    return true;
  }
  
  if (eventDateMountain < todayMountain) {
    // Event is in the past
    return false;
  }
  
  // Event is today - check the time if available
  if (startTime) {
    // Parse the start time (format: "HH:MM:SS" or "HH:MM")
    const [eventHours, eventMinutes] = startTime.split(':').map(Number);
    
    // Compare hours first
    if (eventHours > mountainTime.hours) {
      return true;
    }
    if (eventHours < mountainTime.hours) {
      return false;
    }
    
    // Same hour, compare minutes
    if (eventMinutes > mountainTime.minutes) {
      return true;
    }
    if (eventMinutes < mountainTime.minutes) {
      return false;
    }
    
    // Same hour and minute - check seconds if available
    const eventSeconds = startTime.split(':')[2] ? Number(startTime.split(':')[2]) : 0;
    return eventSeconds >= mountainTime.seconds;
  }
  
  // If no start time, include events happening today (to be safe)
  return true;
}

/**
 * Expand recurring events to 12 weeks (for detail page generation)
 */
export function expandRecurringEvents(events: Event[]): Event[] {
  const mountainTime = getCurrentMountainTime();
  const todayMountain = mountainTime.date;
  
  // Create a date object for today at midnight for date comparisons
  // We'll use the normalized Mountain Time date string
  const todayDate = new Date(todayMountain + 'T00:00:00');
  
  const expandedEvents: Event[] = [];
  
  events.forEach((event) => {
    // Normalize the base event date to Mountain Time for comparison
    const baseEventDateMountain = normalizeEventDateToMountainTime(event.event_date);
    const baseEventDate = new Date(baseEventDateMountain + 'T00:00:00');
    
    if (event.is_recurring) {
      // Weekly recurring - expand for next 12 weeks
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
          
          // Check if this event occurrence should be shown
          if (shouldShowEvent(dateStr, event.start_time)) {
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
          
          // Check if this event occurrence should be shown
          if (shouldShowEvent(dateStr, event.start_time)) {
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
          
          // Check if this event occurrence should be shown
          if (shouldShowEvent(dateStr, event.start_time)) {
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
      // One-time events - normalize date and check if should be shown
      if (shouldShowEvent(event.event_date, event.start_time)) {
        // Normalize the event date to Mountain Time format for consistency
        const normalizedDate = normalizeEventDateToMountainTime(event.event_date);
        expandedEvents.push({
          ...event,
          event_date: normalizedDate,
        });
      }
    }
  });
  
  // Sort by date
  expandedEvents.sort((a, b) => 
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  
  return expandedEvents;
}

