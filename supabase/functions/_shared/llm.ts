import { compareByTime, formatCost, formatDate } from "./events.ts";
import {
  type DayItem,
  orderItems,
  shortBlurb,
} from "./items.ts";

// Haiku picks 2-5 featured items and optionally trims a huge day; a second, small call writes
// the caption about the first slides once the slide order is known.
// It never produces layout, dates or ordering (ordering is deterministic in code).



export interface Curation {
  ordered_keys: string[];   // items to include, in display order
  featured_keys: string[];  // up to MAX_FEATURED starred item slides
  caption: string;
  blurbs: Record<string, string>; // item key -> one-line blurb (events + happy hours)
}

const BLURB_MAX = 64;
const wantsBlurb = (i: DayItem) => (i.type === "event" || i.type === "deal") && !!i.description?.trim();

/** Blurbs for items Haiku didn't cover (or the whole day without AI). */
function fallbackBlurbs(items: DayItem[], have: Record<string, string> = {}): Record<string, string> {
  const out = { ...have };
  for (const i of items) {
    if (!wantsBlurb(i) || out[i.key]) continue;
    const b = shortBlurb(i.description, BLURB_MAX);
    if (b) out[i.key] = b;
  }
  return out;
}

const MAX_ITEMS = 40;
/** Cover + 2 promo ads → 7 item slides in a 10-slide Instagram carousel. */
const MAX_FEATURED = 7;
/** Generic weekly staples that shouldn't be featured. */
// Featured ranking tiers (1 = best). Used by the no-AI fallback; the same order is in the prompt.
const TIERS: [number, RegExp][] = [
  [9, /\b(watch party|watch parties|game day|gameday|vs\.?|football|soccer|nfl|nba|nhl|mlb|mls|ufc|broncos|avalanche|avs|nuggets|rockies|switchbacks|buffs|arsenal|super bowl|march madness|playoffs?)\b/i],
  [1, /\b(anniversary|birthday bash|birthday party)\b/i],
  [2, /\b(market|christkindl|car show|festival|fest|oktoberfest|halloween|holiday|christmas|winter|spring|summer|fall|harvest|bazaar|craft fair|pumpkin|tree lighting)\b/i],
  [8, /\b(trivia|bingo|quiz)\b/i],
  [5, /\b(chili|cook-?off|cookoff|bbq|barbecue|crawfish|boil|pig roast|oysters?|tamales?|pairing|beer dinner|tasting dinner|food truck rally|pie contest|bake-?off|chowder|smoked|brisket)\b/i],
  [6, /\b(yoga|pilates|barre|boot ?camp|hiit|workout|fitness|spin class|cycling class|zumba|stretch|crossfit|tai chi|dance class|sweat)\b/i],
  [7, /\b(book club|run club|running club)\b/i],
  [4, /\b(live music|concert|band|acoustic|music|dj|sessions|singer|songwriter|jazz|bluegrass)\b/i],
];
const CRAFT = /\b(workshop|class|painting|paint|craft|pottery|candle|terrarium|wreath|centerpiece|make your own|diy)\b/i;

/** 1 = anniversary … 9 = sports watch party. Releases rank 1 (always featured anyway). */
function tier(i: DayItem): number {
  if (i.type === "release") return 1;
  if (i.type === "deal") return 8.5;
  const t = `${i.title} ${i.description ?? ""}`;
  const title = i.title;
  for (const [n, re] of TIERS) if (re.test(n === 9 || n === 8 ? title : t)) {
    // craft events that cost money outrank live music etc. even if a keyword matched lower
    if (n >= 4 && CRAFT.test(t) && i.cost > 0) return 3;
    return n;
  }
  if (CRAFT.test(t) && i.cost > 0) return 3;
  return i.recurring ? 6.5 : 4.5; // unknown one-offs sit just below live music
}
/** Higher = better. Same tier order as the prompt, plus small boosts. */
export function rankScore(i: DayItem): number {
  return (10 - tier(i)) * 20 +
    (i.featured_by_brewery ? 15 : 0) +
    (i.type === "event" && !i.recurring ? 6 : 0) +
    (i.cost > 0 ? 3 : 0);
}

