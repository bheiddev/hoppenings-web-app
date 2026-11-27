/** Draft build modes: daily / weekend (Fri–Sun) / week (Mon–Thu). */

export type DraftFormat = "daily" | "weekend" | "week";

export const DRAFT_FORMATS: DraftFormat[] = ["daily", "weekend", "week"];

export function parseDraftFormat(raw: unknown): DraftFormat {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (v === "weekend" || v === "week" || v === "daily") return v;
  return "daily";
}

function toUtc(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

function ymd(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

export function addDays(d: string, n: number): string {
  const dt = toUtc(d);
  dt.setUTCDate(dt.getUTCDate() + n);
  return ymd(dt);
}

function dow(d: string): number {
  return toUtc(d).getUTCDay();
}

/** Snap any calendar pick to the range anchor stored as post_date. */
export function snapDraftDate(format: DraftFormat, date: string): string {
  if (format === "daily") return date;
  const day = dow(date);
  if (format === "weekend") {
    if (day === 5) return date;
    if (day === 6) return addDays(date, -1);
    if (day === 0) return addDays(date, -2);
    return addDays(date, 5 - day);
  }
  if (day === 1) return date;
  if (day === 0) return addDays(date, -6);
  return addDays(date, 1 - day);
}

export function draftDatesFor(format: DraftFormat, anchor: string): string[] {
  const start = snapDraftDate(format, anchor);
  if (format === "daily") return [start];
  if (format === "weekend") return [start, addDays(start, 1), addDays(start, 2)];
  return [start, addDays(start, 1), addDays(start, 2), addDays(start, 3)];
}

function fmt(d: string, opts: Intl.DateTimeFormatOptions): string {
  return toUtc(d).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
}

export interface DraftPeriod {
  format: DraftFormat;
  /** Stored as social_posts.post_date (range start). */
  anchor: string;
  dates: string[];
  /** "Saturday, November 28, 2026" or "Friday–Sunday, November 28–30, 2026" */
  long: string;
  /** "today" | "this weekend" | "this week" — for captions / cover copy */
  when: string;
  /** Cover slide eyebrow, e.g. "FRI–SUN · NOV 28–30" */
  coverEyebrow: string;
  /** Featured slide eyebrow, e.g. "FRI–SUN · NOV 28" */
  dateEyebrow: string;
}

export function resolveDraftPeriod(format: DraftFormat, date: string): DraftPeriod {
  const anchor = snapDraftDate(format, date);
  const dates = draftDatesFor(format, anchor);
  const first = dates[0];
  const last = dates[dates.length - 1];

  if (format === "daily") {
    const long = fmt(first, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const short = fmt(first, { weekday: "short", month: "short", day: "numeric" }); // "Sat, Nov 21"
    const weekday = fmt(first, { weekday: "long" });
    const monthDay = short.split(", ")[1] ?? short;
    return {
      format,
      anchor,
      dates,
      long,
      when: "today",
      coverEyebrow: `${weekday.toUpperCase()} · ${monthDay.toUpperCase()}`,
      dateEyebrow: short.replace(",", " ·").toUpperCase(),
    };
  }

  const monthDaySpan = (() => {
    const a = fmt(first, { month: "short", day: "numeric" });
    const bDay = toUtc(last).getUTCDate();
    if (first.slice(0, 7) === last.slice(0, 7)) return `${a}–${bDay}`;
    return `${a} – ${fmt(last, { month: "short", day: "numeric" })}`;
  })();
  const year = fmt(last, { year: "numeric" });

  if (format === "weekend") {
    return {
      format,
      anchor,
      dates,
      long: `Friday–Sunday, ${monthDaySpan}, ${year}`,
      when: "this weekend",
      coverEyebrow: `FRI–SUN · ${monthDaySpan.toUpperCase()}`,
      dateEyebrow: `FRI–SUN · ${monthDaySpan.toUpperCase()}`,
    };
  }

  return {
    format,
    anchor,
    dates,
    long: `Monday–Thursday, ${monthDaySpan}, ${year}`,
    when: "this week",
    coverEyebrow: `MON–THU · ${monthDaySpan.toUpperCase()}`,
    dateEyebrow: `MON–THU · ${monthDaySpan.toUpperCase()}`,
  };
}

/** Prefixed weekday short for multi-day item time labels ("Fri · 6 PM"). */
export function dayPrefix(date: string): string {
  return fmt(date, { weekday: "short" });
}
