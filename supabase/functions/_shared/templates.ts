import type { CoverPreview, SlideItem, SlideSpec } from "./slides.ts";
import type { PromoAssets } from "./promoAssets.ts";

// Slide templates. LAYOUT lives here (version-controlled); COLORS/FONTS/LOGO come from brand_profiles.
// Satori accepts plain { type, props } element objects, so no JSX build step is needed.
// Satori rules: every <div> with more than one child must set display: "flex"; flexbox only.

export const WIDTH = 1080;
export const HEIGHT = 1350; // 4:5 portrait

// Font family names registered in render-slide.
export const DISPLAY = "Display"; // Fjalla One 400, uppercase
export const BODY = "Body";       // Be Vietnam Pro 400/600/700

export interface BrandColors {
  primary: string;        // #5D2525
  primary_dark: string;   // #3A1515
  accent: string;         // #F8C701
  cream: string;          // #F9F7F2
  charcoal: string;       // #1A1A1A
  text_primary: string;   // #2D2926
  text_secondary: string; // #665E5A
  border: string;         // #E5DFD6
  tan: string;            // #E5DFD6 card background (cover hero card)
}

export const DEFAULT_COLORS: BrandColors = {
  primary: "#5D2525",
  primary_dark: "#3A1515",
  accent: "#F8C701",
  cream: "#F9F7F2",
  charcoal: "#1A1A1A",
  text_primary: "#2D2926",
  text_secondary: "#665E5A",
  border: "#E5DFD6",
  tan: "#E5DFD6",
};

export interface Brand {
  name: string;
  colors: BrandColors;
  logo_url: string | null;       // used on dark slides
  logo_light_url: string | null; // used on the cream end slide (falls back to wordmark)
  handle: string;
  cta_text: string;
  /** End-slide app mockup as a data: URI (render-slide fetches brand_profiles.app_image_url). */
  appImageData?: string | null;
  /** Tap Tracker promo images (mugs, arrow, brewery logos). */
  promoAssets?: PromoAssets | null;
}

/** Merge whatever is stored in brand_profiles.colors over the defaults. */
// deno-lint-ignore no-explicit-any
export function resolveColors(stored: Record<string, any> | null | undefined): BrandColors {
  return { ...DEFAULT_COLORS, ...(stored ?? {}) } as BrandColors;
}

// deno-lint-ignore no-explicit-any
export type El = { type: string; props: Record<string, any> };
type Child = El | string | null | false | undefined;

// deno-lint-ignore no-explicit-any
function h(type: string, style: Record<string, any> | null, ...children: Child[]): El {
  const kids = children.filter((c) => c !== null && c !== false && c !== undefined) as (El | string)[];
  return {
    type,
    props: {
      style: { display: "flex", ...(style ?? {}) },
      children: kids.length === 0 ? undefined : kids.length === 1 ? kids[0] : kids,
    },
  };
}
function img(src: string, height: number, extra: Record<string, unknown> = {}): El {
  return { type: "img", props: { src, height, style: { height, objectFit: "contain", ...extra } } };
}

// ---------------------------------------------------------------------------
// Reel animation tags. The JPEG render ignores them (stripAnim runs before Satori); the admin's
// Remotion adapter reads them to animate each tagged element INTO its static position.
//   kind:   fade | rise (up + fade) | slide (sideways) | pop (scale) | wipe (scaleX from left)
//           | words (word-by-word blur-in, for text nodes) | zoom (slow settle on photos)
//   order:  choreography step; the adapter starts it at order * ORDER_FRAMES (6) frames
//   offset: extra frames on top of that (for staggered rows)
// ---------------------------------------------------------------------------
export type AnimKind = "fade" | "rise" | "slide" | "pop" | "wipe" | "words" | "zoom";
export interface Anim { kind: AnimKind; order: number; offset?: number; dir?: "left" | "right" }
function anim<T extends El | null>(el: T, a: Anim): T {
  if (el) el.props.anim = a;
  return el;
}
/** Copy of an element tree without reel animation tags (Satori gets this). */
export function stripAnim(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripAnim);
  if (!node || typeof node !== "object") return node;
  const { anim: _a, children, ...props } = (node as El).props ?? {};
  return { ...(node as El), props: { ...props, ...(children === undefined ? {} : { children: stripAnim(children) }) } };
}

/** "#F9F7F2" + 0.78 -> "rgba(249, 247, 242, 0.78)" */
function alpha(hex: string, a: number): string {
  const m = hex.replace("#", "");
  const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Cut long scraped text at a word boundary. */
function truncate(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:–-]+$/, "") + "…";
}

const PAD = 88;

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

// Solid brand backgrounds on purpose: gradients cost ~400ms of CPU per slide in resvg,
// which pushed slides over the Edge Function CPU limit (HTTP 546).
function darkFrame(b: Brand, variant: "deep" | "maroon", ...children: Child[]): El {
  const c = b.colors;
  return h("div", {
    width: WIDTH, height: HEIGHT, flexDirection: "column", padding: PAD,
    backgroundColor: variant === "deep" ? c.primary_dark : c.primary,
    color: "#FFFFFF", fontFamily: BODY,
  }, ...children);
}

function eyebrow(b: Brand, text: string, color?: string): El {
  return h("div", {
    fontFamily: BODY, fontWeight: 600, fontSize: 28, letterSpacing: "0.28em",
    textTransform: "uppercase", color: color ?? b.colors.accent,
  }, text);
}

function goldRule(b: Brand, width = 96): El {
  return h("div", { width, height: 8, backgroundColor: b.colors.accent });
}

