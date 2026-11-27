# Hoppenings social Edge Functions

Shared modules live in `_shared/`. Handlers are thin:

| Function | Shared deps |
|---|---|
| `build-draft` | common, events, items, llm, slides, promos |
| `render-post` | common, events, items, images, slides, promos |
| `render-slide` | common, slides, templates, render, webp |

`events`, `slides`, and `templates` are also used by the admin Remotion reel (`components/reels/shared/*` re-exports them). Edit those three in `_shared` only.

## Deploy

**Automated:** pushes to `main` that touch `supabase/functions/**` run
[`.github/workflows/deploy-edge-functions.yml`](../../.github/workflows/deploy-edge-functions.yml).
Needs repo secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`.

**Manual:**

```bash
supabase login
supabase functions deploy build-draft --project-ref idldjuxlvbgodkgfydyo
supabase functions deploy render-post --project-ref idldjuxlvbgodkgfydyo
supabase functions deploy render-slide --project-ref idldjuxlvbgodkgfydyo
```

JWT verification stays on (default). `render-post` forwards the caller's `Authorization` header to `render-slide`.

Do **not** add admin/auth checks inside these functions.
