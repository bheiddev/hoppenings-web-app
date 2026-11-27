/** Tap Tracker / app promo image assets used by templates + Remotion. */

export const TAP_TRACKER_LOGOS = [
  "logo-gunslinger.png",
  "logo-urban-animal-downtown.png",
  "logo-urban-animal-star-ranch.png",
  "logo-mash-mechanix.png",
  "logo-occ-brewing.png",
  "logo-whistle-pig.png",
  "logo-armillary.png",
  "logo-wackadoo.png",
] as const;

export const TAP_TRACKER_FILES = {
  mugFilled: "mug-filled.png",
  mugEmpty: "mug-empty.png",
  arrow: "arrow.png",
  logos: TAP_TRACKER_LOGOS,
} as const;

/**
 * Default phone mockup when brand_profiles.app_image_url is empty.
 * Must be a full URL (not "/…") — the Supabase CLI treats root-relative
 * paths as files to bundle and fails deploy with "open /….png: invalid argument".
 */
export const DEFAULT_APP_PHONE = "https://hoppeningsco.com/HoppeningsIphoneBent.png";

export interface PromoAssets {
  mugFilled?: string | null;
  mugEmpty?: string | null;
  arrow?: string | null;
  /** Up to 8 brewery logo data-URIs / URLs, in grid order. */
  logos?: (string | null)[];
}

/** Public URL path for a tap-tracker asset (Remotion / browser). */
export function tapTrackerPublicPath(file: string): string {
  return `/assets/tap-tracker/compact/${file}`;
}

/** Absolute public URL for Edge Function fetches (after the site is deployed). */
export function tapTrackerSiteUrl(file: string, site = "https://hoppeningsco.com"): string {
  return `${site.replace(/\/$/, "")}/assets/tap-tracker/compact/${file}`;
}

/** Browser/Remotion URLs under /public/assets/tap-tracker/compact. */
export function publicPromoAssets(): PromoAssets {
  return {
    mugFilled: tapTrackerPublicPath(TAP_TRACKER_FILES.mugFilled),
    mugEmpty: tapTrackerPublicPath(TAP_TRACKER_FILES.mugEmpty),
    arrow: tapTrackerPublicPath(TAP_TRACKER_FILES.arrow),
    logos: TAP_TRACKER_LOGOS.map((f) => tapTrackerPublicPath(f)),
  };
}
