#!/usr/bin/env node
/**
 * Obsolete: reels import supabase/functions/_shared/{events,slides,templates}.ts
 * directly via components/reels/shared/* re-exports (and the @ef-shared/* path alias).
 * Kept so old docs/commands fail loudly instead of copying stale files.
 */
console.error(
  "sync-slide-templates is retired. Edit supabase/functions/_shared/{events,slides,templates}.ts — reels re-export those modules.",
);
process.exit(1);
