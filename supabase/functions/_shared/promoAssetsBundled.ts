/** Edge-Function-only: embedded Tap Tracker PNGs as data URIs (keeps Next.js bundle small). */
import { PROMO_ASSET_DATA } from "./promoAssetData.ts";
import {
  TAP_TRACKER_FILES,
  TAP_TRACKER_LOGOS,
  type PromoAssets,
} from "./promoAssets.ts";

export function bundledPromoAssets(): PromoAssets {
  return {
    mugFilled: PROMO_ASSET_DATA[TAP_TRACKER_FILES.mugFilled] ?? null,
    mugEmpty: PROMO_ASSET_DATA[TAP_TRACKER_FILES.mugEmpty] ?? null,
    arrow: PROMO_ASSET_DATA[TAP_TRACKER_FILES.arrow] ?? null,
    logos: TAP_TRACKER_LOGOS.map((f) => PROMO_ASSET_DATA[f] ?? null),
  };
}
