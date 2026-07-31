# GroceryFlow 🛒

A beautiful, fast, mobile-first grocery shopping list built with Vue 3, TypeScript, Tailwind CSS and Pinia.

## Features

- **Shopping lists** — create, rename, duplicate, archive and delete lists, with one-tap undo
- **Grocery items** — name, quantity, unit, category, estimated price, notes, favorite
- **Quick add** — full-width input that auto-detects the category from the item name (EN/ES/FR keywords + your own history)
- **Duplicate merge** — re-adding an item bumps its quantity instead of creating a second row
- **Swipe actions** — swipe an item right to pick it, left to delete (with undo)
- **Categories** — 15 built-in categories plus custom ones, with a searchable picker
- **Aisle order** — reorder categories to match your supermarket's layout
- **Manual reorder** — accessible up/down controls when sorting manually
- **Shopping mode** — collapsible categories that auto-fold once picked, checked items sink, a prominent "items left" counter, keep-screen-awake toggle, and a live progress bar
- **Estimated cost & budget** — per-item and list totals, picked vs. remaining breakdown, and a weekly-budget bar that warns as you approach or exceed it
- **Favorites** — frequently bought items for one-tap adding, with accurate usage counts
- **Search & sorting** — filter by name/category; sort by category, added order, alphabetical or manual
- **Appearance** — light / dark / system mode plus four accent themes, applied before first paint (no flash)
- **Languages** — full English, Spanish and French translations (`vue-i18n`)
- **Offline-first PWA** — installable, with a service worker that caches the app shell so it works with no connection; all data persists locally
- **Data backup** — export/import a JSON backup from Settings
- **Accessible** — visible focus states, modal focus-trap + Escape, live-region announcements, semantic progress bars, respects reduced-motion, and pinch-zoom is never disabled
- **Delightful touches** — haptic feedback and a check-off animation while shopping

## Tech stack

Vue 3 · TypeScript · Tailwind CSS v4 · Pinia · Vue Router · VueUse · Vue I18n · Vite · Vitest · Service Worker (PWA)

## Architecture

The UI never talks to persistence directly. A `StorageDriver` abstraction
(`src/services/storage.ts`) backs a generic `CollectionRepository`
(`src/services/repository.ts`), which the Pinia stores use. Swapping in a REST /
tRPC backend later requires no changes to the stores or components.

```
src/
├── components/   grocery · shopping · layout · ui
├── pages/        Home · List · Shopping · Favorites · Settings
├── stores/       lists · items · categories · favorites · settings
├── services/     storage driver + repositories
├── composables/  formatting + item sort/group helpers
├── i18n/         locale catalogs (en, es) + setup
├── types/        domain models
└── router/
```

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
npm test         # run the unit tests (Vitest)
```

## Roadmap & handoff

Planned work, known limitations, and technical notes for contributors live in
[HANDOFF.md](./HANDOFF.md). At a glance, the biggest deferred items are shared/synced
household lists (backend), a pantry / "buy again" surface, and recipe → list import.
