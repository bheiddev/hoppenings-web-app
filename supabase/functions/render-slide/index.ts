// INTERNAL. POST { post_id, index, render_id, spec, brand }
// Renders ONE slide: template -> Satori SVG -> resvg -> JPEG -> Storage bucket "social".
import { Buffer } from "node:buffer";
import { adminClient, HttpError, json, serve } from "../_shared/common.ts";
import { type FontDef, renderJpeg } from "../_shared/render.ts";
import type { SlideItem, SlideSpec } from "../_shared/slides.ts";
import { bundledPromoAssets } from "../_shared/promoAssetsBundled.ts";
import {
  BODY,
  type Brand,
  DISPLAY,
  HEIGHT,
  WIDTH,
  renderSlideElement,
  resolveColors,
} from "../_shared/templates.ts";
import { webpToJpeg } from "../_shared/webp.ts";

const GF = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl";
const DEFAULT_FONTS = {
  display: `${GF}/fjallaone/FjallaOne-Regular.ttf`,
  body_400: `${GF}/bevietnampro/BeVietnamPro-Regular.ttf`,
  body_600: `${GF}/bevietnampro/BeVietnamPro-SemiBold.ttf`,
  body_700: `${GF}/bevietnampro/BeVietnamPro-Bold.ttf`,
};

const fontCache = new Map<string, ArrayBuffer>();
async function loadFont(url: string): Promise<ArrayBuffer> {
  if (url.toLowerCase().split("?")[0].endsWith(".woff2")) {
    throw new HttpError(400, `Satori can't read .woff2 fonts (${url}); upload .ttf, .otf or .woff`);
  }
  const hit = fontCache.get(url);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new HttpError(502, `Font fetch failed (${res.status}): ${url}`);
  const buf = await res.arrayBuffer();
  fontCache.set(url, buf);
  return buf;
}

const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

/** Identify the real image format from its first bytes (storage often serves octet-stream). */
function sniff(b: Uint8Array): "image/jpeg" | "image/png" | "webp" | "avif" | "gif" | "unknown" {
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(4, 12).startsWith("ftypavi")) return "avif";
  if (ascii(0, 3) === "GIF") return "gif";
  return "unknown";
}

// WebP photos are converted to a banner-sized JPEG once and cached in the `social` bucket,
// keyed by the source image path, so re-renders don't pay the conversion again.
// (If a brewery image is replaced at the SAME path, delete social/_photo-cache to refresh.)
const BANNER_W = 1080;
const BANNER_H = 600;
async function convertedWebp(sourceUrl: string, webp: Uint8Array): Promise<Uint8Array> {
  const key = sourceUrl.split("?")[0];
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(key));
  const hash = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
  const path = `_photo-cache/${hash}.jpg`;
  const store = adminClient().storage.from("social");

  const cached = await store.download(path);
  if (cached.data) return new Uint8Array(await cached.data.arrayBuffer());

  const jpg = await webpToJpeg(webp, BANNER_W, BANNER_H);
  const { error } = await store.upload(path, jpg, { contentType: "image/jpeg", upsert: true });
  if (error) console.warn(`photo cache write failed: ${error.message}`);
  return jpg;
}

/**
 * Fetch a brewery photo as a data: URI.
 * Returns { data } on success, or { reason } explaining why there's no photo (shown to the admin).
 */
async function photoDataUri(img: SlideItem["image"]): Promise<{ data: string | null; reason: string | null }> {
  if (!img) return { data: null, reason: "no image found for this brewery" };
  const urls = [...new Set([img.url, img.fallback_url])];
  let reason = "";
  for (const url of urls) {
    const shortUrl = url.split("?")[0];
    try {
      const res = await fetch(url, {
        headers: { Accept: "image/jpeg,image/png;q=0.9,*/*;q=0.1" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        reason = `HTTP ${res.status} loading ${shortUrl}`;
        console.warn(`photo: ${reason}`);
        continue;
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > MAX_PHOTO_BYTES) {
        reason = `image too large (${(buf.byteLength / 1048576).toFixed(1)} MB)`;
        console.warn(`photo: ${reason}: ${shortUrl}`);
        continue;
      }
      const kind = sniff(buf);
      if (kind === "webp") {
        const jpg = await convertedWebp(img.fallback_url, buf);
        return { data: `data:image/jpeg;base64,${Buffer.from(jpg).toString("base64")}`, reason: null };
      }
      if (kind !== "image/jpeg" && kind !== "image/png") {
        reason = kind === "unknown"
          ? `not an image (${res.headers.get("content-type") ?? "no content-type"})`
          : `${kind.toUpperCase()} images aren't supported, use JPEG, PNG or WebP`;
        console.warn(`photo: ${reason}: ${shortUrl}`);
        continue;
      }
      return { data: `data:${kind};base64,${Buffer.from(buf).toString("base64")}`, reason: null };
    } catch (e) {
      reason = `couldn't load image (${(e as Error).message})`;
      console.warn(`photo: ${reason}: ${shortUrl}`);
    }
  }
  return { data: null, reason: reason || "couldn't load image" };
}

// End-slide app mockup (brand_profiles.app_image_url), cached per warm worker.
const appImageCache = new Map<string, string | null>();
async function appImageDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (appImageCache.has(url)) return appImageCache.get(url)!;
  let data: string | null = null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const buf = new Uint8Array(await res.arrayBuffer());
      const kind = sniff(buf);
      if (kind === "image/png" || kind === "image/jpeg") {
        data = `data:${kind};base64,${Buffer.from(buf).toString("base64")}`;
      } else {
        console.warn(`app image skipped: ${kind} isn't supported (use PNG or JPEG)`);
      }
    } else {
      console.warn(`app image HTTP ${res.status}: ${url}`);
    }
  } catch (e) {
    console.warn(`app image fetch failed: ${(e as Error).message}`);
  }
  appImageCache.set(url, data);
  return data;
}

