# Officially Organised

A private, mobile-first, local-first family logistics PWA for the Lawrence family.

## Current implementation: Tranche 9B

The application now includes local data safety tools, a cautious manual Supabase sync engine, and a bounded Gifts and Celebrations operational module with derived readiness alongside recurring routines and one-off events:

- versioned JSON export of all persistent family data
- file and pasted-JSON import with validation and preview
- atomic restore protected by `RESTORE MY DATA`
- atomic reset and baseline reseed protected by `RESET OFFICIALLY ORGANISED`
- optional Supabase configuration via `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- local-only sync metadata, conflict review, household linking, derived auth redirect handling, first-sync confirmation, pause/resume, disconnect-device, diagnostics, and a manual `Sync now` flow in Settings
- corrected Supabase SQL/RLS setup for authenticated household bootstrap and manual sync
- secondary `/celebrations` route for compact celebration occasions and gift plans
- deterministic gift-plan prep-task generation flowing into the existing Prep system
- deterministic celebration-readiness scoring and issue derivation from existing occasion, gift-plan, event, and prep-task records
- bounded celebration-readiness surfacing on `/celebrations`, Dashboard, Today, and Week
- `Celebrations` labelling/filtering for generated gift and celebration prep work
- event-detail linking for Gifts and Celebrations context with safe fallback rendering
- clear local-only and private-data warnings
- audit entries for export, restore and reset

Event CRUD, places, preparation, car needs, conflicts, routines, School Calendar and Family Countdown remain intact. IndexedDB is still the live source of truth. Celebration readiness is derived from existing local records, so no new readiness store, export payload, or sync registry was added in Tranche 9B. Realtime sync, background sync, merge import, external upload, invitations, cloud wipe and encrypted exports remain out of scope.

Live Supabase validation reached successful manual sync after applying the corrected SQL/RLS design in `supabase/schema.sql` and `supabase/rls.sql`. Run both scripts and refresh the schema cache with `notify pgrst, 'reload schema';` if the Supabase Data API reports stale schema metadata.

## Run and verify

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

Static hosts must serve `index.html` as the fallback for client-side deep routes. Installable PWA hosting also requires HTTPS.

See [Tranche 9B documentation](docs/09B-gifts-and-celebrations-readiness-v0.1.md), [Tranche 9A documentation](docs/09A-gifts-and-celebrations-foundation-v0.1.md), [Tranche 8C documentation](docs/08C-supabase-sync-polish-and-hardening-v0.1.md), and the [Supabase configuration guide](docs/08-supabase-configuration-guide-v0.1.md).

## Suggested commit

```text
Add gifts and celebrations readiness
```
