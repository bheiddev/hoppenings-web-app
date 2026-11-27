import {
  type DayEvent,
  type EventRow,
  breweryCity,
  breweryHandle,
  breweryName,
  compareByTime,
  eventsForDay,
  formatDate,
  formatTime,
} from "./events.ts";

// One shape for everything that can go in a post: events, beer releases, happy hours.
// Pure functions (no I/O) so they can be tested anywhere.


export type ItemType = "event" | "release" | "deal";

export interface DayItem {
  key: string;                 // `${type}:${id}`, unique within a day
  type: ItemType;
  id: string;                  // source row id as text
  brewery_id: string | null;   // primary brewery (photo comes from here)
  brewery: string;             // display name (collabs joined with ×)
  brewery_handle: string | null;
  title: string;
  sort_time: string | null;    // "HH:MM:SS" for ordering; null = all day / no time
  time_label: string;          // "6 PM", "4–6 PM", "After 8 PM", "New release"
  meta: string | null;         // releases: "Hazy IPA · 6.5% ABV"
  description: string | null;
  cost: number;
  recurring: boolean;          // weekly/recurring items are less "special"
  featured_by_brewery: boolean;
  collabs?: { brewery: string; handle: string | null }[]; // other breweries on a collab release
}

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

// ---------------------------------------------------------------- events
export function eventToItem(e: DayEvent, description: string | null = null): DayItem {
  return {
    key: `event:${e.event_id}`, type: "event", id: e.event_id,
    brewery_id: e.brewery_id, brewery: e.brewery, brewery_handle: e.brewery_handle,
    title: e.title, sort_time: e.start_time, time_label: formatTime(e.start_time), meta: null,
    description, cost: e.cost, recurring: e.recurring, featured_by_brewery: e.featured,
  };
}

export function eventItemsForDay(rows: EventRow[], date: string, city?: string | null): DayItem[] {
  const descById = new Map(rows.map((r) => [r.id, (r.description ?? null) as string | null]));
  return eventsForDay(rows, date, city).map((e) => eventToItem(e, descById.get(e.event_id) ?? null));
}

// ---------------------------------------------------------------- beer releases
// Rows are selected with the three brewery FKs aliased as b1, b2, b3.
function releaseBreweries(r: Row): Row[] {
  return [r.b1, r.b2, r.b3].filter((b) => b && typeof b === "object");
}

export function formatAbv(abv: unknown): string | null {
  if (abv === null || abv === undefined) return null;
  const t = String(abv).trim();
  if (!t) return null;
  return /^\d+(\.\d+)?$/.test(t) ? `${t}% ABV` : /abv/i.test(t) ? t : `${t} ABV`;
}

export function releaseToItem(r: Row): DayItem {
  const bs = releaseBreweries(r);
  const primary = bs[0] ?? null;
  const style = (r.Type ?? r.type ?? "").toString().trim();
  const abv = formatAbv(r.ABV ?? r.abv);
  const meta = [style, abv].filter(Boolean).join(" · ") || null;
  return {
    key: `release:${r.id}`, type: "release", id: String(r.id),
    brewery_id: primary?.id ?? r.brewery_id ?? null,
    brewery: bs.length ? bs.map((b) => breweryName(b)).join(" × ") : "Unknown brewery",
    brewery_handle: breweryHandle(primary),
    title: (r.beer_name ?? "New release").toString().trim(),
    sort_time: null, time_label: "New release", meta,
    description: r.description ?? null, cost: 0, recurring: false, featured_by_brewery: false,
    collabs: bs.slice(1).map((b) => ({ brewery: breweryName(b), handle: breweryHandle(b) })),
  };
}

