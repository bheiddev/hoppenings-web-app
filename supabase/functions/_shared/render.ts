import satori from "npm:satori@0.12.2";
import { initWasm, Resvg } from "npm:@resvg/resvg-wasm@2.6.2";
import jpeg from "npm:jpeg-js@0.4.4";
import { stripAnim } from "./templates.ts";

// Rendering core: element -> Satori SVG -> resvg (wasm) RGBA -> JPEG bytes.
// All npm packages, no browser.



const DEFAULT_WASM_URL = "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

let wasmReady: Promise<void> | null = null;
/** Initialise resvg once per cold start. `source` can be a URL or raw bytes (for tests). */
export function ensureResvg(source?: string | Uint8Array): Promise<void> {
  if (!wasmReady) {
    const src = source ?? Deno.env.get("RESVG_WASM_URL") ?? DEFAULT_WASM_URL;
    wasmReady = initWasm(typeof src === "string" ? fetch(src) : src).catch((e) => {
      wasmReady = null; // allow retry on next request
      throw e;
    });
  }
  return wasmReady;
}

export interface FontDef {
  name: string;
  data: ArrayBuffer | Uint8Array;
  weight: 400 | 600 | 700;
  style: "normal";
}

export async function renderJpeg(
  // deno-lint-ignore no-explicit-any
  element: any,
  opts: { width: number; height: number; fonts: FontDef[]; quality?: number },
): Promise<{ jpeg: Uint8Array; timings: Record<string, number> }> {
  if (opts.fonts.length === 0) {
    throw new Error("At least one font is required. Upload heading/body fonts in brand settings.");
  }
  await ensureResvg();
  const t0 = performance.now();
  // deno-lint-ignore no-explicit-any
  // Reel animation tags are for the admin's Remotion adapter only; Satori never sees them.
  const svg = await satori(stripAnim(element), { width: opts.width, height: opts.height, fonts: opts.fonts as any });
  const t1 = performance.now();
  const rendered = new Resvg(svg, { fitTo: { mode: "width", value: opts.width } }).render();
  const pixels = rendered.pixels; // RGBA
  const t2 = performance.now();
  const out = jpeg.encode(
    { data: pixels, width: rendered.width, height: rendered.height },
    opts.quality ?? 88,
  );
  const t3 = performance.now();
  rendered.free?.();
  return {
    jpeg: new Uint8Array(out.data),
    timings: { satori: t1 - t0, resvg: t2 - t1, jpeg: t3 - t2 },
  };
}

