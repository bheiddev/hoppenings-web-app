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
 * Treats date strings as dates in Mountain Time
 */
export function formatEventDate(dateString: string): string {
  // If it's a date-only string (YYYY-MM-DD), treat it as Mountain Time
  // Parse it at noon Mountain Time to avoid timezone edge cases
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Date-only format - create date at noon Mountain Time to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date string in ISO format with time in Mountain Time
    // We'll use a formatter to ensure it's interpreted correctly
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`;
    date = new Date(dateStr);
    // Format using Mountain Time timezone
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/Denver',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } else {
    // Has time component - parse normally but format in Mountain Time
    date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/Denver',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
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
 * Treats date-only strings as dates in Mountain Time (not UTC)
 */
function normalizeEventDateToMountainTime(eventDate: string): string {
  // If it's already a date-only string in YYYY-MM-DD format, return it as-is
  // (assuming it's already in Mountain Time)
  if (/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return eventDate;
  }
  
  // If it has a time component, parse it and convert to Mountain Time date
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
 * Compare two date strings in YYYY-MM-DD format
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
function compareDateStrings(date1: string, date2: string): number {
  if (date1 < date2) return -1;
  if (date1 > date2) return 1;
  return 0;
}

/**
 * Add days to a date string in YYYY-MM-DD format, returning a new date string
 * Works with date components directly to avoid timezone issues
 */
function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create a date object and add days
  // Use UTC methods to avoid timezone shifts, then format in Mountain Time
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  
  // Format in Mountain Time
  return date.toLocaleDateString('en-CA', {
    timeZone: 'America/Denver'
  });
}

/**
 * Expand recurring events to 12 weeks (for detail page generation)
 */
export function expandRecurringEvents(events: Event[]): Event[] {
  const mountainTime = getCurrentMountainTime();
  const todayMountain = mountainTime.date;
  
  const expandedEvents: Event[] = [];
  
  events.forEach((event) => {
    // Normalize the base event date to Mountain Time for comparison
    const baseEventDateMountain = normalizeEventDateToMountainTime(event.event_date);
    
    if (event.is_recurring) {
      // Weekly recurring - expand for next 12 weeks
      // Start from today if base date is in the past, otherwise start from base date
      let currentDateStr = baseEventDateMountain;
      
      // For past events, find the next occurrence
      if (compareDateStrings(baseEventDateMountain, todayMountain) < 0) {
        // Calculate how many weeks to add
        const [baseYear, baseMonth, baseDay] = baseEventDateMountain.split('-').map(Number);
        const [todayYear, todayMonth, todayDay] = todayMountain.split('-').map(Number);
        const baseDate = new Date(baseYear, baseMonth - 1, baseDay);
        const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
        const daysDiff = Math.floor((todayDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        const weeksPast = Math.floor(daysDiff / 7);
        currentDateStr = addDaysToDateString(baseEventDateMountain, (weeksPast + 1) * 7);
      }
      
      const endDateStr = addDaysToDateString(todayMountain, 12 * 7); // 12 weeks from today
      
      while (compareDateStrings(currentDateStr, endDateStr) <= 0) {
        // Check if this event occurrence should be shown
        if (shouldShowEvent(currentDateStr, event.start_time)) {
          expandedEvents.push({
            ...event,
            id: `${event.id}-${currentDateStr}`,
            event_date: currentDateStr,
          });
        }
        currentDateStr = addDaysToDateString(currentDateStr, 7);
      }
    } else if (event.is_recurring_biweekly) {
      // Bi-weekly recurring - expand for next 12 weeks
      // Start from today if base date is in the past, otherwise start from base date
      let currentDateStr = baseEventDateMountain;
      
      // For past events, find the next occurrence
      if (compareDateStrings(baseEventDateMountain, todayMountain) < 0) {
        // Calculate how many biweeks to add
        const [baseYear, baseMonth, baseDay] = baseEventDateMountain.split('-').map(Number);
        const [todayYear, todayMonth, todayDay] = todayMountain.split('-').map(Number);
        const baseDate = new Date(baseYear, baseMonth - 1, baseDay);
        const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
        const daysDiff = Math.floor((todayDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        const biweeksPast = Math.floor(daysDiff / 14);
        currentDateStr = addDaysToDateString(baseEventDateMountain, (biweeksPast + 1) * 14);
      }
      
      const endDateStr = addDaysToDateString(todayMountain, 12 * 7); // 12 weeks from today
      
      while (compareDateStrings(currentDateStr, endDateStr) <= 0) {
        // Check if this event occurrence should be shown
        if (shouldShowEvent(currentDateStr, event.start_time)) {
          expandedEvents.push({
            ...event,
            id: `${event.id}-${currentDateStr}`,
            event_date: currentDateStr,
          });
        }
        currentDateStr = addDaysToDateString(currentDateStr, 14);
      }
    } else if (event.is_recurring_monthly) {
      // Monthly recurring - expand for next 3 months (12 weeks ≈ 3 months)
      // Start from today if base date is in the past, otherwise start from base date
      let currentDateStr = baseEventDateMountain;
      
      // For past events, find the next occurrence
      if (compareDateStrings(baseEventDateMountain, todayMountain) < 0) {
        const [year, month, day] = baseEventDateMountain.split('-').map(Number);
        let currentDate = new Date(year, month - 1, day);
        const [todayYear, todayMonth, todayDay] = todayMountain.split('-').map(Number);
        const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
        
        // Keep incrementing months until we're at or past today
        while (currentDate < todayDate) {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        currentDateStr = currentDate.toLocaleDateString('en-CA', {
          timeZone: 'America/Denver'
        });
      }
      
      // Calculate end date (3 months from today)
      const [todayYear, todayMonth, todayDay] = todayMountain.split('-').map(Number);
      const endDate = new Date(todayYear, todayMonth - 1, todayDay);
      endDate.setMonth(endDate.getMonth() + 3);
      const endDateStr = endDate.toLocaleDateString('en-CA', {
        timeZone: 'America/Denver'
      });
      
      // Parse current date string to Date for month arithmetic
      const [currYear, currMonth, currDay] = currentDateStr.split('-').map(Number);
      let currentDate = new Date(currYear, currMonth - 1, currDay);
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      const endDateObj = new Date(endYear, endMonth - 1, endDay);
      
      while (currentDate <= endDateObj) {
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

