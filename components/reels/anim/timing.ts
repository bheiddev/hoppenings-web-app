// Reel animation timing + per-kind styles. Every animation ends at the element's static
// position (opacity 1, no transform, no blur), so the last frame of a scene equals the slide.
import { Easing, interpolate, spring } from "remotion";
import type { Anim } from "../shared/templates";

export const ORDER_FRAMES = 6;   // frames between choreography steps
export const LEAD_FRAMES = 6;    // wait for the scene transition before the first step
export const DURATION = 14;      // frames for one element's animation
export const WORD_STAGGER = 4;   // frames between words in a "words" animation
export const WORD_DURATION = 16;
export const HOLD_FRAMES = 36;   // rest on the finished slide before the next transition
export const ZOOM_FRAMES = 90;   // photo settles from ZOOM_FROM to 1 over this many frames
export const ZOOM_FROM = 1.1;

const ease = Easing.bezier(0.16, 1, 0.3, 1); // fast start, soft landing

export function startFrame(a: Anim): number {
  return LEAD_FRAMES + a.order * ORDER_FRAMES + (a.offset ?? 0);
}

/** 0 -> 1 progress of an animation that starts at `start` and lasts `dur` frames. */
export function progress(frame: number, start: number, dur = DURATION): number {
  return interpolate(frame, [start, start + dur], [0, 1], {
    easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

export interface AnimStyle {
  opacity?: number;
  transform?: string;
  filter?: string;
  transformOrigin?: string;
}

/** Style to merge onto a tagged element at `frame` (not used for "words"; see wordStyle). */
export function animStyle(a: Anim, frame: number, fps: number): AnimStyle {
  const start = startFrame(a);
  const p = progress(frame, start);
  switch (a.kind) {
    case "fade":
      return { opacity: p };
    case "rise":
      return { opacity: p, transform: `translateY(${(1 - p) * 40}px)`, filter: `blur(${(1 - p) * 6}px)` };
    case "slide": {
      const from = a.dir === "right" ? 90 : -90;
      return { opacity: p, transform: `translateX(${(1 - p) * from}px)` };
    }
    case "pop": {
      const s = spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 170, mass: 0.8 } });
      return { opacity: Math.min(1, p * 1.5), transform: `scale(${0.82 + 0.18 * s})` };
    }
    case "wipe":
      return { transform: `scaleX(${p})`, transformOrigin: "left center" };
    case "zoom": {
      const z = interpolate(frame, [0, ZOOM_FRAMES], [ZOOM_FROM, 1], {
        easing: Easing.out(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp",
      });
      return { transform: `scale(${z})` };
    }
    default:
      return {};
  }
}

/** Style for word `i` of a "words" animation: rise + blur-to-sharp, staggered. */
export function wordStyle(a: Anim, i: number, frame: number): AnimStyle {
  const p = progress(frame, startFrame(a) + i * WORD_STAGGER, WORD_DURATION);
  return { opacity: p, transform: `translateY(${(1 - p) * 28}px)`, filter: `blur(${(1 - p) * 12}px)` };
}

/** Frame at which the last tagged animation in a slide tree finishes. */
export function lastAnimEnd(node: unknown): number {
  let end = 0;
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    const props = (n as { props?: Record<string, unknown> }).props ?? {};
    const a = props.anim as Anim | undefined;
    if (a && a.kind !== "zoom") {
      const words = a.kind === "words" && typeof props.children === "string"
        ? (props.children as string).trim().split(/\s+/).length : 1;
      const dur = a.kind === "words" ? (words - 1) * WORD_STAGGER + WORD_DURATION : DURATION;
      end = Math.max(end, startFrame(a) + dur);
    }
    walk(props.children);
  };
  walk(node);
  return end;
}

/** Scene length: every animation finished, plus a hold on the finished slide. */
export function sceneFrames(tree: unknown, min = 60): number {
  return Math.max(min, lastAnimEnd(tree) + HOLD_FRAMES);
}