/**
 * Rank order: the featured picks first, in the order chosen (Haiku's "best first"),
 * then everything else by rankScore, ties by start time. Saved as `position`, so the
 * slides pick and order items by rank.
 */
export function rankItems(items: DayItem[], featuredKeys: string[] = []): DayItem[] {
  const pick = new Map(featuredKeys.map((k, i) => [k, i]));
  return [...items].sort((a, b) => {
    const pa = pick.get(a.key), pb = pick.get(b.key);
    if (pa !== undefined || pb !== undefined) return (pa ?? Infinity) - (pb ?? Infinity);
    return rankScore(b) - rankScore(a) ||
      compareByTime({ start_time: a.sort_time, title: a.title }, { start_time: b.sort_time, title: b.title });
  });
}
const TYPE_LABEL = { event: "event", release: "beer release", deal: "happy hour / deal" } as const;

export async function curateWithLlm(items: DayItem[], date: string, city: string): Promise<Curation> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-5-5";
  const d = formatDate(date);
  const ordered = orderItems(items);

  // Number items 1..N; Haiku answers with numbers only.
  const compact = ordered.map((it, i) => ({
    n: i + 1,
    type: TYPE_LABEL[it.type],
    when: it.time_label,
    title: it.title,
    brewery: it.brewery,
    ...(it.brewery_handle ? { handle: it.brewery_handle } : {}),
    ...(it.collabs?.length ? { collab_with: it.collabs.map((c) => c.handle ? { brewery: c.brewery, handle: c.handle } : { brewery: c.brewery }) } : {}),
    ...(it.meta ? { details: it.meta } : {}),
    ...(it.cost ? { price: formatCost(it.cost) } : {}),
    ...(it.type === "event" ? { weekly_recurring: it.recurring } : {}),
    ...(it.featured_by_brewery ? { featured_by_brewery: true } : {}),
    ...(wantsBlurb(it) ? { description: it.description!.trim().replace(/\s+/g, " ").slice(0, 400) } : {}),
  }));

  const counts = {
    events: ordered.filter((i) => i.type === "event").length,
    releases: ordered.filter((i) => i.type === "release").length,
    deals: ordered.filter((i) => i.type === "deal").length,
  };

  const prompt = `You curate a daily Instagram carousel for Hoppenings, a brewery events app in ${city}.
Date: ${d.long}. Today: ${counts.events} events, ${counts.releases} beer releases, ${counts.deals} happy hours/deals.
Items (n = item number):
${JSON.stringify(compact)}

Call submit_curation with:
- featured: item numbers of EVENTS or HAPPY HOURS to feature on their own full slides, best first. Beer releases are always featured automatically (${counts.releases} today), so don't list them; pick up to ${Math.max(0, MAX_FEATURED - counts.releases)} more so the total is at most ${MAX_FEATURED} when there are enough genuinely distinctive items. Never pad the list with ordinary ones just to reach a number. Rank candidates in this order (1 = feature first):
    1. Anniversary parties
    2. Seasonal events (winter markets, Christkindl markets, spring car shows, holiday and harvest events)
    3. Craft events that cost money (paint-and-sip, workshops, centerpiece/wreath making)
    4. Live music and concerts
    5. Cool food events (chili cook-offs, crawfish boils, pig roasts, beer dinners and food pairings)
    6. Yoga and other fitness classes (barre, pilates, bootcamps, HIIT)
    7. Book clubs and run clubs
    8. Trivia and bingo
    9. Sports watch parties (lowest: only feature if there's truly nothing else)
  Everyday happy hours rank near the bottom. Within a tier prefer one-time over weekly, and prefer different breweries.
- exclude: item numbers to leave out. Leave this EMPTY unless there are more than ${MAX_ITEMS} items; then drop the least interesting (usually generic weekly events or duplicate-feeling deals) until ${MAX_ITEMS} remain.
- blurbs: for EVERY event and happy hour that has a description, one short blurb (max ${BLURB_MAX} characters) for the lineup slide. Plain and specific: what you'll actually get or do (e.g. "$5 pints and a shot of Duggans whisky", "Guided canvas painting, supplies included"). Use ONLY facts from that item's description. Don't repeat the title, brewery name or time. No emoji, no hype words, no trailing period.
  Never invent items. Every blurb detail must come from the items above.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 6000,
      tools: [{
        name: "submit_curation",
        description: "Submit the curated carousel picks and blurbs.",
        input_schema: {
          type: "object",
          properties: {
            featured: { type: "array", items: { type: "integer" }, description: "2 to 5 item numbers, best first" },
            exclude: { type: "array", items: { type: "integer" }, description: "Item numbers to leave out (usually empty)" },
            blurbs: {
              type: "array",
              description: "One blurb per event/happy hour that has a description",
              items: {
                type: "object",
                properties: { n: { type: "integer" }, text: { type: "string" } },
                required: ["n", "text"],
              },
            },
          },
          required: ["featured", "exclude", "blurbs"],
        },
      }],
      tool_choice: { type: "tool", name: "submit_curation" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();

  // deno-lint-ignore no-explicit-any
  const call = (data.content ?? []).find((c: any) => c.type === "tool_use" && c.name === "submit_curation");
  if (!call?.input) {
    // deno-lint-ignore no-explicit-any
    const text = (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ");
    throw new Error(
      `LLM didn't return a curation (stop_reason: ${data.stop_reason})` + (text ? `: ${text.slice(0, 200)}` : ""),
    );
  }
  const input = call.input as {
    featured?: unknown; exclude?: unknown; blurbs?: unknown;
  };

  const byNumber = (v: unknown): string[] =>
    (Array.isArray(v) ? v : [])
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= ordered.length)
      .map((n) => ordered[n - 1].key);

  const excluded = new Set(byNumber(input.exclude));
  const keys = ordered.map((i) => i.key).filter((k) => !excluded.has(k)).slice(0, MAX_ITEMS);
  const included = new Set(keys);
  // Beer releases are always featured (they have no list slide), then Haiku's picks.
  const releaseKeys = keys.filter((k) => k.startsWith("release:"));
  const featured = [...new Set([...releaseKeys, ...byNumber(input.featured)])]
    .filter((k) => included.has(k)).slice(0, MAX_FEATURED);


  const llmBlurbs: Record<string, string> = {};
  for (const b of Array.isArray(input.blurbs) ? input.blurbs : []) {
    const n = Number((b as { n?: unknown })?.n);
    const text = String((b as { text?: unknown })?.text ?? "").trim().replace(/[.]$/, "");
    if (!Number.isInteger(n) || n < 1 || n > ordered.length || !text) continue;
    const it = ordered[n - 1];
    if (!wantsBlurb(it)) continue;
    llmBlurbs[it.key] = text.length > BLURB_MAX + 16 ? shortBlurb(text, BLURB_MAX)! : text;
  }

  // The caption is written afterwards (captionWithLlm), once we know the first slides.
  return { ordered_keys: keys, featured_keys: featured, caption: "", blurbs: fallbackBlurbs(ordered, llmBlurbs) };
}

