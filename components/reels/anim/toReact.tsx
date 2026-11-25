// Turns a slide template tree ({ type, props: { style, children } }, the same tree Satori renders
// into the carousel JPEG) into React elements, animating every node that carries an `anim` tag.
// Animation styles are merged onto the element itself (no wrapper divs), so the layout is
// exactly the slide's layout. The only exception is "zoom" on <img>, which gets a clipping box
// of the image's own size so the photo can scale without spilling over neighbouring content.
import React from "react";
import { Img } from "remotion";
import type { Anim } from "../shared/templates";
import { animStyle, wordStyle, type AnimStyle } from "./timing";

type Node = { type: string; props: Record<string, unknown> } | string | number | null | undefined | false | Node[];

export interface AnimCtx {
  frame: number;
  fps: number;
  /** Set to false to render the static slide (e.g. a poster frame or a side-by-side check). */
  animate?: boolean;
}

function merge(style: React.CSSProperties | undefined, a: AnimStyle): React.CSSProperties {
  // Empty anim style = settled at rest → return the template style unchanged (no leftover
  // blur/transform that could visually overlap neighbours).
  const active =
    a.opacity !== undefined ||
    Boolean(a.transform) ||
    Boolean(a.filter) ||
    Boolean(a.transformOrigin)
  if (!active) return style ?? {}
  const s = { ...(style ?? {}) }
  if (a.opacity !== undefined) s.opacity = (typeof s.opacity === 'number' ? s.opacity : 1) * a.opacity
  if (a.transform) s.transform = s.transform ? `${s.transform} ${a.transform}` : a.transform
  if (a.filter) s.filter = s.filter ? `${s.filter} ${a.filter}` : a.filter
  if (a.transformOrigin) s.transformOrigin = a.transformOrigin
  return s
}

export function toReact(node: Node, ctx: AnimCtx, key?: React.Key): React.ReactNode {
  if (node === null || node === undefined || node === false) return null;
  if (typeof node === "string" || typeof node === "number") return node;
  if (Array.isArray(node)) return node.map((n, i) => toReact(n, ctx, i));

  const { anim, children, style, ...rest } = node.props as {
    anim?: Anim; children?: Node; style?: React.CSSProperties; [k: string]: unknown;
  };
  const a = ctx.animate === false ? undefined : anim;

  // Images: Remotion's <Img> waits for the image to load before the frame is captured.
  if (node.type === "img") {
    const img = (extra: AnimStyle = {}) => (
      <Img key={key} src={rest.src as string} width={rest.width as number} height={rest.height as number}
        style={merge(style, extra)} />
    );
    if (a?.kind === "zoom") {
      const w = (style?.width ?? rest.width) as number;
      const h = (style?.height ?? rest.height) as number;
      // Clip box with the image's own size and corners; the image scales inside it.
      return (
        <div key={key} style={{
          display: "flex", width: w, height: h, flexShrink: 0, overflow: "hidden",
          marginRight: style?.marginRight, marginLeft: style?.marginLeft,
          borderTopLeftRadius: style?.borderTopLeftRadius, borderTopRightRadius: style?.borderTopRightRadius,
          borderRadius: style?.borderRadius,
        }}>
          {img(animStyle(a, ctx.frame, ctx.fps))}
        </div>
      );
    }
    return img(a ? animStyle(a, ctx.frame, ctx.fps) : {});
  }

  // Word-by-word blur-in: the text becomes inline-block word spans in a block container, so it
  // wraps exactly like plain text. (A text-only flex div lays out the same as a block div.)
  if (a?.kind === "words" && typeof children === "string") {
    const words = children.trim().split(/\s+/);
    return React.createElement(
      node.type,
      { key, ...rest, style: { ...style, display: "block" } },
      words.map((w, i) => (
        <React.Fragment key={i}>
          <span style={{ display: "inline-block", ...wordStyle(a, i, ctx.frame) }}>{w}</span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      )),
    );
  }

  return React.createElement(
    node.type,
    { key, ...rest, style: a && a.kind !== "words" ? merge(style, animStyle(a, ctx.frame, ctx.fps)) : style },
    toReact(children as Node, ctx),
  );
}
