# GroceryFlow — Engineering Handoff

_Last updated: 2026-07-30_

This document is for whoever picks up GroceryFlow next. It summarizes the current
state, how the non-obvious parts work, what is intentionally **not** built yet, and
a prioritized roadmap.

---

## 1. Current status

GroceryFlow is a mobile-first, offline-capable grocery list PWA. It is a
**single-device, local-only** app (data in `localStorage`) — there is no backend.

- **Type-safe:** `npm run build` (runs `vue-tsc`) is clean.
- **Tested:** `npm test` (Vitest) — 25 unit tests pass (formatting, sorting,
  category guessing, store logic incl. duplicate-merge & favorite counting, backup parsing).
- **Offline:** installable PWA; a single online visit precaches the whole app, then
  every screen works offline (verified end-to-end).

### Recently completed (this pass)
Bug/dead-feature fixes (weekly budget wired up, manual sort made functional,
favorite-count inflation fixed, duplicate-item merge, NaN sanitizing, unit
pluralization), accessibility (zoom re-enabled, contrast, modal focus-trap/Escape,
focus-visible, live-region toasts, progressbar semantics, reduced-motion),
mobile UX (full-width quick-add + auto-categorization, swipe actions, reorder
controls, aisle order, shopping "items left" + wake-lock + auto-collapse,
price memory), light/dark/system appearance, data export/import, haptics,
performance (debounced writes, precomputed stats), a full offline PWA,
**cross-list global search**, **bulk actions** (multi-select mark/recategorize/delete),
a **storage schema-versioning + migration** framework, and a **service-worker
"update available" reload prompt**.

---

## 2. Orientation for a new developer

**Stack:** Vue 3 (`<script setup>`) · TypeScript · Pinia · Vue Router (hash) ·
Tailwind CSS v4 · Vue I18n · VueUse · Vite · Vitest.

```
src/
├── components/   grocery · shopping · layout · ui
├── pages/        Home · List · Shopping · Favorites · Settings
├── stores/       lists · items · categories · favorites · settings · notifications
├── services/     storage driver · repository · theme · backup · category data + keyword guesser
├── composables/  useFormat · useItemSort · useWakeLock
├── i18n/         en · es · fr (es/fr are typed against en)
└── router/
```

### Things that are easy to get wrong
- **i18n is type-checked.** `es.ts` and `fr.ts` are declared `typeof en`. If you add
  a key to `en.ts`, you **must** add it to `es.ts` and `fr.ts` or the build fails.
- **Persistence seam.** UI/stores never touch `localStorage` directly. They go through
  `CollectionRepository` (`src/services/repository.ts`) backed by a `StorageDriver`
  (`src/services/storage.ts`). This is the seam a backend plugs into (see §4).
- **Theming.** Accent color = `data-theme` on `<html>`; light/dark = `data-mode`.
  An inline script in `index.html` sets both before first paint (no flash);
  `src/services/theme.ts` manages runtime changes and the system-preference listener.
- **Offline/PWA.** `public/sw.js` is a hand-written service worker (no
  `vite-plugin-pwa`, deliberately — the toolchain is on a very new Vite). The full
  precache manifest is injected at build time by `scripts/generate-sw.mjs`
  (wired into `npm run build`). Registration happens in `src/main.ts` **PROD only**.
  The dev server does not register the SW so HMR keeps working.

---

## 3. Known limitations & caveats

- **No multi-device / sync.** Data lives only in this browser's `localStorage`.
  Clearing site data wipes everything (mitigate with Settings → Export backup).
- **First visit must be online** for offline to work (that's when the SW installs
  and precaches). Documented behavior.
- **`localStorage` quota (~5 MB).** Fine for normal use; very large datasets should
  move to IndexedDB (see §5). Quota write failures now surface a warning toast but
  data beyond the limit won't persist.
- **Manual reorder is via up/down buttons**, not drag-and-drop (accessible + robust;
  drag is a possible enhancement).
- **Favorites are keyed by lowercased name.** Two different products that share a name
  collide. A stable id / per-list identity would be more correct.
- **No storage schema versioning.** If the data model changes, old persisted blobs are
  read as-is. Add a version + migration before shipping breaking model changes (see §5).
- **SW update strategy is `skipWaiting` + `clients.claim()`.** In the rare case of a new
  deploy while a tab is open and offline, a not-yet-loaded old chunk could be purged.
  Acceptable for now; consider a "new version available — reload" prompt instead.

