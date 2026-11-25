#!/usr/bin/env node
/**
 * Copies supabase/functions/_shared/{events,slides,templates}.ts into
 * components/reels/shared/ for the Remotion reel. The Edge Function repo is
 * separate — pass the path to Brandon's updated _shared folder:
 *
 *   node scripts/sync-slide-templates.mjs /path/to/supabase/functions/_shared
 *
 * Never edit components/reels/shared/* by hand.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FILES = ['events.ts', 'slides.ts', 'templates.ts']
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const destDir = path.join(root, 'components/reels/shared')
const srcDir = process.argv[2]

if (!srcDir) {
  console.error('Usage: node scripts/sync-slide-templates.mjs <path-to-_shared>')
  process.exit(1)
}

const header = `// GENERATED — do not edit. Synced from supabase/functions/_shared via scripts/sync-slide-templates.mjs.
// Source: ${path.resolve(srcDir)}
`

fs.mkdirSync(destDir, { recursive: true })

for (const file of FILES) {
  const src = path.join(srcDir, file)
  if (!fs.existsSync(src)) {
    console.error(`Missing ${src}`)
    process.exit(1)
  }
  let text = fs.readFileSync(src, 'utf8')
  // Browser/bundler imports: drop .ts extensions from relative imports.
  text = text.replace(/from ["']\.\/([^"']+)\.ts["']/g, 'from "./$1"')
  // Strip a previous generated header if re-syncing.
  text = text.replace(/^\/\/ GENERATED[\s\S]*?\n(?=\/\/|import|export|type|interface|const|function)/, '')
  fs.writeFileSync(path.join(destDir, file), `${header}${text}`)
  console.log(`synced ${file}`)
}

console.log(`Wrote ${FILES.length} files to ${destDir}`)
