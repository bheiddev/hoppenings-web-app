import { adminClient } from "./common.ts";

// Brewery photo lookup for featured slides.
// Resolves whatever the breweries row stores (full URL or storage path) into a URL the
// renderer can fetch, preferring a resized version via Supabase image transformations.

type Db = ReturnType<typeof adminClient>;

// Columns tried in order unless BREWERY_IMAGE_COLUMN is set. Logos are deliberately
// not included: a logo cropped to a wide photo banner looks bad.
const CANDIDATE_COLUMNS = [
  "image_url", "cover_image_url", "hero_image_url", "photo_url", "banner_url",
  "image", "cover_image", "hero_image", "photo", "image_path",
];

// Banner size on the featured slide (render at exactly this size).
export const PHOTO_W = 1080;
export const PHOTO_H = 600;

export interface ResolvedImage {
  url: string;           // preferred (resized when possible)
  fallback_url: string;  // original, used if the resized URL fails
}

// deno-lint-ignore no-explicit-any
export function breweryImageValue(b: Record<string, any> | null | undefined): string | null {
  if (!b) return null;
  const forced = Deno.env.get("BREWERY_IMAGE_COLUMN");
  const cols = forced ? [forced] : CANDIDATE_COLUMNS;
  for (const c of cols) {
    const v = b[c];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) return v[0].trim(); // e.g. images[]
  }
  return null;
}

/**
 * Turn a stored value into fetchable URLs.
 * - Supabase public object URL  -> render/image transform URL (+ original as fallback)
 * - Any other http(s) URL       -> used as-is
 * - Storage path ("bucket/x.jpg" or "x.jpg") -> signed URLs (works for public AND private
 *   buckets). Bucket comes from the path prefix or BREWERY_IMAGE_BUCKET.
 */
export async function resolveImage(
  db: Db,
  value: string | null,
): Promise<ResolvedImage | null> {
  if (!value) return null;
  const transform = { width: PHOTO_W, height: PHOTO_H, resize: "cover" as const, quality: 75, format: "origin" as const };

  if (/^https?:\/\//i.test(value)) {
    const m = value.match(/^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/(.+?)(\?.*)?$/);
    if (m) {
      const q = `width=${transform.width}&height=${transform.height}&resize=cover&quality=${transform.quality}&format=origin`;
      return { url: `${m[1]}/storage/v1/render/image/public/${m[2]}?${q}`, fallback_url: value };
    }
    return { url: value, fallback_url: value };
  }

  const defaultBucket = Deno.env.get("BREWERY_IMAGE_BUCKET") ?? "brewery-images";
  let bucket = defaultBucket;
  let path = value.replace(/^\/+/, "");
  const first = path.split("/")[0];
  if (first === defaultBucket || (first && path.includes("/") && first !== defaultBucket && await bucketExists(db, first))) {
    bucket = first;
    path = path.slice(first.length + 1);
  }

  const store = db.storage.from(bucket);
  const [plain, resized] = await Promise.all([
    // 7 days, so a reel built from slide_specs later can still load the photo
    store.createSignedUrl(path, 604800),
    store.createSignedUrl(path, 604800, { transform }),
  ]);
  if (plain.error || !plain.data?.signedUrl) {
    console.warn(`brewery image not found: ${bucket}/${path}: ${plain.error?.message}`);
    return null;
  }
  return {
    url: resized.data?.signedUrl ?? plain.data.signedUrl,
    fallback_url: plain.data.signedUrl,
  };
}

const bucketCache = new Map<string, boolean>();
async function bucketExists(db: Db, name: string): Promise<boolean> {
  if (bucketCache.has(name)) return bucketCache.get(name)!;
  const { data } = await db.storage.getBucket(name);
  bucketCache.set(name, !!data);
  return !!data;
}

