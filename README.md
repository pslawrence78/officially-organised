# Officially Organised

A private, mobile-first, local-first family logistics PWA for the Lawrence family.

## Current implementation: Tranche 8A

The application now includes local data safety tools and an optional Supabase sync foundation alongside recurring routines and one-off events:

- versioned JSON export of all persistent family data
- file and pasted-JSON import with validation and preview
- atomic restore protected by `RESTORE MY DATA`
- atomic reset and baseline reseed protected by `RESET OFFICIALLY ORGANISED`
- optional Supabase configuration via `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- local-only sync metadata and a safe Sync panel in Settings
- clear local-only and private-data warnings
- audit entries for export, restore and reset

Event CRUD, places, preparation, car needs, conflicts, routines, School Calendar and Family Countdown remain intact. Automatic cloud sync, merge import, external upload and encrypted exports remain out of scope.

## Run and verify

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

Static hosts must serve `index.html` as the fallback for client-side deep routes. Installable PWA hosting also requires HTTPS.

See [Tranche 8A documentation](docs/08A-supabase-sync-foundation-v0.1.md).

## Suggested commit

```text
Add Supabase sync foundation
```
