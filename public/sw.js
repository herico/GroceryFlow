/* GroceryFlow service worker — offline-first app shell.
 * Dependency-free so it works regardless of the build tooling version.
 * The full list of built assets (all lazy route chunks included) is injected
 * at build time by scripts/generate-sw.mjs, so the whole app works offline
 * after a single online visit — no need to open every page first.
 * Strategy:
 *  - install: precache the entire app (shell + every asset chunk)
 *  - navigations: network-first, fall back to the cached app shell when offline
 *  - same-origin assets: stale-while-revalidate
 *  - cross-origin (fonts): cache-first
 */
const BUILD_ID = self.__BUILD_ID__ || 'dev'
const PRECACHE = self.__PRECACHE__ || ['./', './index.html', './manifest.webmanifest']
const CACHE = `groceryflow-${BUILD_ID}`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Individual adds (not addAll) so one missing file can't abort the whole
      // precache and leave the app without offline support.
      // NOTE: no skipWaiting() here — updates wait until the user opts to reload
      // (the client shows an "update available" prompt). On the very first install
      // there is no active worker, so it activates immediately regardless.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url)))),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Only handle real web traffic. Ignore chrome-extension://, data:, blob:, etc.
  // — the Cache API rejects those schemes and they aren't ours to cache anyway.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  // SPA navigations: try network, fall back to cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match('./index.html', { ignoreVary: true })
          .then((r) => r || caches.match('./', { ignoreVary: true })),
      ),
    )
    return
  }

  if (url.origin === self.location.origin) {
    // Same-origin assets: serve cache immediately, refresh in the background.
    event.respondWith(
      caches.match(request, { ignoreVary: true }).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone()
              caches
                .open(CACHE)
                .then((cache) => cache.put(request, copy))
                .catch(() => undefined)
            }
            return response
          })
          .catch(() => cached)
        return cached || network
      }),
    )
    return
  }

  // Cross-origin (e.g. Google Fonts): cache-first.
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((response) => {
            // Only cache successful or opaque (cross-origin, no-CORS) responses.
            if (response && (response.ok || response.type === 'opaque')) {
              const copy = response.clone()
              caches
                .open(CACHE)
                .then((cache) => cache.put(request, copy))
                .catch(() => undefined)
            }
            return response
          })
          .catch(() => cached),
    ),
  )
})