function wordmark(b: Brand, color: string, size = 44, logo: string | null = b.logo_url): El {
  return logo
    ? img(logo, size + 12)
    : h("div", {
      fontFamily: DISPLAY, fontSize: size, letterSpacing: "0.04em", textTransform: "uppercase", color,
    }, b.name);
}


function priceBlock(b: Brand, price: string, size = 30): El {
  return h("div", {
    flexShrink: 0, alignItems: "center", fontFamily: DISPLAY, fontSize: size, letterSpacing: "0.08em",
    color: b.colors.primary_dark, backgroundColor: b.colors.accent, padding: "8px 18px", borderRadius: 6,
  }, price);
}

// ---------------------------------------------------------------------------
// Slides
// ---------------------------------------------------------------------------

// Cover: the original deep-maroon intro (date, headline, city, gold swipe button) with two
// columns below it: a hero photo card for the coolest item, and a short "Also today" list.
// Solid colors only (gradients are too CPU-heavy in resvg).
const COL_GAP = 40;
const HERO_W = Math.floor((WIDTH - PAD * 2 - COL_GAP) / 2); // equal columns: 432 each
const LIST_W = HERO_W;
const HERO_PHOTO_H = 280;

function cover(b: Brand, s: Extract<SlideSpec, { kind: "cover" }>): El {
  const [hero, ...list] = s.previews ?? [];
  const big = !hero; // nothing to preview: keep the original big headline
  const c = b.colors;
  // Pin the swipe CTA to the bottom — Satori/flexGrow left a dead band under the button in JPEGs.
  const ctaH = 84;

  return h("div", {
    width: WIDTH, height: HEIGHT, flexDirection: "column",
    backgroundColor: c.primary_dark, color: "#FFFFFF", fontFamily: BODY,
    padding: `${PAD}px ${PAD}px ${PAD + ctaH + 16}px ${PAD}px`,
    position: "relative",
  },
    anim(h("div", {
      flexShrink: 0, fontFamily: BODY, fontWeight: 700, fontSize: 46, letterSpacing: "0.2em",
      textTransform: "uppercase", color: c.accent,
    }, s.dateEyebrow), { kind: "fade", order: 0 }),
    h("div", { flexDirection: "column", justifyContent: "center", flexShrink: 0, marginTop: big ? 0 : 28 },
      anim(goldRule(b, 120), { kind: "wipe", order: 1 }),
      h("div", {
        flexDirection: "column", marginTop: big ? 40 : 20, fontFamily: DISPLAY, fontSize: big ? 172 : 96,
        lineHeight: 0.95, letterSpacing: "0.02em", textTransform: "uppercase", color: "#FFFFFF",
      },
        anim(h("div", null, "What's"), { kind: "words", order: 2 }),
        anim(h("div", null, "Hoppening?"), { kind: "words", order: 3 }),
      ),
      anim(h("div", {
        marginTop: big ? 28 : 12, fontFamily: DISPLAY, fontSize: big ? 76 : 48, lineHeight: 1, letterSpacing: "0.04em",
        textTransform: "uppercase", color: c.accent,
      }, `In ${s.city}`), { kind: "words", order: 4 }),
    ),
    hero
      ? h("div", {
        flexGrow: 1, flexShrink: 1, minHeight: 0, overflow: "hidden", marginTop: 28,
      },
        h("div", { justifyContent: "space-between", alignItems: "flex-start", width: WIDTH - PAD * 2 },
          anim(heroCard(b, hero), { kind: "rise", order: 5 }),
          list.length ? alsoToday(b, list) : null,
        ))
      : null,
    h("div", {
      position: "absolute", left: PAD, right: PAD, bottom: PAD,
      alignItems: "center", justifyContent: "center", height: ctaH,
    },
      anim(h("div", {
        fontFamily: DISPLAY, fontSize: 34, letterSpacing: "0.16em", textTransform: "uppercase",
        color: c.primary_dark, backgroundColor: c.accent, padding: "22px 36px",
      }, "Swipe for today's lineup"), { kind: "pop", order: 9 }),
    ),
  );
}

/** Rough word wrap for uppercase Fjalla (~0.46em per character, a little generous). */
function wrapCount(text: string, size: number, width: number): { lines: number; longestWord: number } {
  const perLine = Math.max(1, Math.floor(width / (size * 0.46)));
  let lines = 1, used = 0, longestWord = 0;
  for (const word of text.trim().split(/\s+/)) {
    longestWord = Math.max(longestWord, word.length);
    const need = used === 0 ? word.length : used + 1 + word.length;
    if (need <= perLine) used = need;
    else { lines++; used = word.length; }
  }
  return { lines, longestWord: longestWord / perLine };
}

/** Biggest size from `options` ([size, maxLines], largest first) that fits without cutting words. */
function fitText(text: string, width: number, options: [number, number][]): { size: number; text: string; lines: number } {
  const t = text.trim().replace(/\s+/g, " ");
  for (const [size, maxLines] of options) {
    const w = wrapCount(t, size, width);
    if (w.lines <= maxLines && w.longestWord <= 1) return { size, text: t, lines: w.lines };
  }
  const [size, maxLines] = options[options.length - 1];
  return { size, text: truncate(t, Math.floor(width / (size * 0.46)) * maxLines), lines: maxLines };
}

