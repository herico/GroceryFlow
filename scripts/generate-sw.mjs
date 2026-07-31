// Post-build step: inject a precache manifest of every built asset into the
// service worker so the whole app (including lazy-loaded route chunks) is
// available offline after a single online visit. Runs after `vite build`.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { createHash } from 'node:crypto'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(root, 'dist')
const swSource = join(root, 'public', 'sw.js')
const swOut = join(distDir, 'sw.js')

/** Recursively list files under a directory, relative to distDir. */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(relative(distDir, full).split('\\').join('/'))
  }
  return out
}

const files = walk(distDir).filter((f) => f !== 'sw.js' && !f.endsWith('.map'))

// Root navigation + every asset, as scope-relative URLs.
const precache = Array.from(new Set(['./', ...files]))

// Content-addressed build id so a new deploy installs a fresh SW and the old
// cache is purged on activate.
const buildId = createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 12)

const header =
  `self.__BUILD_ID__ = ${JSON.stringify(buildId)};\n` +
  `self.__PRECACHE__ = ${JSON.stringify(precache)};\n`

writeFileSync(swOut, header + readFileSync(swSource, 'utf8'))

console.log(`[generate-sw] precached ${precache.length} entries (build ${buildId})`)
