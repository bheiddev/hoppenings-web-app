// Promo slides for the carousel / reel. Prefer animated templates (same path as cover/item
 // slides) over static PNGs so Instagram gets JPEGs and Remotion can animate them.
// brand_profiles.promo_slides may still list { url, position }; known URLs map to templates.

export type PromoVariant = "tap_tracker" | "app";

export type Promo =
  | { kind: "template"; variant: PromoVariant; position: number | "last" }
  | { kind: "static"; url: string; position: number | "last" };

/** Pinned Tap Tracker promo: always slide 4. */
export const PINNED_PROMO: Promo = {
  kind: "template",
  variant: "tap_tracker",
  position: 4,
};

/** Default app promo at the end when brand settings don't already include one. */
export const DEFAULT_APP_PROMO: Promo = {
  kind: "template",
  variant: "app",
  position: "last",
};

/** Map a known campaign PNG URL to an animated promo variant (or null). */
export function variantFromUrl(url: string): PromoVariant | null {
  const u = url.split("?")[0].toLowerCase();
  if (/tap[-_]?tracker|unnamed\.png|come-back|earn-free-beer/i.test(u)) return "tap_tracker";
  if (/promo[-_]?app|app-v\d|get-the-app|brewery-scene|in-your-pocket/i.test(u)) return "app";
  return null;
}

function isSamePromo(a: Promo, b: Promo): boolean {
  if (a.kind === "template" && b.kind === "template") return a.variant === b.variant;
  if (a.kind === "static" && b.kind === "static") return a.url.split("?")[0] === b.url.split("?")[0];
  return false;
}

// deno-lint-ignore no-explicit-any
export function promoSlides(brand: Record<string, any> | null | undefined): Promo[] {
  const fromBrand: Promo[] = [
    ...(Array.isArray(brand?.promo_slides) ? brand!.promo_slides : [])
      // deno-lint-ignore no-explicit-any
      .filter((p: any) => p && typeof p.url === "string" && p.url.trim())
      // deno-lint-ignore no-explicit-any
      .map((p: any): Promo => {
        const url = p.url.trim();
        const position: number | "last" =
          Number.isInteger(Number(p.position)) && Number(p.position) >= 1
            ? Number(p.position)
            : "last";
        const variant = variantFromUrl(url);
        return variant
          ? { kind: "template", variant, position }
          : { kind: "static", url, position };
      }),
    ...(Array.isArray(brand?.promo_slide_urls) ? brand!.promo_slide_urls : [])
      .filter((u: unknown) => typeof u === "string" && (u as string).trim())
      .map((u: string): Promo => {
        const url = u.trim();
        const variant = variantFromUrl(url);
        return variant
          ? { kind: "template", variant, position: "last" }
          : { kind: "static", url, position: "last" };
      }),
  ];

  const withoutPinned = fromBrand.filter((p) => !isSamePromo(p, PINNED_PROMO));
  const hasApp = withoutPinned.some(
    (p) => p.kind === "template" && p.variant === "app",
  );
  const list = [
    PINNED_PROMO,
    ...withoutPinned,
    ...(hasApp ? [] : [DEFAULT_APP_PROMO]),
  ];
  return list.slice(0, 3);
}