/** Left column: the coolest item, with its brewery photo. */
function heroCard(b: Brand, pv: CoverPreview): El {
  const c = b.colors;
  const inner = HERO_W - 52;
  const fit = fitText(pv.title, inner, [[46, 2], [40, 2], [36, 3]]);
  // tan card, brown text
  const sub = { fontWeight: 600, fontSize: 22, color: c.primary, whiteSpace: "nowrap", overflow: "hidden" };
  const subChars = Math.floor(inner / 12);
  // description: as many lines as the title leaves room for, cut at a word with "…"
  const descSize = 22, descLH = 1.4;
  const descLines = fit.lines >= 3 ? 3 : pv.type === "release" ? 5 : 4;
  const desc = pv.description?.trim()
    ? truncate(pv.description, Math.max(20, descLines * Math.floor(inner / (descSize * 0.5)) - 4))
    : null;
  return h("div", {
    width: HERO_W, flexDirection: "column", flexShrink: 0, backgroundColor: c.tan, borderRadius: 18, overflow: "hidden",
  },
    pv.imageData
      ? anim({
        type: "img",
        props: {
          src: pv.imageData, width: HERO_W, height: HERO_PHOTO_H,
          style: { width: HERO_W, height: HERO_PHOTO_H, objectFit: "cover", borderTopLeftRadius: 18, borderTopRightRadius: 18 },
        },
      }, { kind: "zoom", order: 5 })
      : h("div", {
        width: HERO_W, height: HERO_PHOTO_H, alignItems: "center", justifyContent: "center", padding: 24,
        backgroundColor: c.primary, fontFamily: DISPLAY, fontSize: 72, lineHeight: 1, textTransform: "uppercase",
        color: c.accent, textAlign: "center",
      }, pv.type === "release" ? "New beer" : pv.time),
    h("div", { flexDirection: "column", padding: "20px 26px 24px 26px" },
      h("div", {
        fontWeight: 700, fontSize: 20, letterSpacing: "0.16em", textTransform: "uppercase", color: c.primary,
      }, pv.type === "release" ? "New beer release" : pv.label),
      h("div", {
        marginTop: 10, fontFamily: DISPLAY, fontSize: fit.size, lineHeight: 1.02, letterSpacing: "0.01em",
        textTransform: "uppercase", color: c.primary_dark,
      }, fit.text),
      h("div", { ...sub, marginTop: 10 },
        truncate(pv.type === "release" ? pv.brewery : `${pv.time} · ${pv.brewery}`, subChars)),
      desc
        ? h("div", {
          marginTop: 12, fontSize: descSize, lineHeight: descLH, color: c.primary_dark,
          maxHeight: Math.ceil(descSize * descLH * descLines) + 2, overflow: "hidden",
        }, desc)
        : null,
    ),
  );
}

/** Right column: a short text list of other items in the post. */
function alsoToday(b: Brand, list: CoverPreview[]): El {
  const c = b.colors;
  return h("div", { width: LIST_W, flexDirection: "column", flexShrink: 0 },
    anim(h("div", {
      fontWeight: 700, fontSize: 22, letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent,
    }, "Also today"), { kind: "fade", order: 6 }),
    anim(h("div", { marginTop: 12, width: 72, height: 5, backgroundColor: c.accent }), { kind: "wipe", order: 6 }),
    h("div", { flexDirection: "column", marginTop: 8 },
      ...list.map((pv, i) => {
        const fit = fitText(pv.title, LIST_W, [[32, 1], [32, 2], [28, 2]]);
        const top = pv.type === "release" ? "New beer" : `${pv.label} · ${pv.time}`;
        return anim(h("div", {
          flexDirection: "column", padding: "15px 0",
          borderBottom: i === list.length - 1 ? "none" : `2px solid ${alpha(c.cream, 0.1)}`,
        },
          h("div", {
            fontWeight: 700, fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase", color: c.accent,
            whiteSpace: "nowrap", overflow: "hidden",
          }, truncate(top, Math.floor(LIST_W / 13))),
          h("div", {
            marginTop: 6, fontFamily: DISPLAY, fontSize: fit.size, lineHeight: 1.02, letterSpacing: "0.01em",
            textTransform: "uppercase", color: "#FFFFFF",
          }, fit.text),
          h("div", {
            marginTop: 6, fontWeight: 600, fontSize: 21, color: alpha(c.cream, 0.65), whiteSpace: "nowrap", overflow: "hidden",
          }, truncate(pv.brewery, Math.floor(LIST_W / 11.5))),
        ), { kind: "rise", order: 6, offset: 4 + i * 5 });
      }),
    ),
  );
}

function featured(b: Brand, s: Extract<SlideSpec, { kind: "featured" }>): El {
  return s.item.imageData ? featuredWithPhoto(b, s, s.item.imageData) : featuredPlain(b, s);
}

function featuredHeader(b: Brand, s: Extract<SlideSpec, { kind: "featured" }>): El {
  return anim(h("div", { justifyContent: "space-between", alignItems: "center" },
    eyebrow(b, s.of > 1 ? `${s.label ?? "Featured"} · ${s.n} of ${s.of}` : (s.label ?? "Featured")),
    h("div", {
      fontWeight: 600, fontSize: 26, letterSpacing: "0.14em", color: alpha(b.colors.cream, 0.78),
    }, s.dateEyebrow),
  ), { kind: "fade", order: 0 });
}