---

## 4. The backend / sync work (explicitly deferred)

This is the single highest-impact future feature (shared household lists) and was
left out of the current pass on purpose.

**Where it plugs in:** `CollectionRepository` in `src/services/repository.ts`.
Today `all()` / `saveAll()` are **synchronous**. A real REST/tRPC/Firebase backend is
async, so before wiring a backend:

1. Make the repository **async-shaped** (`all(): Promise<T[]>`, `saveAll(): Promise<void>`)
   and update the stores to hydrate asynchronously. The stores are the only consumers.
2. Add optimistic local writes + background sync, and a conflict strategy
   (last-write-wins is the cheap start; per-field merge is nicer for shared editing).
3. Add auth + a "household" concept (list ownership / sharing).
4. Once a backend exists, the service worker can add **background sync** for offline edits.

Keep the offline-first local store as the source of truth for the UI; treat the backend
as a sync target so the app stays fast and works offline.

---

## 5. What's left to build / improve (prioritized)

### P1 — High value, moderate effort
- **Pantry / "Buy again"** — evolve the Favorites tab into a pantry surface: track
  staples, one-tap add-to-list, and a "buy again" strip seeded from archived lists.
  Reuses the favorites/items stores. (Biggest product whitespace.)

_Done since first handoff: cross-list global search, bulk actions (multi-select
mark/recategorize/delete), storage schema-versioning + migration framework, and the
service-worker "update available" reload prompt._

### P2 — Larger or nice-to-have
- **Recipes → auto-list & meal planning** — paste/store a recipe, add all ingredients at once.
- **Drag-and-drop reorder** — upgrade the up/down controls (`ItemCard` already has a
  `reorderable` mode) to pointer drag; keep the buttons for a11y.
- **Price history** — track last N prices per product to show "you usually pay ~X" and
  flag pricier-than-usual (extends the `favorites`/item price memory already present).
- **IndexedDB storage driver** — implement a second `StorageDriver` for larger datasets;
  the interface already exists, so it's a drop-in.
- **Virtualization** — for very large lists / thousands of archived lists, virtualize the
  item/list rendering.

### P3 — Innovative / optional (watch for bloat)
- **Voice / NLP quick-add** — "2 milk, bread, 6 eggs" parsed into items.
- **Low-stock & expiry reminders** — needs the pantry model + notification permission.
- **More languages** — the i18n catalogs and the keyword guesser
  (`src/services/categoryKeywords.data.ts`) can be extended.
- **Split-the-bill** among household members (post-backend).

---

## 6. Testing gaps

Current tests cover pure logic and the previously-buggy store paths. Worth adding:
- **Component tests** (`@vue/test-utils` is installed) for `ItemCard` swipe/reorder,
  `BaseSheet` focus-trap/Escape, `QuickAdd` auto-categorization, `BudgetBar` states.
- **Store tests with Pinia** for `groupByCategory` ordering (custom aisle order),
  category delete → reassign, and lists archive/restore/duplicate.
- **An automated a11y pass** (e.g. axe) and a manual screen-reader smoke test.
- **A tiny e2e** (Playwright) for the create-list → add item → shop → complete flow,
  plus an **offline** scenario.

---

## 7. Roadmap at a glance

| Improvement | User value | Effort | Priority |
|---|---|---|---|
| Shared/synced household lists (backend) | Very High | High | P0 (separate track) |
| Pantry + "Buy again" | High | Medium | P1 |
| Recipes → auto-list | High | High | P2 |
| Drag-and-drop reorder | Medium | Medium | P2 |
| Price history / trends | Medium | Medium | P2 |
| IndexedDB driver | Medium | Medium | P2 |
| List/row virtualization | Low–Medium | Medium | P2 |
| Voice / NLP add | Medium | High | P3 |
| Low-stock / expiry reminders | Medium | High | P3 |

---

## 8. Commands

```bash
npm install       # install dependencies
npm run dev       # dev server (:5173) — no service worker (HMR-friendly)
npm run build     # type-check + build + inject SW precache manifest
npm run preview   # serve the production build (test PWA/offline here)
npm test          # Vitest unit tests
```

**Offline testing:** `npm run build && npm run preview`, open the preview once online,
then toggle DevTools → Network → Offline and navigate — everything should work.
