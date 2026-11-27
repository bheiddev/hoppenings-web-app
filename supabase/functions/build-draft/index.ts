// POST { date?: "YYYY-MM-DD", city?: string, use_llm?: boolean }
// Finds the day's events, beer releases and happy hours for the region, curates them
// (Haiku or deterministic), and creates a draft post. Does NOT render.
import { adminClient, HttpError, json, serve, todayInTz } from "../_shared/common.ts";
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

serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const date: string = body.date ?? todayInTz();
  const city: string = body.city ?? "Colorado Springs";
  const useLlm: boolean = body.use_llm ?? true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "date must be YYYY-MM-DD");

  const db = adminClient();
  const weekday = formatDate(date).weekday;

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

  const [eventRows, releaseRows, dealRows] = await Promise.all([
    // one-time events on the date + recurring events that started on/before it
    fetchAll((a, b) =>
      db.from("events_base").select("*, breweries(*)")
        .or(`event_date.eq.${date},and(event_date.lte.${date},or(is_recurring.is.true,is_recurring_biweekly.is.true,is_recurring_monthly.is.true))`)
        .range(a, b), "Event"),
    fetchAll((a, b) =>
      db.from("beer_releases_base").select(RELEASE_SELECT).eq("release_date", date).range(a, b), "Beer release"),
    // dated deals for the day + weekly deals for this weekday
    fetchAll((a, b) =>
      db.from("happy_hour_deals").select("*, breweries(*)")
        .or(`deal_date.eq.${date},and(deal_date.is.null,day_of_week.eq.${weekday})`)
        .range(a, b), "Happy hour"),
  ]);

  const items: DayItem[] = [
    ...eventItemsForDay(eventRows as EventRow[], date, city),
    ...releaseItemsForDay(releaseRows, date, city),
    ...dealItemsForDay(dealRows, date, city),
  ];
  if (items.length === 0) {
    return json({ error: `Nothing found for ${city} on ${date}` }, 404);
  }

  let curation: Curation;
  let usedLlm = false;
  let warning: string | null = null;
  if (useLlm) {
    try {
      curation = await curateWithLlm(items, date, city);
      usedLlm = true;
    } catch (e) {
      warning = `LLM curation failed, used deterministic fallback: ${(e as Error).message}`;
      curation = curateDeterministic(items, date, city);
    }
  } else {
    curation = curateDeterministic(items, date, city);
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
      caption = await captionWithLlm(lead, includedItems, date, city);
    } catch (e) {
      warning = `LLM caption failed, used template caption: ${(e as Error).message}`;
      caption = captionDeterministic(lead, date, city, curation.blurbs);
    }
  } else {
    caption = captionDeterministic(lead, date, city, curation.blurbs);
  }
  curation.caption = finalizeTags(caption, items, lead);

  const { data: post, error: postErr } = await db
    .from("social_posts")
    .insert({
      format: "daily",
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
    city,
    found: { events: count("event"), releases: count("release"), deals: count("deal") },
    events_found: items.length, // kept for the existing admin toast
    included: includedItems.length,
    used_llm: usedLlm,
    warning,
  });
});