// POST { date?: "YYYY-MM-DD", city?: string, use_llm?: boolean, format?: "daily"|"weekend"|"week" }
// Finds events, beer releases and happy hours for the period, curates them
// (Haiku or deterministic), and creates a draft post. Does NOT render.
import { adminClient, HttpError, json, serve, todayInTz } from "../_shared/common.ts";
import {
  type DraftFormat,
  dayPrefix,
  parseDraftFormat,
  resolveDraftPeriod,
} from "../_shared/draftRange.ts";
import { type EventRow, formatDate } from "../_shared/events.ts";
import {
  type DayItem,
  coverLine,
  dealItemsForDay,
  eventItemsForDay,
  releaseItemsForDay,
} from "../_shared/items.ts";
import {
  CAPTION_ITEMS,
  type Curation,
  captionDeterministic,
  captionWithLlm,
  curateDeterministic,
  curateWithLlm,
  finalizeTags,
  rankItems,
} from "../_shared/llm.ts";
import { promoSlides } from "../_shared/promos.ts";
import { pickSlideItems } from "../_shared/slides.ts";

const RELEASE_SELECT = "*, " +
  "b1:breweries!beer_releases_brewery_id_fkey(*), " +
  "b2:breweries!beer_releases_brewery_id2_fkey(*), " +
  "b3:breweries!beer_releases_brewery_id3_fkey(*)";

function mergeItems(periodDates: string[], gather: (date: string) => DayItem[]): DayItem[] {
  const byKey = new Map<string, DayItem>();
  for (const date of periodDates) {
    const prefix = periodDates.length > 1 ? dayPrefix(date) : null;
    for (const item of gather(date)) {
      if (byKey.has(item.key)) continue;
      byKey.set(
        item.key,
        prefix ? { ...item, time_label: `${prefix} · ${item.time_label}` } : item,
      );
    }
  }
  return [...byKey.values()];
}

serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const format: DraftFormat = parseDraftFormat(body.format ?? body.range);
  const rawDate: string = body.date ?? todayInTz();
  const city: string = body.city ?? "Colorado Springs";
  const useLlm: boolean = body.use_llm ?? true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) throw new HttpError(400, "date must be YYYY-MM-DD");

  const period = resolveDraftPeriod(format, rawDate);
  const { anchor: date, dates: periodDates } = period;
  const lastDate = periodDates[periodDates.length - 1];
  const weekdays = [...new Set(periodDates.map((d) => formatDate(d).weekday))];

  const db = adminClient();

  // deno-lint-ignore no-explicit-any
  async function fetchAll(build: (from: number, to: number) => any, label: string) {
    // deno-lint-ignore no-explicit-any
    const rows: any[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await build(from, from + pageSize - 1);
      if (error) throw new HttpError(500, `${label} query failed: ${error.message}`);
      rows.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
    }
    return rows;
  }

  const dateInList = periodDates.join(",");
  const weekdayInList = weekdays.join(",");

  const [eventRows, releaseRows, dealRows] = await Promise.all([
    // one-time events on any day in range + recurring that started on/before the last day
    fetchAll((a, b) =>
      db.from("events_base").select("*, breweries(*)")
        .or(
          `event_date.in.(${dateInList}),and(event_date.lte.${lastDate},or(is_recurring.is.true,is_recurring_biweekly.is.true,is_recurring_monthly.is.true))`,
        )
        .range(a, b), "Event"),
    fetchAll((a, b) =>
      db.from("beer_releases_base").select(RELEASE_SELECT)
        .in("release_date", periodDates)
        .range(a, b), "Beer release"),
    // dated deals for any day in range + weekly deals for those weekdays
    fetchAll((a, b) =>
      db.from("happy_hour_deals").select("*, breweries(*)")
        .or(
          `deal_date.in.(${dateInList}),and(deal_date.is.null,day_of_week.in.(${weekdayInList}))`,
        )
        .range(a, b), "Happy hour"),
  ]);

  const items: DayItem[] = mergeItems(periodDates, (d) => [
    ...eventItemsForDay(eventRows as EventRow[], d, city),
    ...releaseItemsForDay(releaseRows, d, city),
    ...dealItemsForDay(dealRows, d, city),
  ]);
  if (items.length === 0) {
    const scope = format === "daily" ? date : `${periodDates[0]}–${lastDate} (${format})`;
    return json({ error: `Nothing found for ${city} on ${scope}` }, 404);
  }

  const periodCtx = { long: period.long, when: period.when };

  let curation: Curation;
  let usedLlm = false;
  let warning: string | null = null;
  if (useLlm) {
    try {
      curation = await curateWithLlm(items, date, city, periodCtx);
      usedLlm = true;
    } catch (e) {
      warning = `LLM curation failed, used deterministic fallback: ${(e as Error).message}`;
      curation = curateDeterministic(items, date, city, periodCtx);
    }
  } else {
    curation = curateDeterministic(items, date, city, periodCtx);
  }

  const byKey = new Map(items.map((i) => [i.key, i]));
  // Included items in rank order (featured picks first, then by tier), not time order.
  const includedItems = rankItems(
    curation.ordered_keys.map((k) => byKey.get(k)!).filter(Boolean),
    curation.featured_keys,
  );

  const { data: brand } = await db
    .from("brand_profiles").select("id, promo_slides, promo_slide_urls").eq("is_default", true).limit(1).maybeSingle();

  // Items that will get their own slide (same rule render-post uses). Only their breweries are tagged.
  const slideItems = pickSlideItems(
    includedItems.map((i) => ({ ...i, id: i.key })),
    curation.featured_keys,
    promoSlides(brand).length,
  );
  // Caption: written about the first CAPTION_ITEMS item slides, tagging those breweries in-sentence.
  const lead = slideItems.slice(0, CAPTION_ITEMS);
  let caption: string;
  if (usedLlm) {
    try {
      caption = await captionWithLlm(lead, includedItems, date, city, periodCtx);
    } catch (e) {
      warning = `LLM caption failed, used template caption: ${(e as Error).message}`;
      caption = captionDeterministic(lead, date, city, curation.blurbs, periodCtx);
    }
  } else {
    caption = captionDeterministic(lead, date, city, curation.blurbs, periodCtx);
  }
  curation.caption = finalizeTags(caption, items, lead);

  const { data: post, error: postErr } = await db
    .from("social_posts")
    .insert({
      format,
      city,
      post_date: date,
      status: "draft",
      caption: curation.caption,
      cover_line: coverLine(includedItems),
      brand_profile_id: brand?.id ?? null,
      used_llm: usedLlm,
      error: warning,
    })
    .select()
    .single();
  if (postErr) throw new HttpError(500, `Insert post failed: ${postErr.message}`);

  // Included items first (rank order), then excluded ones (also ranked) so the admin can switch them back on.
  const included = new Set(curation.ordered_keys);
  const featured = new Set(curation.featured_keys);
  const ordered = [...includedItems, ...rankItems(items.filter((i) => !included.has(i.key)))];
  const rows = ordered.map((it, position) => ({
    post_id: post.id,
    item_type: it.type,
    event_id: it.type === "event" ? it.id : null,
    release_id: it.type === "release" ? Number(it.id) : null,
    deal_id: it.type === "deal" ? it.id : null,
    position,
    included: included.has(it.key),
    featured: featured.has(it.key),
    short_description: curation.blurbs[it.key] ?? null,
  }));
  const { error: itemsErr } = await db.from("social_post_items").insert(rows);
  if (itemsErr) throw new HttpError(500, `Insert items failed: ${itemsErr.message}`);

  const count = (t: string) => items.filter((i) => i.type === t).length;
  return json({
    post_id: post.id,
    date,
    dates: periodDates,
    format,
    city,
    found: { events: count("event"), releases: count("release"), deals: count("deal") },
    events_found: items.length, // kept for the existing admin toast
    included: includedItems.length,
    used_llm: usedLlm,
    warning,
  });
});
