# Officially Organised — The Lawrence Loop

A private, mobile-first, local-first family logistics PWA for the Lawrence family.

## Current implementation: Tranche 6

The application supports recurring family routines alongside one-off events:

- weekly, fortnightly and monthly event series
- start/end limits and school-calendar-aware term-time filtering
- virtual occurrences across Dashboard, Today, Week, Car, Prep, People and conflicts
- occurrence cancellation, movement, responsibility and car overrides
- durable generated prep completion without changing future routine defaults
- mobile-first routine creation and editing
- the existing IndexedDB version 6 `eventSeries` store, with no schema upgrade

Event CRUD, places, preparation, car needs, live conflicts, School Calendar and Family Countdown remain intact. Calendar sync, notifications, accounts and backend storage remain out of scope.

## Run and verify

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

Static hosts must serve `index.html` as the fallback for client-side deep routes. Installable PWA hosting also requires HTTPS.

## Suggested commit

```text
Add routines and recurrence support
```