/**
 * Caption for the first slides (the lead items, in slide order). Every lead item is mentioned in
 * a sentence, and each brewery is written as its @handle inside that sentence.
 */
export async function captionWithLlm(lead: DayItem[], all: DayItem[], date: string, city: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-5-5";
  const d = formatDate(date);
  const compact = lead.map((it) => ({
    type: TYPE_LABEL[it.type],
    when: it.time_label,
    title: it.title,
    brewery: it.brewery.split(" × ")[0],
    ...(it.brewery_handle ? { handle: it.brewery_handle } : {}),
    ...(it.collabs?.length ? { collab_with: it.collabs.map((c) => c.handle ? { brewery: c.brewery, handle: c.handle } : { brewery: c.brewery }) } : {}),
    ...(it.meta ? { details: it.meta } : {}),
    ...(it.cost ? { price: formatCost(it.cost) } : {}),
    ...(it.description?.trim() ? { description: it.description.trim().replace(/\s+/g, " ").slice(0, 400) } : {}),
  }));
  const n = (t: string) => all.filter((i) => i.type === t).length;

  const prompt = `You write the Instagram caption for Hoppenings, a brewery events app in ${city}.
Date: ${d.long}. Today overall: ${n("event")} events, ${n("release")} beer releases, ${n("deal")} happy hours/deals.
These are the first ${lead.length} slides of today's carousel, in order:
${JSON.stringify(compact)}

Call submit_caption with the caption as a list of short paragraphs (one array entry per paragraph, no line breaks inside an entry):
1. One hook line that plays on "What's Hoppening?" (the brand name) without overdoing the pun.
2. Then mention EVERY item listed above, in natural sentences, grouped by type (skip a group with no items):
   - Events: "Check out <event> at <brewery>, it's <a specific detail from its description>." then "Also check out <event> at <brewery>, and <event> at <brewery>." If an event has no description, skip the detail rather than inventing one.
   - Beer releases: "<beer> is on tap at <brewery>" (work the style in naturally, e.g. "a new Hazy IPA"; for a collab, name every brewery).
   - Happy hours: "And there's <happy hour> at <brewery>, <why it's worth it, from its description>."
   Write each brewery as its "handle" exactly as given (e.g. "@goatpatchbrewing") the first time you mention it; breweries without a handle use the plain name. Never invent or guess a handle. Every tag must sit inside a sentence: no tag lists, no "featuring" line.
3. "Everything happening today is on Hoppenings, link in bio."
4. 3-5 local hashtags, space-separated, as the last entry.
Friendly local voice, not cheesy, at most 2 emoji. Only mention the items listed above. Never invent items, times, prices or details; every detail must come from the items above.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      tools: [{
        name: "submit_caption",
        description: "Submit the Instagram caption.",
        input_schema: {
          type: "object",
          properties: {
            paragraphs: { type: "array", items: { type: "string" }, description: "One short paragraph per entry, hashtags last" },
          },
          required: ["paragraphs"],
        },
      }],
      tool_choice: { type: "tool", name: "submit_caption" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // deno-lint-ignore no-explicit-any
  const call = (data.content ?? []).find((c: any) => c.type === "tool_use" && c.name === "submit_caption");
  const paras = Array.isArray(call?.input?.paragraphs) ? call.input.paragraphs : [];
  const caption = formatCaption(paras.map((p: unknown) => String(p ?? "")).join("\n\n"));
  if (!caption) throw new Error(`LLM didn't return a caption (stop_reason: ${data.stop_reason})`);
  return caption;
}

