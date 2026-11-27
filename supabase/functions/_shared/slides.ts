import { formatDate } from "./events.ts";

// Pure slide planning: turns post items into an ordered list of slide specs.
//   1. cover              "What's Hoppening? In <city>"
//   2..n. featured items  one slide per starred item (same template)
//   promo slides          Tap Tracker + app CTA (render-post inserts these)
// Instagram carousels max out at 10 slides: 1 cover + 7 items + 2 promos.

export const MAX_SLIDES = 10; // Instagram carousel limit via the API

// Kept for anything else that still imports them; slides no longer use list layouts.
export const ITEMS_PER_SLIDE = 5;
export const PER_SLIDE: Record<"event" | "release" | "deal", number> = { release: 5, event: 4, deal: 4 };

export type SlideItemType = "event" | "release" | "deal";

export interface SlideItem {
  type: SlideItemType;
  time: string;               // "6 PM", "4–6 PM", "New release"
  title: string;
  brewery: string;
  price: string | null;       // "$10" or null
  meta?: string | null;       // releases: "Hazy IPA · 6.5% ABV"
  blurb?: string | null;      // events + happy hours: one-line description
  description?: string | null;
  // render-post resolves URLs; render-slide fetches them into imageData.
  image?: { url: string; fallback_url: string } | null;
  imageData?: string | null; // data: URI, set by render-slide just before rendering
}

/** Order the item slides appear in: beer releases always lead, then events, then happy hours. */
export const DISPLAY_ORDER: SlideItemType[] = ["release", "event", "deal"];
/** Who gets a slot first when there isn't room for everything. */
export const PRIORITY_ORDER: SlideItemType[] = ["release", "event", "deal"];
/** Fallback event cap when nothing is starred. Starred-only posts ignore this. */
export const MAX_EVENTS = 3;

export const SECTION_HEADINGS: Record<SlideItemType, string> = {
  event: "Events",
  release: "New releases",
  deal: "Happy hours",
};

/** Eyebrow label on each item slide (starred items say "Featured" instead). */
export const ITEM_LABELS: Record<SlideItemType, string> = {
  event: "Event",
  release: "Beer release",
  deal: "Happy hour",
};

/** A small photo card on the cover, teasing one of the item slides ahead. */
export interface CoverPreview {
  itemId?: string;            // social_post_items.id (render-post attaches the photo)
  type: SlideItemType;
  label: string;              // "New beer", "Event", "Happy hour"
  title: string;
  time: string;
  brewery: string;
  description?: string | null; // shown on the hero card
  image?: { url: string; fallback_url: string } | null;
  imageData?: string | null;  // data: URI, set by render-slide just before rendering
}
export const COVER_PREVIEWS = 5; // 1 hero + up to 4 in the "Also today" list
export const COVER_LIST = 4;
export const PREVIEW_LABELS: Record<SlideItemType, string> = {
  event: "Event",
  release: "New beer",
  deal: "Happy hour",
};

export type SlideSpec =
  | {
    kind: "cover";
    dateEyebrow: string;  // "SATURDAY · NOV 21"
    city: string;
    statLine: string;     // "14 events · 3 new releases · 5 happy hours"
    itemCount?: number;   // total included items, for the "N things today" badge
    previews?: CoverPreview[]; // [hero, ...short list]; only the hero gets a photo
    moreCount?: number;   // item slides not shown on the cover
  }
  | {
    kind: "featured";     // one item, photo on top + text below
    n: number;            // 1-based, across all item slides
    of: number;
    label?: string;       // "Featured", "Event", "Happy hour", "Beer release"
    itemId?: string;      // social_post_items.id (render-post uses it to attach the photo)
    dateEyebrow: string;
    item: SlideItem;
  }
  | {
    // No longer produced by planSlides; kept so older code still type-checks.
    kind: "list";
    section: SlideItemType;
    heading: string;
    dateEyebrow: string;
    page: number;
    pages: number;
    items: SlideItem[];
    moreCount: number;
  }
  | { kind: "end"; city: string; cta: string; handle: string }
  /** Animated promo (Tap Tracker / app CTA). Replaces static PNGs so reels can animate. */
  | {
    kind: "promo";
    variant: "tap_tracker" | "app";
    city: string;
    cta: string;
    handle: string;
    /** End/app promo phone mockup as data: URI (set by render-slide). */
    appImageData?: string | null;
  }
  /** Legacy one-off campaign image (JPEG/PNG URL). Prefer `promo` templates. */
  | { kind: "static"; url: string };

export interface PlanInput {
  postDate: string;
  city: string | null;
  coverLine: string | null;
  items: (SlideItem & { id: string })[]; // included only, in display order
  featuredIds: string[];                 // starred items, shown first
  cta: string;
  handle: string;
  /** Number of static promo slides render-post will append (replaces the rendered end slide). */
  staticTail?: number;
}

