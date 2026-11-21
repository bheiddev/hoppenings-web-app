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

/** How far ahead recurring occurrences expand / appear on public + admin listings. */
export const RECURRING_EVENT_HORIZON_DAYS = 14

/** Hide recurring series whose original event_date is older than this many days before today. */
export const RECURRING_SERIES_MAX_AGE_DAYS = 365

export type RecurrenceKind = 'none' | 'weekly' | 'biweekly' | 'monthly'

/**
 * Recurrence used for expansion. If more than one flag is set, treat as weekly
 * (matches the Hoppenings mobile app).
 */
export function getRecurrenceKind(
  event: Pick<Event, 'is_recurring' | 'is_recurring_biweekly' | 'is_recurring_monthly'>
): RecurrenceKind {
  if (event.is_recurring) return 'weekly'
  if (event.is_recurring_biweekly) return 'biweekly'
  if (event.is_recurring_monthly) return 'monthly'
  return 'none'
}

/**
 * Inclusive end date for recurring instances: today + {@link RECURRING_EVENT_HORIZON_DAYS}
 * in Mountain Time. Occurrences further out are not shown.
 */
export function endOfRecurringEventsHorizon(todayYmd?: string): string {
  const today = todayYmd ?? getTodayMountainDateString()
  return addDaysToDateString(today, RECURRING_EVENT_HORIZON_DAYS)
}

/** True when a recurring series' original date is more than 365 Mountain days before today. */
export function isRecurringSeriesTooOld(originalYmd: string, todayYmd?: string): boolean {
  const today = todayYmd ?? getTodayMountainDateString()
  const cutoff = addDaysToDateString(today, -RECURRING_SERIES_MAX_AGE_DAYS)
  return compareDateStrings(normalizeEventDateToMountainTime(originalYmd), cutoff) < 0
}

/** Add calendar months to a YYYY-MM-DD string, clamping the day when needed. */
export function addMonthsToDateString(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + months, 1, 12, 0, 0))
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12, 0, 0)
  ).getUTCDate()
  date.setUTCDate(Math.min(day, lastDay))
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
}

function advanceRecurrenceDate(ymd: string, kind: Exclude<RecurrenceKind, 'none'>): string {
  if (kind === 'weekly') return addDaysToDateString(ymd, 7)
  if (kind === 'biweekly') return addDaysToDateString(ymd, 14)
  return addMonthsToDateString(ymd, 1)
}

/**
 * Whether a (possibly expanded) event should appear on listing / admin content
 * pickers — same rules as the Hoppenings mobile app.
 *
 * One-time: event_date today or later (no far-future cutoff).
 * Recurring: original date within the past year; occurrence today through +14 days.
 * Raw recurring templates (no true_event_date) stay visible in CMS when the series
 * is still active so editors can manage them before expansion.
 */
export function shouldShowEventOnListings(
  event: Pick<
    Event,
    | 'event_date'
    | 'true_event_date'
    | 'is_recurring'
    | 'is_recurring_biweekly'
    | 'is_recurring_monthly'
  >,
  todayYmd?: string
): boolean {
  const today = todayYmd ?? getTodayMountainDateString()
  const kind = getRecurrenceKind(event)
  const occurrenceYmd = normalizeEventDateToMountainTime(event.event_date)
  const originalYmd = normalizeEventDateToMountainTime(
    event.true_event_date?.trim() || event.event_date
  )

  if (kind === 'none') {
    return compareDateStrings(occurrenceYmd, today) >= 0
  }

  if (isRecurringSeriesTooOld(originalYmd, today)) return false

  const isExpanded = Boolean(event.true_event_date?.trim())
  if (!isExpanded) return true

  if (compareDateStrings(occurrenceYmd, today) < 0) return false
  return compareDateStrings(occurrenceYmd, endOfRecurringEventsHorizon(today)) <= 0
}

/** Strip synthetic `uuid-YYYY-MM-DD` ids from expandRecurringEvents back to the DB UUID. */
export function getEventsBaseId(rawId: string): string {
  const trimmed = rawId.trim()
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed
  }
  const m = trimmed.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-\d{4}-\d{2}-\d{2}$/i
  )
  if (m) return m[1]
  return trimmed
}

