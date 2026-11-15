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

/** Compact event date for cards (e.g. "Mon, Jan 5") */
export function formatEventDateShort(dateString: string): string {
  const ymd = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? dateString
    : normalizeEventDateToMountainTime(dateString)
  const [year, month, day] = ymd.split('-').map(Number)
  const date = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`)
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format release date to MDY format (calendar date in Mountain Time).
 */
export function formatReleaseDate(releaseDate: string | null): string | null {
  if (!releaseDate) return null;
  const ymd = normalizeEventDateToMountainTime(releaseDate.trim());
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Group events by date
 */
export function groupEventsByDate<T extends Event>(events: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  events.forEach((event) => {
    const dateKey = formatEventDate(event.event_date);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });

  return grouped;
}

/** Region label for grouping; empty/null becomes "Other". */
export function bucketRegion(region: string | null | undefined): string {
  const trimmed = region?.trim();
  return trimmed ? trimmed : 'Other';
}

/** Group events by brewery region; keys sorted alphabetically with "Other" last. */
export function groupEventsByRegion(events: Event[]): Record<string, Event[]> {
  const grouped: Record<string, Event[]> = {};

  events.forEach((event) => {
    const key = bucketRegion(event.breweries?.Region);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(event);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });

  const sorted: Record<string, Event[]> = {};
  sortedKeys.forEach((key) => {
    sorted[key] = grouped[key];
  });
  return sorted;
}

/**
 * Get current date/time components in Mountain Time
 */
export function getMountainTimeNow(): { date: string; hours: number; minutes: number; seconds: number } {
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
export function normalizeEventDateToMountainTime(eventDate: string): string {
  // If it's already a date-only string in YYYY-MM-DD format, return it as-is
  // (assuming dates from database are stored in Mountain Time or as date-only)
  if (/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return eventDate;
  }
  
  // If it has a time component, parse it and convert to Mountain Time date
  const date = new Date(eventDate);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error(`⚠️ Invalid date format: ${eventDate}`);
    return eventDate; // Return as-is if invalid
  }
  
  // Convert to Mountain Time date string (YYYY-MM-DD)
  return date.toLocaleDateString('en-CA', {
    timeZone: 'America/Denver'
  });
}

/** Consecutive YYYY-MM-DD dates starting at today in Mountain Time (length days). */
export function getMountainDateRangeFromToday(dayCount: number): string[] {
  const start = getTodayMountainDateString();
  return Array.from({ length: dayCount }, (_, i) => addDaysToDateString(start, i));
}

/** Subheading for a day column on weekly schedules (Mountain calendar dates). */
export function formatMountainWeekDayHeading(ymd: string, indexInWeek: number): string {
  if (indexInWeek === 0) return 'Today';
  if (indexInWeek === 1) return 'Tomorrow';
  return formatEventDate(ymd);
}

/** Date group heading with Today/Tomorrow for the next two Mountain calendar days. */
export function formatRelativeEventDateHeading(eventDate: string): string {
  const normalized = normalizeEventDateToMountainTime(eventDate);
  const today = getTodayMountainDateString();
  if (normalized === today) return 'Today';
  if (normalized === addDaysToDateString(today, 1)) return 'Tomorrow';
  return formatEventDate(eventDate);
}

/**
 * Prominent weekday + calendar date for activity groupings on region hubs.
 * e.g. { weekdayLabel: "Monday", dateLabel: "Oct 27" } or Today/Tomorrow.
 */
export function formatActivityDayGroupLabels(eventDate: string): {
  weekdayLabel: string
  dateLabel: string
} {
  const ymd = /^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    ? eventDate
    : normalizeEventDateToMountainTime(eventDate)
  const today = getTodayMountainDateString()
  const [year, month, day] = ymd.split('-').map(Number)
  const date = new Date(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`
  )
  const dateLabel = date.toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    month: 'short',
    day: 'numeric',
  })
  if (ymd === today) return { weekdayLabel: 'Today', dateLabel }
  if (ymd === addDaysToDateString(today, 1)) return { weekdayLabel: 'Tomorrow', dateLabel }
  const weekdayLabel = date.toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    weekday: 'long',
  })
  return { weekdayLabel, dateLabel }
}

export function isRelativeDayHeading(label: string): boolean {
  return label === 'Today' || label === 'Tomorrow';
}

export type EventLikeForMountainWeek = {
  event_date: string;
  start_time?: string | null;
  title: string;
};

