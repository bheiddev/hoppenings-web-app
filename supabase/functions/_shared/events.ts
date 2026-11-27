// Pure event logic: recurrence expansion, dedupe, formatting.
// No imports on purpose so it can be unit-tested anywhere.

export interface EventRow {
  id: string;
  brewery_id: string;
  title: string;
  event_date: string | null; // YYYY-MM-DD (base date for recurring events)
  start_time: string | null; // HH:MM:SS
  end_time: string | null;
  cost: number | string | null;
  is_recurring: boolean | null;
  is_recurring_biweekly: boolean | null;
  is_recurring_monthly: boolean | null;
  featured: boolean;
  description?: string | null;
  // deno-lint-ignore no-explicit-any
  breweries?: Record<string, any> | null;
}

export interface DayEvent {
  event_id: string;
  brewery_id: string;
  brewery: string;
  brewery_handle: string | null;
  city: string | null;
  title: string;
  start_time: string | null;
  end_time: string | null;
  cost: number;
  recurring: boolean;
  featured: boolean;
}

// ---- breweries: column names vary, so read defensively -------------------
// deno-lint-ignore no-explicit-any
export function breweryName(b: Record<string, any> | null | undefined): string {
  return (b?.display_name ?? b?.short_name ?? b?.name ?? "Unknown brewery") as string;
}
// deno-lint-ignore no-explicit-any
export function breweryCity(b: Record<string, any> | null | undefined): string | null {
  // breweries."Region" (capital R) is the real column; the rest are fallbacks.
  return (b?.Region ?? b?.region ?? b?.city ?? null) as string | null;
}
// deno-lint-ignore no-explicit-any
export function breweryHandle(b: Record<string, any> | null | undefined): string | null {
  const raw = (b?.instagram_handle ?? b?.instagram_username ?? b?.instagram ?? null) as
    | string
    | null;
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^@/, "");
  return cleaned ? `@${cleaned}` : null;
}

// ---- dates (all UTC math on plain YYYY-MM-DD to avoid TZ drift) ----------
function toUtc(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}
function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86_400_000);
}
function weekday(d: string): number {
  return toUtc(d).getUTCDay();
}
function nthWeekdayOfMonth(d: string): number {
  return Math.ceil(toUtc(d).getUTCDate() / 7);
}

/**
 * Does this event happen on `date`?
 * - one-time: event_date === date
 * - weekly:   same weekday, on/after event_date
 * - biweekly: every 14 days from event_date
 * - monthly:  same weekday + same nth occurrence in the month
 *             (e.g. base date is the 3rd Saturday -> every 3rd Saturday).
 *             ASSUMPTION: verify this matches how the app/crawler defines monthly.
 */
export function occursOn(e: EventRow, date: string): boolean {
  if (!e.event_date) return false;
  if (e.event_date === date) return true;
  const recurring = !!(e.is_recurring || e.is_recurring_biweekly || e.is_recurring_monthly);
  if (!recurring) return false;
  const diff = daysBetween(e.event_date, date);
  if (diff < 0) return false;
  if (e.is_recurring_monthly) {
    return weekday(e.event_date) === weekday(date) &&
      nthWeekdayOfMonth(e.event_date) === nthWeekdayOfMonth(date);
  }
  if (e.is_recurring_biweekly) return diff % 14 === 0;
  return diff % 7 === 0; // weekly
}

function normTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Expand to the given day, filter by city, dedupe.
 * Dedupe rule: same brewery + same normalized title on the same day ->
 * keep the one-time entry over the recurring one (it's newer/more specific).
 */
export function eventsForDay(rows: EventRow[], date: string, city?: string | null): DayEvent[] {
  const wantCity = city?.trim().toLowerCase() || null;
  const byKey = new Map<string, { row: EventRow; recurring: boolean }>();

  for (const row of rows) {
    if (!occursOn(row, date)) continue;
    const c = breweryCity(row.breweries);
    // Only breweries explicitly in the requested region (no region set = excluded).
    if (wantCity && (!c || c.trim().toLowerCase() !== wantCity)) continue;

    const recurring = row.event_date !== date;
    const key = `${row.brewery_id}|${normTitle(row.title)}`;
    const existing = byKey.get(key);
    if (!existing || (existing.recurring && !recurring)) byKey.set(key, { row, recurring });
  }

  const out: DayEvent[] = [...byKey.values()].map(({ row, recurring }) => ({
    event_id: row.id,
    brewery_id: row.brewery_id,
    brewery: breweryName(row.breweries),
    brewery_handle: breweryHandle(row.breweries),
    city: breweryCity(row.breweries),
    title: row.title.trim(),
    start_time: row.start_time,
    end_time: row.end_time,
    cost: Number(row.cost ?? 0) || 0,
    recurring,
    featured: !!row.featured,
  }));

  return out.sort(compareByTime);
}

export function compareByTime(a: { start_time: string | null; title: string }, b: { start_time: string | null; title: string }): number {
  const ta = a.start_time ?? "99:99";
  const tb = b.start_time ?? "99:99";
  return ta === tb ? a.title.localeCompare(b.title) : ta.localeCompare(tb);
}

/** "18:00:00" -> "6 PM", "18:30:00" -> "6:30 PM", null -> "All day" */
export function formatTime(t: string | null): string {
  if (!t) return "All day";
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
}

export function formatCost(cost: number): string | null {
  if (!cost || cost <= 0) return null;
  return Number.isInteger(cost) ? `$${cost}` : `$${cost.toFixed(2)}`;
}

/** "2026-11-21" -> { weekday: "Saturday", short: "Sat, Nov 21" } */
export function formatDate(d: string): { weekday: string; short: string; long: string } {
  const dt = toUtc(d);
  const opts = { timeZone: "UTC" } as const;
  return {
    weekday: dt.toLocaleDateString("en-US", { ...opts, weekday: "long" }),
    short: dt.toLocaleDateString("en-US", { ...opts, weekday: "short", month: "short", day: "numeric" }),
    long: dt.toLocaleDateString("en-US", { ...opts, weekday: "long", month: "long", day: "numeric" }),
  };
}