/** Stored / True date for admin edit forms (falls back to occurrence date). */
export function getEventTrueDate(event: Pick<Event, 'event_date' | 'true_event_date'>): string {
  const trueDate = event.true_event_date?.trim()
  if (trueDate) return normalizeEventDateToMountainTime(trueDate)
  return normalizeEventDateToMountainTime(event.event_date)
}

/**
 * One admin row per events_base record among expanded occurrences that already
 * passed frontend listing rules — soonest occurrence kept for display.
 */
export function dedupeExpandedEventsForAdminEdit(events: Event[]): Event[] {
  const byBaseId = new Map<string, Event>()
  for (const event of events) {
    const baseId = getEventsBaseId(event.id)
    const existing = byBaseId.get(baseId)
    if (
      !existing ||
      compareDateStrings(
        normalizeEventDateToMountainTime(event.event_date),
        normalizeEventDateToMountainTime(existing.event_date)
      ) < 0
    ) {
      byBaseId.set(baseId, event)
    }
  }
  return [...byBaseId.values()].sort((a, b) =>
    compareDateStrings(
      normalizeEventDateToMountainTime(a.event_date),
      normalizeEventDateToMountainTime(b.event_date)
    )
  )
}

/**
 * Expand events to match Hoppenings app visibility.
 *
 * One-time: keep rows dated today or later (no far-future cutoff).
 * Recurring: skip series whose original date is >365 days before today; otherwise
 * emit occurrences from the original date through today+14 (inclusive), stepping
 * weekly / biweekly / monthly. Past occurrence dates are skipped when filtering.
 *
 * @param filterPastEvents - If true, filter out past events. Defaults to true.
 */
export function expandRecurringEvents(events: Event[], filterPastEvents: boolean = true): Event[] {
  const todayMountain = getTodayMountainDateString()
  const horizonEnd = endOfRecurringEventsHorizon(todayMountain)
  const expandedEvents: Event[] = []

  for (const event of events) {
    const baseEventDateMountain = normalizeEventDateToMountainTime(event.event_date)
    const kind = getRecurrenceKind(event)

    if (kind === 'none') {
      if (!filterPastEvents || compareDateStrings(baseEventDateMountain, todayMountain) >= 0) {
        expandedEvents.push({
          ...event,
          event_date: baseEventDateMountain,
          true_event_date: baseEventDateMountain,
        })
      }
      continue
    }

    // Stale series: do not roll forward.
    if (isRecurringSeriesTooOld(baseEventDateMountain, todayMountain)) {
      continue
    }

    let currentDateStr = baseEventDateMountain
    let guard = 0

    // When filtering, jump to the first occurrence on/after today.
    if (filterPastEvents) {
      while (compareDateStrings(currentDateStr, todayMountain) < 0 && guard < 800) {
        guard += 1
        const nextDateStr = advanceRecurrenceDate(currentDateStr, kind)
        if (compareDateStrings(nextDateStr, currentDateStr) <= 0) break
        currentDateStr = nextDateStr
      }
    }

    while (compareDateStrings(currentDateStr, horizonEnd) <= 0 && guard < 800) {
      guard += 1
      if (!filterPastEvents || compareDateStrings(currentDateStr, todayMountain) >= 0) {
        expandedEvents.push({
          ...event,
          id: `${event.id}-${currentDateStr}`,
          event_date: currentDateStr,
          true_event_date: baseEventDateMountain,
        })
      }

      const nextDateStr = advanceRecurrenceDate(currentDateStr, kind)
      if (compareDateStrings(nextDateStr, currentDateStr) <= 0) break
      currentDateStr = nextDateStr
    }
  }

  const filteredEvents = filterPastEvents
    ? expandedEvents.filter(
        (event) =>
          compareDateStrings(normalizeEventDateToMountainTime(event.event_date), todayMountain) >= 0
      )
    : expandedEvents

  filteredEvents.sort((a, b) =>
    compareDateStrings(
      normalizeEventDateToMountainTime(a.event_date),
      normalizeEventDateToMountainTime(b.event_date)
    )
  )

  return filteredEvents
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