/** No-AI caption in the same shape: every lead item in a sentence, breweries as @handles. */
export function captionDeterministic(lead: DayItem[], date: string, city: string, blurbs: Record<string, string>): string {
  const d = formatDate(date);
  const detail = (i: DayItem) => {
    const b = blurbs[i.key];
    return b ? `: ${b.charAt(0).toLowerCase()}${b.slice(1)}` : "";
  };
  const events = lead.filter((i) => i.type === "event");
  const releases = lead.filter((i) => i.type === "release");
  const deals = lead.filter((i) => i.type === "deal");
  const paras: string[] = [`What's Hoppening in ${city} this ${d.weekday}?`];
  if (events.length) {
    const [first, ...rest] = events;
    let p = `Check out ${first.title} at ${breweryRef(first)}${detail(first)}.`;
    if (rest.length) p += ` Also check out ${listJoin(rest.map((i) => `${i.title} at ${breweryRef(i)}`))}.`;
    paras.push(p);
  }
  if (releases.length) {
    paras.push(releases.map((r) => `${r.title}${r.meta ? ` (${r.meta.split(" · ")[0]})` : ""} is on tap at ${breweryRef(r)}`).join(", and ") + ".");
  }
  if (deals.length) {
    const [first, ...rest] = deals;
    let p = `And there's ${first.title} at ${breweryRef(first)}${detail(first)}.`;
    if (rest.length) p += ` Plus ${listJoin(rest.map((i) => `${i.title} at ${breweryRef(i)}`))}.`;
    paras.push(p);
  }
  paras.push("Everything happening today is on Hoppenings, link in bio.");
  const cityTag = city.replace(/[^A-Za-z]/g, "");
  paras.push(`#${cityTag} #${cityTag}Beer #ColoradoBeer #CraftBeer`);
  return paras.join("\n\n");
}

