# Officially Organised

A private, mobile-first, local-first family logistics PWA for the Lawrence family.

## Current implementation: Tranche 8B

The application now includes local data safety tools and a cautious manual Supabase sync engine alongside recurring routines and one-off events:

- versioned JSON export of all persistent family data
- file and pasted-JSON import with validation and preview
- atomic restore protected by `RESTORE MY DATA`
- atomic reset and baseline reseed protected by `RESET OFFICIALLY ORGANISED`
- optional Supabase configuration via `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- local-only sync metadata, conflict review, household linking and a manual `Sync now` flow in Settings
- clear local-only and private-data warnings
- audit entries for export, restore and reset

Event CRUD, places, preparation, car needs, conflicts, routines, School Calendar and Family Countdown remain intact. IndexedDB is still the live source of truth. Realtime sync, background sync, merge import, external upload and encrypted exports remain out of scope.

## Run and verify

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

Static hosts must serve `index.html` as the fallback for client-side deep routes. Installable PWA hosting also requires HTTPS.

See [Tranche 8B documentation](docs/08B-local-first-supabase-sync-engine-v0.1.md).

## Suggested commit

```text
Add local-first Supabase sync engine
```