function featuredBrewery(b: Brand, name: string): El {
  // flexShrink: 0 on every child — browser flex can otherwise squash this row under the title
  // (Satori is more forgiving), which showed up as a thin gold dash with clipped brewery text.
  return h("div", {
    alignItems: "center", flexShrink: 0, width: "100%", fontWeight: 700, fontSize: 38,
    letterSpacing: "0.06em", textTransform: "uppercase", color: alpha(b.colors.cream, 0.78),
  },
    h("div", { width: 40, height: 4, flexShrink: 0, backgroundColor: b.colors.accent, marginRight: 20 }),
    h("div", { flexShrink: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden" }, name),
  );
}

/** Release style/ABV under the brewery on featured slides. */
function featuredMeta(b: Brand, meta: string | null | undefined, size = 32): El | null {
  if (!meta) return null;
  return anim(h("div", {
    flexShrink: 0, marginTop: 14, fontWeight: 600, fontSize: size, letterSpacing: "0.06em",
    textTransform: "uppercase", color: b.colors.accent,
  }, meta), { kind: "fade", order: 3, offset: 4 });
}

function featuredPlain(b: Brand, s: Extract<SlideSpec, { kind: "featured" }>): El {
  const it = s.item;
  const cream65 = alpha(b.colors.cream, 0.65);
  return darkFrame(b, "maroon",
    featuredHeader(b, s),
    h("div", { flexDirection: "column", justifyContent: "center", flexGrow: 1 },
      h("div", { alignItems: "center" },
        anim(h("div", {
          fontFamily: DISPLAY, fontSize: 84, letterSpacing: "0.04em", textTransform: "uppercase",
          color: b.colors.accent,
        }, it.time), { kind: "slide", order: 1, dir: "left" }),
        it.price ? anim(h("div", { marginLeft: 28 }, priceBlock(b, it.price, 40)), { kind: "pop", order: 2 }) : null,
      ),
      anim(h("div", {
        marginTop: 24, fontFamily: DISPLAY, fontSize: 132, lineHeight: 0.98, letterSpacing: "0.02em",
        textTransform: "uppercase", color: "#FFFFFF", maxHeight: 132 * 0.98 * 3 + 8, overflow: "hidden",
      }, truncate(it.title, 42)), { kind: "words", order: 2 }),
      anim(h("div", { marginTop: 36 }, featuredBrewery(b, it.brewery)), { kind: "rise", order: 3 }),
      featuredMeta(b, it.meta, 34),
      it.description
        ? anim(h("div", {
          marginTop: 36, fontSize: plainDescSize(it.description), lineHeight: 1.45, color: cream65,
        }, cleanText(it.description)), { kind: "fade", order: 4 })
        : null,
    ),
  );
}

// Featured descriptions are never truncated; the type scales down as they get longer.
function cleanText(t: string): string {
  return t.trim().replace(/\s+/g, " ");
}
function plainDescSize(t: string): number {
  const n = cleanText(t).length;
  return n <= 170 ? 36 : n <= 280 ? 32 : n <= 400 ? 28 : n <= 550 ? 25 : 22;
}


// Photo banner across the top, fading into solid maroon; text sits below/over the fade.
// Solid colors only (gradients are too CPU-heavy in resvg).
// Every photo is the same height; the description is cut (with "…") to fit what's left below it.
const PHOTO_H = 760;
const CONTENT_W = WIDTH - PAD * 2;
/** Rough line count for text of a given size/width (Fjalla is condensed: ~0.42em per char). */
function estLines(text: string, fontSize: number, emPerChar: number, width: number): number {
  return Math.max(1, Math.ceil((text.length * fontSize * emPerChar) / width));
}
function featuredWithPhoto(b: Brand, s: Extract<SlideSpec, { kind: "featured" }>, src: string): El {
  const c = b.colors;
  const it = s.item;
  const title = truncate(it.title, 60);
  const titleSize = title.length <= 16 ? 100 : title.length <= 28 ? 88 : 76;
  const titleLines = Math.min(3, estLines(title, titleSize, 0.42, CONTENT_W));

  // vertical budget below the photo — fill it with type rather than leaving a dead band
  const top = 36, bottom = 48;
  const used = 64 /* time row */ + 10 + titleLines * titleSize * 0.98 + 18 + 38 /* brewery */ +
    (it.meta ? 10 + 32 : 0) + 14;
  const descSize = 30, lineH = descSize * 1.38;
  const descLines = Math.max(0, Math.floor((HEIGHT - PHOTO_H - top - bottom - used) / lineH));
  const charsPerLine = Math.floor(CONTENT_W / (descSize * 0.5));
  const descFull = it.description ? cleanText(it.description) : "";
  const desc = descLines > 0 && descFull ? truncate(descFull, Math.max(20, descLines * charsPerLine - 4)) : "";

  return h("div", {
    width: WIDTH, height: HEIGHT, flexDirection: "column",
    backgroundColor: c.primary_dark, color: "#FFFFFF", fontFamily: BODY,
  },
    // minHeight locks the banner in the browser (flexShrink alone isn't enough when a parent
    // has overflow:hidden — Remotion's layout was collapsing the photo and clipping the time row).
    h("div", { width: WIDTH, height: PHOTO_H, minHeight: PHOTO_H, flexShrink: 0 },
      anim({ type: "img", props: { src, width: WIDTH, height: PHOTO_H, style: { width: WIDTH, height: PHOTO_H, objectFit: "cover" } } },
        { kind: "zoom", order: 0 }),
    ),
    h("div", {
      flexDirection: "column", justifyContent: "flex-start", flexGrow: 1, flexShrink: 1,
      minHeight: 0, overflow: "hidden",
      padding: `${top}px ${PAD}px ${bottom}px ${PAD}px`,
    },
      h("div", { alignItems: "center", flexShrink: 0, width: "100%", minHeight: 68 },
        anim(h("div", {
          flexShrink: 0, fontFamily: DISPLAY, fontSize: 68, letterSpacing: "0.04em",
          textTransform: "uppercase", color: c.accent,
        }, it.time), { kind: "slide", order: 1, dir: "left" }),
        it.price ? anim(h("div", { marginLeft: 26, flexShrink: 0 }, priceBlock(b, it.price, 36)), { kind: "pop", order: 2 }) : null,
      ),
      anim(h("div", {
        flexShrink: 0, marginTop: 12, fontFamily: DISPLAY, fontSize: titleSize, lineHeight: 0.98,
        letterSpacing: "0.02em", textTransform: "uppercase", color: "#FFFFFF",
        maxHeight: titleSize * 0.98 * 3 + 8, overflow: "hidden", width: "100%",
      }, title), { kind: "words", order: 2 }),
      anim(h("div", { flexShrink: 0, marginTop: 22, width: "100%" }, featuredBrewery(b, it.brewery)), { kind: "rise", order: 3 }),
      featuredMeta(b, it.meta, 28),
      desc
        ? anim(h("div", {
          flexShrink: 0, marginTop: 18, fontSize: descSize, lineHeight: 1.4, color: alpha(c.cream, 0.7),
          maxHeight: descLines * lineH + 2, overflow: "hidden", width: "100%",
        }, desc), { kind: "fade", order: 4 })
        : null,
    ),
  );
}

/** Width of the time column: just wide enough for the longest time on this slide. */
function timeColWidth(items: SlideItem[]): number {
  const longest = Math.max(...items.map((i) => (i.type === "release" ? "New" : i.time).length), 4);
  return Math.min(250, Math.max(130, Math.round(longest * 19 + 28)));
}

function lineupRow(b: Brand, it: SlideItem, timeW: number, isLast: boolean): El {
  const left = it.type === "release" ? "New" : it.time;
  const sub = it.type === "release" && it.meta ? `${it.brewery} · ${it.meta}` : it.brewery;
  return h("div", {
    alignItems: "flex-start", flexShrink: 0, padding: "22px 0",
    borderBottom: isLast ? "none" : "2px solid rgba(255,255,255,0.10)",
  },
    h("div", {
      width: timeW, flexShrink: 0, paddingTop: 5, paddingRight: 18, fontWeight: 700, fontSize: 26,
      letterSpacing: "0.06em", textTransform: "uppercase", color: b.colors.accent,
    }, left),
    h("div", { flexDirection: "column", flexGrow: 1, flexShrink: 1, minWidth: 0 },
      h("div", {
        fontFamily: DISPLAY, fontSize: 48, lineHeight: 1.0, letterSpacing: "0.02em",
        textTransform: "uppercase", color: "#FFFFFF", maxHeight: 98, overflow: "hidden",
      }, truncate(it.title, 50)),
      h("div", { marginTop: 8, fontSize: 28, color: alpha(b.colors.cream, 0.65) }, sub),
      it.blurb
        ? h("div", {
          marginTop: 6, fontSize: 26, lineHeight: 1.3, color: alpha(b.colors.cream, 0.5),
          maxHeight: 26 * 1.3 * 2 + 2, overflow: "hidden", // up to 2 lines
        }, it.blurb)
        : null,
    ),
    it.price ? h("div", { marginLeft: 20 }, priceBlock(b, it.price)) : null,
  );
}

function list(b: Brand, s: Extract<SlideSpec, { kind: "list" }>): El {
  const timeW = timeColWidth(s.items);
  return darkFrame(b, "deep",
    // header is locked (flexShrink 0) so long rows can never push it up
    h("div", { flexShrink: 0 }, eyebrow(b, s.dateEyebrow)),
    h("div", {
      flexShrink: 0, marginTop: 20, fontFamily: DISPLAY, fontSize: 112, lineHeight: 1, letterSpacing: "0.03em",
      textTransform: "uppercase", color: "#FFFFFF",
    }, s.heading),
    h("div", { flexShrink: 0, marginTop: 18 }, goldRule(b)),
    h("div", { flexDirection: "column", flexShrink: 1, minHeight: 0, overflow: "hidden", marginTop: 12 },
      ...s.items.map((it, i) => lineupRow(b, it, timeW, i === s.items.length - 1)),
    ),
    s.moreCount > 0
      ? h("div", {
        flexShrink: 0, marginTop: 22, fontWeight: 600, fontSize: 28, letterSpacing: "0.14em", textTransform: "uppercase",
        color: b.colors.accent,
      }, `+${s.moreCount} more on Hoppenings`)
      : null,
  );
}

function end(b: Brand, s: Extract<SlideSpec, { kind: "end" }>): El {
  return b.appImageData ? endWithPhone(b, s, b.appImageData) : endPlain(b, s);
}

function endPlain(b: Brand, s: Extract<SlideSpec, { kind: "end" }>): El {
  const c = b.colors;
  return h("div", {
    width: WIDTH, height: HEIGHT, flexDirection: "column", padding: PAD,
    backgroundColor: c.cream, color: c.text_primary, fontFamily: BODY,
  },
    anim(eyebrow(b, `${s.city} breweries`, c.primary), { kind: "fade", order: 0 }),
    h("div", { flexDirection: "column", justifyContent: "center", flexGrow: 1 },
      anim(goldRule(b, 120), { kind: "wipe", order: 1 }),
      h("div", {
        flexDirection: "column", marginTop: 40, fontFamily: DISPLAY, fontSize: 128, lineHeight: 0.95,
        letterSpacing: "0.02em", textTransform: "uppercase", color: c.primary,
      },
        anim(h("div", null, "Every event."), { kind: "words", order: 2 }),
        anim(h("div", null, "Every brewery."), { kind: "words", order: 3 }),
        anim(h("div", null, "Every day."), { kind: "words", order: 4 }),
      ),
      anim(h("div", { marginTop: 44, fontSize: 38, lineHeight: 1.45, color: c.text_primary, maxWidth: 860 },
        `Events, beer releases, deals and food trucks across ${s.city}, all in one app.`), { kind: "fade", order: 5 }),
      h("div", { marginTop: 56 },
        anim(h("div", {
          fontFamily: DISPLAY, fontSize: 40, letterSpacing: "0.16em", textTransform: "uppercase",
          color: c.primary_dark, backgroundColor: c.accent, padding: "24px 36px",
        }, s.cta), { kind: "pop", order: 6 }),
      ),
    ),
  );
}

// Flyer-style end slide: big wordmark + tagline on top, "Why Hoppenings?" list on the left,
// app mockup on the right, gold CTA at the bottom. Maroon background like the printed flyer.
const PHONE_W = 400;
const WHY = [
  ["Find", "breweries near you"],
  ["Discover", "events"],
  ["Find", "new beer releases"],
  ["Join", "brewery leaderboards"],
] as const;
function endWithPhone(b: Brand, s: Extract<SlideSpec, { kind: "end" }>, src: string): El {
  const c = b.colors;
  const phoneH = Math.round(PHONE_W * (1100 / 634)); // mockup aspect ratio
  const gold = c.accent;
  const word = (t: string, color: string) => h("div", { color, marginRight: 12 }, t);
  return h("div", {
    width: WIDTH, height: HEIGHT, flexDirection: "column", alignItems: "center",
    padding: "96px 80px 88px 80px", backgroundColor: c.primary, color: "#FFFFFF", fontFamily: BODY,
  },
    // wordmark + tagline
    anim(h("div", {
      fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, letterSpacing: "0.05em",
      textTransform: "uppercase", color: gold,
    }, b.name), { kind: "words", order: 0 }),
    anim(h("div", { marginTop: 22, fontWeight: 700, fontSize: 36, letterSpacing: "0.04em", flexWrap: "wrap", justifyContent: "center" },
      word("The", "#FFFFFF"), word("Brewery Scene", gold), word("in Your", "#FFFFFF"),
      h("div", { color: gold }, "Pocket"),
    ), { kind: "fade", order: 1 }),
    // why list + phone
    h("div", { width: "100%", flexGrow: 1, alignItems: "center", justifyContent: "space-between", marginTop: 24 },
      h("div", { flexDirection: "column", width: 480 },
        anim(h("div", { fontFamily: DISPLAY, fontSize: 64, lineHeight: 1, letterSpacing: "0.02em", color: gold }, "Why Hoppenings?"),
          { kind: "words", order: 2 }),
        anim(h("div", { marginTop: 22, marginBottom: 10 }, goldRule(b, 96)), { kind: "wipe", order: 2 }),
        ...WHY.map(([lead, rest], i) => anim(h("div", { alignItems: "center", marginTop: 26, fontSize: 32, fontWeight: 600 },
          h("div", { width: 14, height: 14, backgroundColor: gold, marginRight: 22, flexShrink: 0 }),
          h("div", { color: gold, marginRight: 10 }, lead),
          h("div", { color: "#FFFFFF" }, rest),
        ), { kind: "rise", order: 3, offset: i * 5 })),
      ),
      anim({ type: "img", props: { src, width: PHONE_W, height: phoneH, style: { width: PHONE_W, height: phoneH, marginRight: -10 } } },
        { kind: "slide", order: 3, dir: "right" }),
    ),
    // CTA
    h("div", { flexDirection: "column", alignItems: "center" },
      anim(h("div", {
        fontFamily: DISPLAY, fontSize: 38, letterSpacing: "0.16em", textTransform: "uppercase",
        color: c.primary_dark, backgroundColor: gold, padding: "22px 40px",
      }, s.cta), { kind: "pop", order: 6 }),
      anim(h("div", { marginTop: 18, fontSize: 26, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: alpha(c.cream, 0.78) },
        "Free on iPhone and Android"), { kind: "fade", order: 7 }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Promo slides (animated) — Tap Tracker uses public/assets/tap-tracker images.
// ---------------------------------------------------------------------------

/** CSS fallback mug when promo assets haven't loaded yet. */
function glassIcon(filled: boolean, accent: string, cream: string): El {
  const stroke = filled ? accent : alpha(cream, 0.35);
  const fill = filled ? accent : "transparent";
  return h("div", {
    width: 64, height: 96, flexDirection: "column", alignItems: "center", justifyContent: "flex-end", flexShrink: 0,
  },
    h("div", {
      width: 44, height: 58, borderRadius: 16,
      border: `3px solid ${stroke}`, backgroundColor: fill, marginBottom: 4,
    }),
    h("div", { width: 8, height: 12, backgroundColor: stroke }),
    h("div", { width: 26, height: 4, backgroundColor: stroke, borderRadius: 2 }),
  );
}

function mugAsset(src: string | null | undefined, filled: boolean, accent: string, cream: string, size = 88): El {
  if (src) {
    return {
      type: "img",
      props: {
        src, width: size, height: size,
        style: { width: size, height: size, objectFit: "contain", flexShrink: 0 },
      },
    };
  }
  return glassIcon(filled, accent, cream);
}

function promoTapTracker(b: Brand, _s: Extract<SlideSpec, { kind: "promo" }>): El {
  const c = b.colors;
  const a = b.promoAssets;
  const steps = [
    ["01", "Start with $1 off", "Redeem the $1-off perk at a participating brewery to start your Tap Tracker."],
    ["02", "Log your return visits", "Open Hoppenings each time you're back at the brewery."],
    ["03", "Unlock a free beer", "On your 4th visit, your free beer unlocks."],
  ] as const;
  const glassLabels = ["$1 OFF", "VISIT 2", "VISIT 3", "FREE BEER"] as const;
  const mugSrcs = [
    a?.mugFilled, a?.mugFilled, a?.mugFilled, a?.mugEmpty,
  ];

  const glassRow: Child[] = [];
  glassLabels.forEach((label, i) => {
    glassRow.push(anim(h("div", {
      flexDirection: "column", alignItems: "center", flexShrink: 0,
      marginRight: i < glassLabels.length - 1 ? 6 : 0,
    },
      mugAsset(mugSrcs[i], i < 3, c.accent, c.cream, 80),
      h("div", {
        marginTop: 10, fontWeight: 700, fontSize: 20, letterSpacing: "0.1em",
        textTransform: "uppercase", color: i < 3 ? c.accent : alpha(c.cream, 0.45),
      }, label),
    ), { kind: "pop", order: 3, offset: i * 4 }));
    if (i < glassLabels.length - 1) {
      glassRow.push(
        a?.arrow
          ? anim({
            type: "img",
            props: {
              src: a.arrow, width: 28, height: 28,
              style: {
                width: 28, height: 28, objectFit: "contain", flexShrink: 0,
                marginBottom: 32, marginRight: 6,
              },
            },
          }, { kind: "fade", order: 3, offset: i * 4 + 2 })
          : h("div", {
            marginBottom: 36, marginRight: 6, fontSize: 32, color: alpha(c.cream, 0.4), flexShrink: 0,
          }, "→"),
      );
    }
  });

  const logos = (a?.logos ?? []).filter(Boolean) as string[];
  const logoTile = 132;
  const logoGap = 12;
  const logoColW = logoTile * 2 + logoGap;
  const sidePad = 64;
  const stepsW = WIDTH - sidePad * 2 - logoColW - 40;

  const ctaH = 88;
  return h("div", {
    width: WIDTH, height: HEIGHT, flexDirection: "column",
    backgroundColor: c.primary_dark, color: "#FFFFFF", fontFamily: BODY,
    padding: `52px ${sidePad}px ${52 + ctaH}px ${sidePad}px`,
    position: "relative",
  },
    h("div", {
      flexShrink: 0, flexDirection: "column", fontFamily: DISPLAY, fontSize: 84, lineHeight: 0.95,
      letterSpacing: "0.02em", textTransform: "uppercase",
    },
      anim(h("div", { color: "#FFFFFF" }, "Come back."), { kind: "words", order: 0 }),
      anim(h("div", { color: c.accent, marginTop: 6 }, "Earn free beer."), { kind: "words", order: 1 }),
    ),

    h("div", {
      flexGrow: 1, alignItems: "stretch", justifyContent: "space-between",
      marginTop: 24, minHeight: 0,
    },
      h("div", {
        flexDirection: "column", width: logos.length ? stepsW : "100%", flexShrink: 0,
        justifyContent: "flex-start", marginRight: logos.length ? 40 : 0,
      },
        h("div", {
          flexShrink: 0, alignItems: "flex-end", justifyContent: "flex-start", marginBottom: 18,
        }, ...glassRow),
        ...steps.map(([n, title, body], i) => anim(h("div", {
          flexDirection: "column", flexShrink: 0, padding: "14px 0",
          borderBottom: i === steps.length - 1 ? "none" : `2px solid ${alpha(c.cream, 0.12)}`,
        },
          h("div", { alignItems: "baseline" },
            h("div", {
              fontFamily: DISPLAY, fontSize: 30, letterSpacing: "0.08em", color: c.accent, marginRight: 14,
            }, n),
            h("div", {
              fontFamily: DISPLAY, fontSize: 32, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FFFFFF",
            }, title),
          ),
          h("div", {
            marginTop: 8, fontSize: 24, lineHeight: 1.35, color: alpha(c.cream, 0.65),
          }, body),
        ), { kind: "rise", order: 5, offset: i * 5 })),
      ),

      logos.length > 0
        ? h("div", {
          flexDirection: "column", width: logoColW, flexShrink: 0, justifyContent: "flex-start",
        },
          anim(h("div", {
            flexShrink: 0, flexDirection: "column", marginBottom: 16,
            fontFamily: DISPLAY, fontSize: 28, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.15,
          },
            h("div", { color: c.accent }, "Participating"),
            h("div", { color: "#FFFFFF" }, "Breweries"),
          ), { kind: "fade", order: 4 }),
          h("div", {
            flexDirection: "row", flexWrap: "wrap", width: logoColW,
          }, ...logos.map((src, i) => anim({
            type: "img",
            props: {
              src, width: logoTile, height: logoTile,
              style: {
                width: logoTile, height: logoTile, objectFit: "contain", flexShrink: 0,
                borderRadius: 16, backgroundColor: c.cream,
                marginRight: i % 2 === 0 ? logoGap : 0,
                marginBottom: i < logos.length - 2 ? logoGap : 0,
              },
            },
          }, { kind: "pop", order: 5, offset: i * 3 }))),
        )
        : null,
    ),

    h("div", {
      position: "absolute", left: sidePad, right: sidePad, bottom: 52,
      alignItems: "center", justifyContent: "center", height: ctaH,
    },
      anim(h("div", {
        alignItems: "center", justifyContent: "center",
        backgroundColor: c.accent, padding: "24px 32px", width: "100%",
      },
        h("div", {
          fontFamily: DISPLAY, fontSize: 30, letterSpacing: "0.12em", textTransform: "uppercase",
          color: c.primary_dark,
        }, "Download the free Hoppenings app  ·  Link in bio"),
      ), { kind: "pop", order: 8 }),
    ),
  );
}

const APP_FEATURES = [
  ["01", "Find breweries", "Every brewery near you, in one place."],
  ["02", "Discover events", "See what's happening today and this weekend."],
  ["03", "New releases", "Catch new beers as they drop."],
  ["04", "Leaderboards", "Join brewery leaderboards."],
] as const;

function promoApp(b: Brand, s: Extract<SlideSpec, { kind: "promo" }>): El {
  const c = b.colors;
  const phoneW = 380;
  const phoneH = Math.round(phoneW * (1100 / 634));
  const leftW = WIDTH - PAD * 2 - phoneW - 40;

  return h("div", {
    width: WIDTH, height: HEIGHT, flexDirection: "column",
    backgroundColor: c.primary_dark, color: "#FFFFFF", fontFamily: BODY,
    padding: `${PAD}px ${PAD}px 72px ${PAD}px`,
  },
    anim(h("div", {
      flexShrink: 0, fontWeight: 700, fontSize: 26, letterSpacing: "0.28em",
      textTransform: "uppercase", color: c.accent,
    }, "Get the Hoppenings app"), { kind: "fade", order: 0 }),
    anim(goldRule(b, 96), { kind: "wipe", order: 1 }),
    h("div", {
      flexShrink: 0, flexDirection: "column", marginTop: 28, fontFamily: DISPLAY,
      fontSize: 86, lineHeight: 0.95, letterSpacing: "0.02em", textTransform: "uppercase",
    },
      anim(h("div", { color: "#FFFFFF" }, "The brewery scene"), { kind: "words", order: 2 }),
      anim(h("div", { color: c.accent, marginTop: 6 }, "In your pocket"), { kind: "words", order: 3 }),
    ),

    h("div", {
      flexGrow: 1, alignItems: "center", justifyContent: "space-between", marginTop: 36, minHeight: 0,
    },
      h("div", { flexDirection: "column", width: leftW, flexShrink: 0 },
        ...APP_FEATURES.map(([n, title, body], i) => anim(h("div", {
          flexDirection: "column", padding: "18px 0",
          borderBottom: i === APP_FEATURES.length - 1 ? "none" : `2px solid ${alpha(c.cream, 0.12)}`,
        },
          h("div", { alignItems: "baseline" },
            h("div", {
              fontFamily: DISPLAY, fontSize: 32, letterSpacing: "0.08em", color: c.accent, marginRight: 16,
            }, n),
            h("div", {
              fontFamily: DISPLAY, fontSize: 38, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FFFFFF",
            }, title),
          ),
          h("div", {
            marginTop: 8, fontSize: 26, lineHeight: 1.35, color: alpha(c.cream, 0.65),
          }, body),
        ), { kind: "rise", order: 4, offset: i * 5 })),
      ),
      (s.appImageData ?? b.appImageData)
        ? anim({
          type: "img",
          props: {
            src: (s.appImageData ?? b.appImageData)!, width: phoneW, height: phoneH,
            style: { width: phoneW, height: phoneH, objectFit: "contain", flexShrink: 0 },
          },
        }, { kind: "slide", order: 4, dir: "right" })
        : anim(h("div", {
          width: phoneW, height: phoneH, flexShrink: 0, borderRadius: 36,
          backgroundColor: c.primary, alignItems: "center", justifyContent: "center",
          fontFamily: DISPLAY, fontSize: 42, color: c.accent, textTransform: "uppercase",
        }, "Hoppenings"), { kind: "slide", order: 4, dir: "right" }),
    ),

    h("div", { flexShrink: 0, flexDirection: "column", alignItems: "flex-start", marginTop: 28 },
      anim(h("div", {
        fontFamily: DISPLAY, fontSize: 34, letterSpacing: "0.14em", textTransform: "uppercase",
        color: c.primary_dark, backgroundColor: c.accent, padding: "22px 36px",
      }, s.cta || "Get the app · Link in bio"), { kind: "pop", order: 7 }),
      anim(h("div", {
        marginTop: 16, fontSize: 24, fontWeight: 600, letterSpacing: "0.14em",
        textTransform: "uppercase", color: alpha(c.cream, 0.7),
      }, "Free on iPhone and Android"), { kind: "fade", order: 8 }),
    ),
  );
}

function promo(b: Brand, s: Extract<SlideSpec, { kind: "promo" }>): El {
  return s.variant === "tap_tracker" ? promoTapTracker(b, s) : promoApp(b, s);
}

export function renderSlideElement(b: Brand, s: SlideSpec): El {
  switch (s.kind) {
    case "cover": return cover(b, s);
    case "featured": return featured(b, s);
    case "list": return list(b, s);
    case "end": return end(b, s);
    case "promo": return promo(b, s);
    case "static":
      // Should not be rendered through Satori — render-post inserts the URL directly.
      return h("div", { width: WIDTH, height: HEIGHT, backgroundColor: b.colors.primary_dark });
  }
}