/** How many item slides fit after the cover and the end/promo slides. */
export function itemSlots(staticTail?: number): number {
  const tail = staticTail && staticTail > 0 ? staticTail : 1; // promo slides, or the end slide
  return Math.max(0, MAX_SLIDES - 1 - tail);
}

/**
 * Which items get their own slide, in slide order.
 * If anything is starred: only starred items (unstarred are unlisted). Cap = itemSlots
 * (7 with cover + 2 promo ads). Order: releases → events → happy hours.
 * If nothing is starred: fill slots with the old auto-pick so drafts still have content.
 * build-draft uses this too, so the caption only tags breweries that are on the slides.
 */
export function pickSlideItems<T extends { id: string; type: SlideItemType }>(
  items: T[],
  featuredIds: string[],
  staticTail?: number,
): T[] {
  const starred = new Set(featuredIds);
  let left = itemSlots(staticTail);
  const picked: Record<SlideItemType, T[]> = { event: [], deal: [], release: [] };

  if (starred.size > 0) {
    for (const t of PRIORITY_ORDER) {
      const ofType = items.filter((i) => i.type === t && starred.has(i.id));
      picked[t] = ofType.slice(0, left);
      left -= picked[t].length;
    }
    return DISPLAY_ORDER.flatMap((t) => picked[t]);
  }

  const ofType = (t: SlideItemType) => items.filter((i) => i.type === t);
  const candidates: Record<SlideItemType, T[]> = {
    event: ofType("event").slice(0, MAX_EVENTS),
    deal: ofType("deal"),
    release: ofType("release"),
  };
  for (const t of PRIORITY_ORDER) {
    picked[t] = candidates[t].slice(0, left);
    left -= picked[t].length;
  }
  return DISPLAY_ORDER.flatMap((t) => picked[t]);
}

export function planSlides(p: PlanInput): SlideSpec[] {
  const d = formatDate(p.postDate);
  const city = p.city ?? "Colorado Springs";
  const dateEyebrow = d.short.replace(",", " ·").toUpperCase(); // "SAT · NOV 21"
  const longEyebrow = `${d.weekday.toUpperCase()} · ${d.short.split(", ")[1].toUpperCase()}`; // "SATURDAY · NOV 21"

  const starred = new Set(p.featuredIds);
  const shown = pickSlideItems(p.items, p.featuredIds, p.staticTail);

  // Cover hero: a beer release always wins when there is one; otherwise the top starred event
  // (the AI's best pick), else the top event. The "Also today" list mixes types, in slide order.
  const hero = shown.find((i) => i.type === "release") ??
    shown.find((i) => i.type === "event" && starred.has(i.id)) ?? shown.find((i) => i.type === "event") ?? shown[0];
  const others = shown.filter((i) => i !== hero);
  const listIds = new Set<string>();
  for (const t of DISPLAY_ORDER) {
    const first = others.find((i) => i.type === t);
    if (first && listIds.size < COVER_LIST) listIds.add(first.id);
  }
  for (const i of others) if (listIds.size < COVER_LIST) listIds.add(i.id);
  const toPreview = (i: SlideItem & { id: string }): CoverPreview => ({
    itemId: i.id, type: i.type, label: PREVIEW_LABELS[i.type],
    title: i.title, time: i.time, brewery: i.brewery, image: null,
    description: i.description ?? i.blurb ?? null,
  });
  const previews: CoverPreview[] = hero
    ? [toPreview(hero), ...others.filter((i) => listIds.has(i.id)).map(toPreview)]
    : [];

  const slides: SlideSpec[] = [{
    kind: "cover",
    dateEyebrow: longEyebrow,
    city,
    statLine: p.coverLine || `${p.items.length} things happening today`,
    itemCount: p.items.length,
    previews,
    moreCount: Math.max(0, shown.length - previews.length),
  }];

  shown.forEach((item, i) => {
    slides.push({
      kind: "featured", n: i + 1, of: shown.length,
      label: starred.has(item.id) ? "Featured" : ITEM_LABELS[item.type],
      itemId: item.id, dateEyebrow, item: strip(item, true),
    });
  });

  if (!(p.staticTail && p.staticTail > 0)) slides.push({ kind: "end", city, cta: p.cta, handle: p.handle });
  return slides;
}

function strip(i: SlideItem, withImage = false): SlideItem {
  return {
    type: i.type, time: i.time, title: i.title, brewery: i.brewery, price: i.price,
    meta: i.meta ?? null, blurb: i.blurb ?? null, description: i.description ?? null,
    ...(withImage ? { image: i.image ?? null } : {}),
  };
}