/** Releases whose release_date is the day, at a brewery in the region (any collab brewery counts). */
export function releaseItemsForDay(rows: Row[], date: string, city?: string | null): DayItem[] {
  const want = city?.trim().toLowerCase() || null;
  const seen = new Set<string>();
  const out: DayItem[] = [];
  for (const r of rows) {
    if (r.release_date !== date) continue;
    if (want && !releaseBreweries(r).some((b) => (breweryCity(b) ?? "").trim().toLowerCase() === want)) continue;
    const item = releaseToItem(r);
    const k = `${item.brewery_id}|${item.title.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out.sort((a, b) => a.brewery.localeCompare(b.brewery) || a.title.localeCompare(b.title));
}

// ---------------------------------------------------------------- happy hours / deals
function hourLabel(h: number): { n: string; ap: "AM" | "PM" } {
  return { n: String(h % 12 === 0 ? 12 : h % 12), ap: h >= 12 ? "PM" : "AM" };
}
/** time_start/time_end are whole hours 0-23. */
export function dealTimeLabel(start: number | null | undefined, end: number | null | undefined): string {
  const s = start === null || start === undefined ? null : hourLabel(start);
  const e = end === null || end === undefined ? null : hourLabel(end);
  if (s && e) return s.ap === e.ap ? `${s.n}–${e.n} ${e.ap}` : `${s.n} ${s.ap}–${e.n} ${e.ap}`;
  if (s) return `After ${s.n} ${s.ap}`;
  if (e) return `Until ${e.n} ${e.ap}`;
  return "All day";
}

export function dealToItem(d: Row, date: string): DayItem {
  const b = d.breweries ?? null;
  const start = d.time_start ?? null;
  return {
    key: `deal:${d.id}`, type: "deal", id: String(d.id),
    brewery_id: d.brewery_id ?? b?.id ?? null, brewery: breweryName(b), brewery_handle: breweryHandle(b),
    title: (d.title ?? "Happy hour").toString().trim(),
    sort_time: start === null ? null : `${String(start).padStart(2, "0")}:00:00`,
    time_label: dealTimeLabel(d.time_start, d.time_end), meta: null,
    description: d.description ?? null, cost: 0,
    recurring: !d.deal_date || d.deal_date !== date, featured_by_brewery: false,
  };
}

/**
 * Deals on the day: deal_date === date (one-off), or no deal_date and day_of_week matches (weekly).
 * Same brewery + same title keeps the dated one.
 */
export function dealItemsForDay(rows: Row[], date: string, city?: string | null): DayItem[] {
  const want = city?.trim().toLowerCase() || null;
  const weekday = formatDate(date).weekday; // "Saturday"
  const byKey = new Map<string, { row: Row; dated: boolean }>();
  for (const d of rows) {
    const dated = d.deal_date === date;
    const weekly = !d.deal_date && d.day_of_week === weekday;
    if (!dated && !weekly) continue;
    if (want && (breweryCity(d.breweries) ?? "").trim().toLowerCase() !== want) continue;
    const k = `${d.brewery_id}|${String(d.title ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`;
    const ex = byKey.get(k);
    if (!ex || (!ex.dated && dated)) byKey.set(k, { row: d, dated });
  }
  return [...byKey.values()].map(({ row }) => dealToItem(row, date))
    .sort((a, b) => compareByTime({ start_time: a.sort_time, title: a.title }, { start_time: b.sort_time, title: b.title }));
}

// ---------------------------------------------------------------- shared
export const SECTION_ORDER: ItemType[] = ["event", "release", "deal"];

/** Display order: events by time, then releases, then deals by time. */
export function orderItems(items: DayItem[]): DayItem[] {
  return SECTION_ORDER.flatMap((t) => items.filter((i) => i.type === t));
}

export function coverLine(items: DayItem[]): string {
  const n = (t: ItemType) => items.filter((i) => i.type === t).length;
  const parts = [
    [n("event"), "event", "events"],
    [n("release"), "new release", "new releases"],
    [n("deal"), "happy hour", "happy hours"],
  ].filter(([c]) => (c as number) > 0).map(([c, one, many]) => `${c} ${c === 1 ? one : many}`);
  return parts.join(" · ") || "Nothing on today";
}

/**
 * Fallback one-line blurb from a long description: first sentence, cut at a word boundary.
 * (Haiku writes nicer ones; this is used without AI and for posts made before blurbs existed.)
 */
export function shortBlurb(description: string | null | undefined, max = 64): string | null {
  const t = (description ?? "").trim().replace(/\s+/g, " ");
  if (!t) return null;
  const first = (t.match(/^.+?[.!?](\s|$)/)?.[0] ?? t).trim();
  if (first.length <= max) return first.replace(/[.]$/, "");
  const cut = first.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.5 ? cut.slice(0, sp) : cut).replace(/[\s,;:–-]+$/, "") + "…";
}