/**
 * Clean up caption spacing: one blank line between paragraphs, single spaces inside them,
 * and any hashtags gathered onto their own last line.
 */
export function formatCaption(text: string): string {
  const tags: string[] = [];
  const paras = text.replace(/\r/g, "").split(/\n\s*\n/).map((p) => {
    let t = p.replace(/\s+/g, " ").trim();
    // pull trailing hashtags (e.g. "...link in bio. #COS #CraftBeer") off the end
    const m = t.match(/(?:^|\s)((?:#[\w]+\s*)+)$/);
    if (m) {
      tags.push(...m[1].trim().split(/\s+/));
      t = t.slice(0, t.length - m[0].length).trim();
    }
    return t;
  }).filter(Boolean);
  const uniq = [...new Set(tags)];
  if (uniq.length) paras.push(uniq.join(" "));
  return paras.join("\n\n");
}

const MAX_TAGS = 20; // Instagram's limit for @mentions in one caption
/**
 * 1. Keep only real brewery handles, each once, at most MAX_TAGS. Anything else that looks like a
 *    tag (made-up handle, repeat) becomes the brewery's plain name (or loses its "@").
 * 2. Then tag any brewery still written by name that has a handle (first mention only).
 */
export function limitTags(caption: string, items: DayItem[], allowed: DayItem[] = items): string {
  return autoTag(filterTags(caption, items, allowed), allowed);
}

/** How many item slides the caption covers (and tags), from the first item slide on. */
export const CAPTION_ITEMS = 5;

/**
 * Final tagging pass. Only the caption's lead items (the first item slides) get tagged, each
 * brewery once, collabs included; any other brewery the caption mentions is written as its plain
 * name. A lead item the caption left out gets a short "Plus <item> at @brewery." sentence before
 * the link-in-bio line, so every tag sits in the narrative (no separate tag list).
 */
export function finalizeTags(caption: string, allItems: DayItem[], lead: DayItem[]): string {
  return limitTags(mentionMissing(caption, lead), allItems, lead);
}

/** [brewery name, @handle] for every brewery in the items, collab breweries included. */
function breweryHandles(items: DayItem[]): [string, string][] {
  const out: [string, string][] = [];
  for (const i of items) {
    if (i.brewery_handle) out.push([i.brewery.split(" × ")[0], i.brewery_handle]);
    for (const c of i.collabs ?? []) if (c.handle) out.push([c.brewery, c.handle]);
  }
  return out;
}

/** "@cerberusbrewing and @redlegbrewing" (handle where there is one, else the name). */
function breweryRef(i: DayItem): string {
  const parts = [i.brewery_handle ?? i.brewery.split(" × ")[0], ...(i.collabs ?? []).map((c) => c.handle ?? c.brewery)];
  return listJoin(parts);
}

/** Add a short sentence for any lead item whose brewery (or title) the caption never mentions. */
function mentionMissing(caption: string, lead: DayItem[]): string {
  const lower = caption.toLowerCase();
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
  const flat = norm(caption);
  const missing = lead.filter((i) => {
    const name = i.brewery.split(" × ")[0];
    const mentioned = (i.brewery_handle && lower.includes(i.brewery_handle.toLowerCase())) ||
      flat.includes(norm(name)) || (!!i.title && flat.includes(norm(i.title)));
    return !mentioned;
  });
  if (!missing.length) return caption;
  const line = `Plus ${listJoin(missing.map((i) => `${i.title} at ${breweryRef(i)}`))}.`;
  const paras = caption.split("\n\n");
  let at = paras.findIndex((p) => /link in bio/i.test(p));
  if (at < 0) at = /^(#\w+\s*)+$/.test((paras[paras.length - 1] ?? "").trim()) ? paras.length - 1 : paras.length;
  paras.splice(at, 0, line);
  return paras.join("\n\n");
}

function escapeRe(t: string): string {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replace the first plain-name mention of each untagged brewery that has a handle. */
function autoTag(caption: string, items: DayItem[]): string {
  const handleByName = new Map<string, string>();
  for (const [name, handle] of breweryHandles(items)) if (!handleByName.has(name)) handleByName.set(name, handle);
  let out = caption;
  let count = (out.match(/@[A-Za-z0-9._]*[A-Za-z0-9_]/g) ?? []).length;
  // longest names first so "Goat Patch Brewing (Northgate)" wins over any shorter name inside it
  for (const [name, handle] of [...handleByName].sort((a, b) => b[0].length - a[0].length)) {
    if (count >= MAX_TAGS) break;
    if (out.toLowerCase().includes(handle.toLowerCase())) continue; // already tagged
    const re = new RegExp(`(^|[^@\\w])${escapeRe(name)}(?![\\w])`, "i");
    if (re.test(out)) {
      out = out.replace(re, (_m, pre: string) => `${pre}${handle}`);
      count++;
    }
  }
  return out;
}

function filterTags(caption: string, items: DayItem[], allowed: DayItem[] = items): string {
  const nameByHandle = new Map<string, string>();
  for (const [name, handle] of breweryHandles(items)) nameByHandle.set(handle.toLowerCase(), name);
  const ok = new Set(breweryHandles(allowed).map(([, handle]) => handle.toLowerCase()));
  const used = new Set<string>();
  return caption.replace(/@([A-Za-z0-9._]+[A-Za-z0-9_])/g, (m, h: string) => {
    const key = `@${h}`.toLowerCase();
    let name = nameByHandle.get(key);
    if (!name) {
      // A guessed handle ("@armillarybrewing") that matches a brewery's name or real handle:
      // swap in the real one (or the plain name if that brewery isn't being tagged).
      const guess = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const [n, real] of breweryHandles(items)) {
        const r = real.toLowerCase().replace(/[^a-z0-9]/g, "");
        const nn = n.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (guess === r || guess === nn || (guess.length >= 6 && (r.startsWith(guess) || nn.startsWith(guess)))) {
          name = n;
          const k = real.toLowerCase();
          if (ok.has(k) && !used.has(k) && used.size < MAX_TAGS) {
            used.add(k);
            return real;
          }
          return n;
        }
      }
      // A brewery with no handle on file: use its plain name.
      for (const i of items) {
        const nn = i.brewery.split(" × ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        if (guess === nn || (guess.length >= 6 && nn.startsWith(guess))) return i.brewery.split(" × ")[0];
      }
      return h; // not a known brewery at all: drop the "@"
    }

    // not on the slides, already tagged, or over Instagram's limit: plain name
    if (!ok.has(key) || used.has(key) || used.size >= MAX_TAGS) return name;
    used.add(key);
    return `@${h}`;
  });
}

/** "A", "A and B", "A, B, and C" */
function listJoin(parts: string[]): string {
  if (parts.length <= 2) return parts.join(" and ");
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

/** No-LLM fallback: everything in display order; releases / one-time / ticketed events featured. */
export function curateDeterministic(items: DayItem[], date: string, city: string): Curation {
  const ordered = orderItems(items).slice(0, MAX_ITEMS);
  const score = rankScore;
  // "Distinctive" = clearly worth a full slide: tiers 1-5 (anniversaries through food events).
  const ranked = [...ordered].sort((a, b) => score(b) - score(a));
  const distinctive = ranked.filter((i) => tier(i) <= 5);
  const target = Math.min(MAX_FEATURED, Math.max(2, distinctive.length));
  // Beer releases are always featured (they have no list slide).
  const featured: DayItem[] = ordered.filter((i) => i.type === "release").slice(0, MAX_FEATURED);
  for (const it of ranked) {
    if (featured.length >= target) break;
    if (featured.includes(it)) continue;
    if (featured.some((f) => f.brewery_id === it.brewery_id)) continue;
    featured.push(it);
  }
  for (const it of ranked) { // fill if the one-per-brewery rule left a gap
    if (featured.length >= target) break;
    if (!featured.includes(it)) featured.push(it);
  }

  const d = formatDate(date);
  const blurbs = fallbackBlurbs(ordered);
  const detail = (i: DayItem) => {
    const b = blurbs[i.key];
    // Without AI we can't guarantee "it's ..." reads naturally, so use a colon.
    return b ? `: ${b.charAt(0).toLowerCase()}${b.slice(1)}` : "";
  };
  const events = ordered.filter((i) => i.type === "event");
  const leadEvents = [
    ...featured.filter((i) => i.type === "event"),
    ...[...events].sort((a, b) => score(b) - score(a)).filter((i) => !featured.includes(i)),
  ].slice(0, 4);
  const releases = ordered.filter((i) => i.type === "release").slice(0, 2);
  const deals = ordered.filter((i) => i.type === "deal");
  const deal = deals.find((i) => blurbs[i.key]) ?? deals[0];

  // Tag the breweries behind releases and the top featured items (2-3), plain names elsewhere.
  const tagged = new Set<string>();
  const tagOrder = [...ordered.filter((i) => i.type === "release"), ...featured].filter((i) => i.brewery_handle);
  for (const i of tagOrder) { if (tagged.size >= MAX_TAGS) break; tagged.add(i.brewery_handle!); }
  const usedTags = new Set<string>();
  const at = (i: DayItem) => {
    if (i.brewery_handle && tagged.has(i.brewery_handle) && !usedTags.has(i.brewery_handle)) {
      usedTags.add(i.brewery_handle);
      return i.brewery_handle;
    }
    return i.brewery;
  };
  const paras: string[] = [`What's Hoppening in ${city} this ${d.weekday}?`];
  if (leadEvents.length) {
    const [first, ...rest] = leadEvents;
    let p = `Check out ${first.title} at ${at(first)}${detail(first)}.`;
    if (rest.length) p += ` Also check out ${listJoin(rest.map((i) => `${i.title} at ${at(i)}`))}.`;
    paras.push(p);
  }
  if (releases.length) {
    paras.push(releases.map((r) => `${r.title}${r.meta ? ` (${r.meta.split(" · ")[0]})` : ""} is on tap at ${at(r)}`).join(", and ") + ".");
  }
  if (deal) paras.push(`And there's ${deal.title} at ${at(deal)}${detail(deal)}.`);
  paras.push("Everything happening today is on Hoppenings, link in bio.");
  const cityTag = city.replace(/[^A-Za-z]/g, "");
  paras.push(`#${cityTag} #${cityTag}Beer #ColoradoBeer #CraftBeer`);

  return {
    ordered_keys: ordered.map((i) => i.key),
    featured_keys: featured.map((i) => i.key),
    blurbs,
    caption: paras.join("\n\n"), // tags are applied in build-draft (finalizeTags)
  };
}