serve(async (req) => {
  const { post_id, index, render_id, spec, brand: raw, no_photo } = await req.json();
  if (!post_id || index === undefined || !spec || !raw) {
    throw new HttpError(400, "post_id, index, spec, brand required");
  }

  const f = { ...DEFAULT_FONTS, ...(raw.fonts ?? {}) };
  const [display, b400, b600, b700] = await Promise.all([
    loadFont(f.display), loadFont(f.body_400), loadFont(f.body_600), loadFont(f.body_700),
  ]);
  const fonts: FontDef[] = [
    { name: DISPLAY, data: display, weight: 400, style: "normal" },
    { name: BODY, data: b400, weight: 400, style: "normal" },
    { name: BODY, data: b600, weight: 600, style: "normal" },
    { name: BODY, data: b700, weight: 700, style: "normal" },
  ];

  const needsAppImage =
    spec?.kind === "end" || (spec?.kind === "promo" && spec?.variant === "app");
  const needsTapAssets = spec?.kind === "promo" && spec?.variant === "tap_tracker";
  const defaultPhone =
    "https://hoppeningsco.com/HoppeningsIphoneBent.png";
  const brand: Brand = {
    name: raw.name,
    colors: resolveColors(raw.colors),
    logo_url: raw.logo_url ?? null,
    logo_light_url: raw.logo_light_url ?? null,
    handle: raw.handle,
    cta_text: raw.cta_text,
    appImageData: needsAppImage
      ? (await appImageDataUri(raw.app_image_url)) ??
        (spec?.kind === "promo" ? await appImageDataUri(defaultPhone) : null)
      : null,
    promoAssets: needsTapAssets ? bundledPromoAssets() : null,
  };

  const slide = spec as SlideSpec;
  let photo: string | null = null; // null = fine / not applicable; otherwise why there's no photo
  if (slide.kind === "cover" && slide.previews?.some((pv) => pv.image)) {
    if (no_photo) {
      photo = "skipped to stay within the CPU limit";
    } else {
      // only the hero (first preview) shows a photo
      const got = await Promise.all(slide.previews.map((pv, i) => i === 0 && pv.image ? photoDataUri(pv.image) : null));
      const problems: string[] = [];
      slide.previews.forEach((pv, i) => {
        pv.imageData = got[i]?.data ?? null;
        if (got[i]?.reason) problems.push(`${pv.brewery}: ${got[i]!.reason}`);
      });
      photo = problems.length ? problems.join("; ") : null;
    }
  }
  if (slide.kind === "featured") {
    if (no_photo) {
      photo = "skipped to stay within the CPU limit";
    } else {
      const got = await photoDataUri(slide.item.image);
      slide.item.imageData = got.data;
      photo = got.reason;
    }
  }
  if (slide.kind === "promo" && slide.variant === "app") {
    slide.appImageData = brand.appImageData;
  }

  const element = renderSlideElement(brand, slide);
  const { jpeg, timings } = await renderJpeg(element, { width: WIDTH, height: HEIGHT, fonts });
  console.log(`slide ${index + 1} timings(ms)`, JSON.stringify(timings));

  const path = `${post_id}/${render_id ?? Date.now()}-${String(index + 1).padStart(2, "0")}.jpg`;
  const db = adminClient();
  const { error } = await db.storage.from("social").upload(path, jpeg, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new HttpError(500, `Upload failed: ${error.message}`);

  const { data } = db.storage.from("social").getPublicUrl(path);
  return json({ url: data.publicUrl, index, timings, photo_problem: photo });
});