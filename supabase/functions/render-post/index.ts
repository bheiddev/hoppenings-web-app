// POST { post_id }
// Plans the slides from the post's included items (overrides applied) and renders each
// slide via render-slide. Sets status -> pending_review with image_urls, or -> failed.
import { adminClient, env, HttpError, json, serve } from "../_shared/common.ts";
import {
  breweryName,
  formatCost,
  formatTime,
} from "../_shared/events.ts";
import {
  type DayItem,
  coverLine,
  dealToItem,
  releaseToItem,
  shortBlurb,
} from "../_shared/items.ts";
import { breweryImageValue, resolveImage } from "../_shared/images.ts";
import { type Promo, promoSlides } from "../_shared/promos.ts";
import {
  type SlideItem,
  type SlideSpec,
  planSlides,
} from "../_shared/slides.ts";

serve(async (req) => {
  const { post_id } = await req.json().catch(() => ({}));
  if (!post_id) throw new HttpError(400, "post_id required");

  const db = adminClient();
  const { data: post, error } = await db.from("social_posts").select("*").eq("id", post_id).single();
  if (error || !post) throw new HttpError(404, "Post not found");
  if (["publishing", "published"].includes(post.status)) {
    throw new HttpError(409, `Can't re-render a post that is ${post.status}`);
  }

  const brandQuery = post.brand_profile_id
    ? db.from("brand_profiles").select("*").eq("id", post.brand_profile_id).single()
    : db.from("brand_profiles").select("*").eq("is_default", true).limit(1).single();
  const { data: brand, error: brandErr } = await brandQuery;
  if (brandErr || !brand) throw new HttpError(500, "No brand profile found");

  const { data: rows, error: itemsErr } = await db
    .from("social_post_items")
    .select(
      "*, events_base(*, breweries(*)), " +
        "beer_releases_base(*, b1:breweries!beer_releases_brewery_id_fkey(*), " +
        "b2:breweries!beer_releases_brewery_id2_fkey(*), b3:breweries!beer_releases_brewery_id3_fkey(*)), " +
        "happy_hour_deals(*, breweries(*))",
    )
    .eq("post_id", post_id)
    .eq("included", true)
    .order("position", { ascending: true });
  if (itemsErr) throw new HttpError(500, itemsErr.message);
  if (!rows?.length) throw new HttpError(400, "No included items. Include at least one item.");

  // Turn each row into a DayItem (same formatting the draft used), keyed by the post item id.
  // deno-lint-ignore no-explicit-any
  const toDayItem = (r: any): { day: DayItem; brewery: any } | null => {
    const type = r.item_type ?? "event";
    if (type === "release" && r.beer_releases_base) {
      const rel = r.beer_releases_base;
      // Collabs list several breweries; the slide names just one (the same one the photo comes from).
      const primary = rel.b1 ?? rel.b2 ?? rel.b3 ?? null;
      const day = releaseToItem(rel);
      return { day: primary ? { ...day, brewery: breweryName(primary) } : day, brewery: primary };
    }
    if (type === "deal" && r.happy_hour_deals) {
      return { day: dealToItem(r.happy_hour_deals, post.post_date), brewery: r.happy_hour_deals.breweries };
    }
    if (type === "event" && r.events_base) {
      const e = r.events_base;
      return {
        day: {
          key: `event:${e.id}`, type: "event", id: e.id, brewery_id: e.brewery_id,
          brewery: breweryName(e.breweries), brewery_handle: null, title: e.title,
          sort_time: e.start_time, time_label: formatTime(e.start_time), meta: null,
          description: e.description ?? null, cost: Number(e.cost ?? 0) || 0,
          recurring: false, featured_by_brewery: !!e.featured,
        },
        brewery: e.breweries,
      };
    }
    return null; // source row was deleted
  };

  // Featured: the item flag; posts made before that existed fall back to highlight_event_ids.
  const legacy: string[] = post.highlight_event_ids ?? [];
  // deno-lint-ignore no-explicit-any
  const anyFlag = rows.some((r: any) => r.featured);
  // deno-lint-ignore no-explicit-any
  const isFeatured = (r: any) => anyFlag ? !!r.featured : legacy.includes(r.event_id);

  // deno-lint-ignore no-explicit-any
  const resolved = rows.map((r: any) => ({ r, x: toDayItem(r) })).filter((v: any) => v.x);
  // Starred items lead the carousel; every item gets its own photo slide.
  const featuredIds: string[] = resolved.filter(({ r }) => isFeatured(r)).map(({ r }) => r.id);

  const items: (SlideItem & { id: string })[] = resolved.map(({ r, x }) => {
    const d = x!.day;
    return {
      id: r.id,
      type: d.type,
      time: r.time_override || d.time_label,
      title: r.title_override || d.title,
      brewery: r.brewery_override || d.brewery,
      price: formatCost(d.cost),
      meta: d.meta,
      // one-line blurb on lineup slides (events + happy hours); older posts fall back to the description
      blurb: d.type === "release" ? null : (r.short_description ?? shortBlurb(d.description)),
      description: r.description_override || d.description || null,
      image: null, // filled in after planning, only for items that get a slide
    };
  });
  // Order comes from `position` (admin can reorder); slides group items by type.

  // Cover counts always reflect what's actually included.
  const cover = coverLine(resolved.map(({ x }) => x!.day));
  if (cover !== post.cover_line) await db.from("social_posts").update({ cover_line: cover }).eq("id", post_id);

  // Promo slides (see _shared/promos.ts): animated templates preferred; unknown URLs stay static.
  const promos = promoSlides(brand);
  const city = post.city ?? "Colorado Springs";

  /** Insert promo specs at their positions (template → kind:"promo", else kind:"static"). */
  const placePromos = (base: SlideSpec[]): SlideSpec[] => {
    const out = [...base];
    const toSpec = (p: Promo): SlideSpec =>
      p.kind === "template"
        ? {
          kind: "promo",
          variant: p.variant,
          city,
          cta: brand.cta_text || "Get the app · Link in bio",
          handle: brand.handle || "@hoppenings",
        }
        : { kind: "static", url: p.url };
    const placed = promos.filter((p) => p.position !== "last")
      .sort((a, b) => (a.position as number) - (b.position as number));
    for (const p of placed) out.splice(Math.min((p.position as number) - 1, out.length), 0, toSpec(p));
    for (const p of promos.filter((p) => p.position === "last")) out.push(toSpec(p));
    return out;
  };

  const planned = planSlides({
    postDate: post.post_date,
    city: post.city,
    coverLine: cover,
    items,
    featuredIds,
    cta: brand.cta_text,
    handle: brand.handle,
    staticTail: promos.length,
  });
  const slides = placePromos(planned);

  // Brewery photo for every item slide (image override on the item wins).
  // deno-lint-ignore no-explicit-any
  const byId = new Map(resolved.map((v: any) => [v.r.id, v]));
  const itemSlides = slides.filter((s): s is Extract<SlideSpec, { kind: "featured" }> => s.kind === "featured");
  await Promise.all(itemSlides.map(async (s) => {
    // deno-lint-ignore no-explicit-any
    const v: any = s.itemId ? byId.get(s.itemId) : null;
    if (!v) return;
    const value = v.r.image_override_url || breweryImageValue(v.x.brewery);
    s.item.image = await resolveImage(db, value);
  }));
  // Cover previews reuse the photos of the slides they tease.
  const imageById = new Map(itemSlides.map((s) => [s.itemId, s.item.image ?? null]));
  for (const s of slides) {
    if (s.kind !== "cover") continue;
    const hero = s.previews?.[0]; // only the hero card shows a photo
    if (hero) hero.image = imageById.get(hero.itemId) ?? null;
  }
  const leftOut = items.length - itemSlides.length;

  await db.from("social_posts").update({ status: "rendering", error: null, image_urls: [], slide_count: 0 }).eq("id", post_id);

  // Pass the caller's session along so render-slide passes the gateway JWT check.
  const slideHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: req.headers.get("Authorization") ?? `Bearer ${env("SUPABASE_ANON_KEY")}`,
  };

  const renderId = Date.now().toString(36); // new filenames each render -> no stale caches
  const fnUrl = `${env("SUPABASE_URL")}/functions/v1/render-slide`;

  try {
    // Render slides 2 at a time with retries. Firing all slides at once cold-starts many
    // workers in parallel, and each can hit the CPU limit (HTTP 546). Retries usually land
    // on a warm worker; the last attempt for a featured slide drops the photo so one heavy
    // image can't sink the whole post.
    const photoProblems: string[] = [];
    const renderOne = async (spec: SlideSpec, index: number): Promise<string> => {
      // Legacy campaign PNGs: use the URL as-is (no Satori render).
      if (spec.kind === "static") return spec.url;

      const attempts = 3;
      let lastErr = "";
      for (let attempt = 1; attempt <= attempts; attempt++) {
        const hasPhoto = (spec.kind === "featured" && !!spec.item.image) ||
          (spec.kind === "cover" && !!spec.previews?.some((pv) => pv.image));
        const noPhoto = attempt === attempts && hasPhoto;
        const res = await fetch(fnUrl, {
          method: "POST",
          headers: slideHeaders,
          body: JSON.stringify({ post_id, index, render_id: renderId, spec, brand, no_photo: noPhoto }),
        });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.url) {
          if (spec.kind === "featured" && out.photo_problem) {
            photoProblems.push(`${spec.item.brewery}: ${out.photo_problem}`);
          }
          if (spec.kind === "cover" && out.photo_problem) photoProblems.push(`cover previews: ${out.photo_problem}`);
          return out.url as string;
        }
        lastErr = `${res.status}${out.error ? ` ${out.error}` : ""}`;
        const retryable = res.status === 546 || res.status >= 500 || res.status === 429;
        if (!retryable) break;
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
      throw new Error(`Slide ${index + 1}: ${lastErr}`);
    };

    const urls: string[] = new Array(slides.length);
    const CONCURRENCY = 2;
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, slides.length) }, async () => {
      while (next < slides.length) {
        const i = next++;
        urls[i] = await renderOne(slides[i], i);
      }
    }));

    // slide_specs[i] <-> image_urls[i]. Promo templates use kind:"promo" so Remotion can animate.
    const done = { status: "pending_review", image_urls: urls, slide_count: urls.length, error: null };
    let { data: updated, error: updErr } = await db.from("social_posts")
      .update({ ...done, slide_specs: slides }).eq("id", post_id).select().single();
    if (updErr && /slide_specs/i.test(updErr.message)) {
      // slide_specs column not added yet: save the rest so the post still reaches review
      console.warn(`slide_specs not saved: ${updErr.message}`);
      ({ data: updated } = await db.from("social_posts").update(done).eq("id", post_id).select().single());
    }

    const warnings = photoProblems.length ? [`No photo on slide (${photoProblems.join("; ")})`] : [];
    if (leftOut > 0) {
      warnings.push(`${leftOut} item${leftOut === 1 ? "" : "s"} left off the carousel (star up to 7; cover + promo ads use the other slots).`);
    }
    return json({
      post_id, slide_count: urls.length, image_urls: urls, post: updated,
      ...(warnings.length ? { warning: warnings.join(" · ") } : {}),
    });
  } catch (e) {
    const msg = (e as Error).message;
    await db.from("social_posts").update({ status: "failed", error: `Render failed: ${msg}` }).eq("id", post_id);
    throw new HttpError(500, `Render failed: ${msg}`);
  }
});