/** Groups events into the next `dayCount` Mountain calendar days; sorts each day by start time then title. */
export function bucketEventsByMountainWeekDays<T extends EventLikeForMountainWeek>(
  events: T[],
  dayCount: number = 7
): { weekDates: string[]; eventsInWeek: T[]; eventsByMountainDay: Map<string, T[]> } {
  const weekDates = getMountainDateRangeFromToday(dayCount);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];
  const eventsInWeek = events.filter((event) => {
    const d = normalizeEventDateToMountainTime(event.event_date);
    return d >= weekStart && d <= weekEnd;
  });
  const eventsByMountainDay = new Map<string, T[]>();
  for (const event of eventsInWeek) {
    const d = normalizeEventDateToMountainTime(event.event_date);
    const list = eventsByMountainDay.get(d) ?? [];
    list.push(event);
    eventsByMountainDay.set(d, list);
  }
  for (const list of eventsByMountainDay.values()) {
    list.sort((a, b) => {
      const tA = a.start_time ?? '';
      const tB = b.start_time ?? '';
      if (tA !== tB) return tA.localeCompare(tB);
      return a.title.localeCompare(b.title);
    });
  }
  return { weekDates, eventsInWeek, eventsByMountainDay };
}

/**
 * Check if an event should be shown (happening today or in the future in Mountain Time)
 */
function shouldShowEvent(eventDate: string, startTime: string | null): boolean {
  const mountainTime = getMountainTimeNow();
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
  
  // Event is today - show it regardless of start time
  // (events happening today should be visible even if they've already started)
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
export function addDaysToDateString(dateStr: string, days: number): string {
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
 * Check if an event date is in the past (before today in Mountain Time)
 */
export function isEventInPast(eventDate: string): boolean {
  const mountainTime = getMountainTimeNow();
  const todayMountain = mountainTime.date;
  const eventDateMountain = normalizeEventDateToMountainTime(eventDate);
  return compareDateStrings(eventDateMountain, todayMountain) < 0;
}

/** Calendar date (YYYY-MM-DD) for "today" in America/Denver. */
export function getTodayMountainDateString(): string {
  return getMountainTimeNow().date;
}

/** True when the event falls on the given calendar day in Mountain Time. */
export function isEventToday(eventDate: string): boolean {
  return normalizeEventDateToMountainTime(eventDate) === getTodayMountainDateString();
}

/** Mountain weekday index (0=Sun … 6=Sat) for a YYYY-MM-DD date string. */
function mountainWeekdayIndexFromYmd(ymd: string): number {
  const probe = new Date(`${ymd}T12:00:00.000Z`)
  const weekday = probe.toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    weekday: 'short',
  })
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[weekday] ?? 0
}

/**
 * End of next Mountain calendar week (Sat), Sunday-start weeks.
 * Weekly recurring events only expand / show through this date (public + admin).
 */
export function endOfNextMountainWeek(todayYmd?: string): string {
  const today = todayYmd ?? getTodayMountainDateString()
  const weekday = mountainWeekdayIndexFromYmd(today)
  const weekStart = addDaysToDateString(today, -weekday)
  return addDaysToDateString(weekStart, 13)
}

/**
 * Whether a (possibly expanded) event should appear on listing / admin content
 * pickers: no biweekly/monthly; weekly occurrences only through next week.
 */
export function shouldShowEventOnListings(
  event: Pick<
    Event,
    'event_date' | 'is_recurring' | 'is_recurring_biweekly' | 'is_recurring_monthly'
  >,
  todayYmd?: string
): boolean {
  if (event.is_recurring_biweekly || event.is_recurring_monthly) return false
  if (!event.is_recurring) return true
  const today = todayYmd ?? getTodayMountainDateString()
  const ymd = normalizeEventDateToMountainTime(event.event_date)
  return compareDateStrings(ymd, endOfNextMountainWeek(today)) <= 0
}

/**
 * Expand weekly recurring events for this Mountain week + next week only.
 * Biweekly/monthly templates are not shown on public or admin content listings.
 * @param filterPastEvents - If true, filter out past events. Defaults to true.
 */
