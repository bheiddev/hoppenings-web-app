import jpeg from "npm:jpeg-js@0.4.4";
import decodeWebp, { init as initWebp } from "npm:@jsquash/webp@1.5.0/decode.js";

// WebP -> JPEG for brewery photos (Satori/resvg can't draw WebP).
// Decodes with libwebp (wasm, via @jsquash/webp), cover-crops + resizes to the banner size,
// and encodes a JPEG with jpeg-js. Pure wasm/JS, no browser.


const DEFAULT_WEBP_WASM = "https://cdn.jsdelivr.net/npm/@jsquash/webp@1.5.0/codec/dec/webp_dec.wasm";

// The decoder returns ImageData, which Deno doesn't provide globally.
// deno-lint-ignore no-explicit-any
const g = globalThis as any;
if (typeof g.ImageData === "undefined") {
  g.ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
}

let ready: Promise<void> | null = null;
/** Load the WebP decoder once per cold start. `source` = wasm URL or bytes (tests). */
export function ensureWebp(source?: string | Uint8Array): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const src = source ?? Deno.env.get("WEBP_WASM_URL") ?? DEFAULT_WEBP_WASM;
      const bytes = typeof src === "string" ? new Uint8Array(await (await fetch(src)).arrayBuffer()) : src;
      const mod = await WebAssembly.compile(new Uint8Array(bytes));
      await initWebp(mod);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

/** Decode WebP, cover-crop to targetW x targetH (bilinear), return JPEG bytes. */
export async function webpToJpeg(
  webp: Uint8Array,
  targetW: number,
  targetH: number,
  quality = 82,
): Promise<Uint8Array> {
  await ensureWebp();
  const img = await decodeWebp(webp.slice().buffer);
  const { width: sw, height: sh, data: src } = img;

  // cover: scale so the image fills the target, then center-crop
  const scale = Math.max(targetW / sw, targetH / sh);
  const offX = (sw * scale - targetW) / 2;
  const offY = (sh * scale - targetH) / 2;
  const out = new Uint8Array(targetW * targetH * 4);

  for (let y = 0; y < targetH; y++) {
    const fy = Math.min(sh - 1, Math.max(0, (y + offY + 0.5) / scale - 0.5));
    const y0 = Math.floor(fy), y1 = Math.min(sh - 1, y0 + 1), wy = fy - y0;
    for (let x = 0; x < targetW; x++) {
      const fx = Math.min(sw - 1, Math.max(0, (x + offX + 0.5) / scale - 0.5));
      const x0 = Math.floor(fx), x1 = Math.min(sw - 1, x0 + 1), wx = fx - x0;
      const i00 = (y0 * sw + x0) * 4, i01 = (y0 * sw + x1) * 4;
      const i10 = (y1 * sw + x0) * 4, i11 = (y1 * sw + x1) * 4;
      const o = (y * targetW + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top = src[i00 + c] + (src[i01 + c] - src[i00 + c]) * wx;
        const bot = src[i10 + c] + (src[i11 + c] - src[i10 + c]) * wx;
        out[o + c] = top + (bot - top) * wy;
      }
      out[o + 3] = 255;
    }
  }

  const encoded = jpeg.encode({ data: out, width: targetW, height: targetH }, quality);
  return new Uint8Array(encoded.data);
}