export function expandRecurringEvents(events: Event[], filterPastEvents: boolean = true): Event[] {
  const mountainTime = getMountainTimeNow();
  const todayMountain = mountainTime.date;
  const weeklyEndDateStr = endOfNextMountainWeek(todayMountain);
  const expandedEvents: Event[] = [];
  
  events.forEach((event) => {
    // Normalize the base event date to Mountain Time for comparison
    const baseEventDateMountain = normalizeEventDateToMountainTime(event.event_date);

    // Biweekly / monthly: intentionally omitted from public event surfaces.
    if (event.is_recurring_biweekly || event.is_recurring_monthly) {
      return;
    }
    
    if (event.is_recurring) {
      // Weekly recurring — only this calendar week and the next.
      let currentDateStr = baseEventDateMountain;
      
      // For past events, find the next occurrence (or today if today is a valid occurrence)
      if (compareDateStrings(baseEventDateMountain, todayMountain) < 0) {
        // Calculate how many weeks to add
        const [baseYear, baseMonth, baseDay] = baseEventDateMountain.split('-').map(Number);
        const [todayYear, todayMonth, todayDay] = todayMountain.split('-').map(Number);
        const baseDate = new Date(baseYear, baseMonth - 1, baseDay);
        const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
        const daysDiff = Math.floor((todayDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        const weeksPast = Math.floor(daysDiff / 7);
        const daysRemainder = daysDiff % 7;
        
        // If today is exactly a multiple of 7 days from base date, start from today
        // Otherwise, start from the next occurrence
        if (daysRemainder === 0) {
          currentDateStr = todayMountain;
        } else {
          currentDateStr = addDaysToDateString(baseEventDateMountain, (weeksPast + 1) * 7);
        }
      } else if (compareDateStrings(baseEventDateMountain, todayMountain) === 0) {
        // Base date is today, start from today
        currentDateStr = todayMountain;
      }
      
      // Ensure we start from today or later when filtering (safety check)
      if (filterPastEvents) {
        while (compareDateStrings(currentDateStr, todayMountain) < 0) {
          // If calculated date is still in the past, advance to next occurrence
          currentDateStr = addDaysToDateString(currentDateStr, 7);
        }
      }
      
      while (compareDateStrings(currentDateStr, weeklyEndDateStr) <= 0) {
        // For filtering: only include events from today forward using compareDateStrings
        // For non-filtering: include all events
        const shouldInclude = !filterPastEvents || compareDateStrings(currentDateStr, todayMountain) >= 0;
        
        if (shouldInclude) {
          expandedEvents.push({
            ...event,
            id: `${event.id}-${currentDateStr}`,
            event_date: currentDateStr,
          });
        }
        currentDateStr = addDaysToDateString(currentDateStr, 7);
      }
    } else {
      // One-time events - normalize date first, then check if should be shown
      const normalizedDate = normalizeEventDateToMountainTime(event.event_date);
      
      // For one-time events, use the same comparison logic as the final filter
      if (!filterPastEvents) {
        // Include all events if not filtering
        expandedEvents.push({
          ...event,
          event_date: normalizedDate,
        });
      } else {
        // Filter past events using compareDateStrings for consistency
        const comparison = compareDateStrings(normalizedDate, todayMountain);
        if (comparison >= 0) {
          // Event is today or in the future
          expandedEvents.push({
            ...event,
            event_date: normalizedDate,
          });
        }
      }
    }
  });
  
  // Final filter: Remove any events from yesterday or earlier (only if filtering is enabled)
  // This is a safety net to catch any events that might have slipped through
  // We normalize both dates to ensure consistent comparison
  const filteredEvents = filterPastEvents 
    ? expandedEvents.filter((event) => {
        // Normalize the event date to ensure consistent format
        const eventDateMountain = normalizeEventDateToMountainTime(event.event_date);
        
        // Compare using compareDateStrings for reliable date comparison
        // Only include events from today (>= 0 means today or future)
        // comparison < 0 means event is in the past (yesterday or earlier)
        const comparison = compareDateStrings(eventDateMountain, todayMountain);
        const isTodayOrFuture = comparison >= 0;
        
        return isTodayOrFuture;
      })
    : expandedEvents;

  // Sort by date
  filteredEvents.sort((a, b) => 
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  
  return filteredEvents;
}

/**
 * Convert URLs in text to clickable links
 * Returns an array of text segments and link elements
 */
export function convertUrlsToLinks(text: string): Array<string | { url: string; text: string }> {
  // URL regex pattern - matches http, https, and www URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts: Array<string | { url: string; text: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the URL as a link object
    let url = match[0];
    // Add https:// if it starts with www.
    if (url.toLowerCase().startsWith('www.')) {
      url = 'https://' + url;
    }
    parts.push({ url, text: match[0] });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no URLs were found, return the original text as a single string
  if (parts.length === 0) {
    parts.push(text);
  }

  return parts;
}

