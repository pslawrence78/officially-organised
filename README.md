# Officially Organised

A private, mobile-first, local-first family logistics PWA for the Lawrence family.

## Current implementation: Tranche 10B

The application now includes local data safety tools, a cautious manual Supabase sync engine, a dedicated School Hub, and a bounded Household Admin and Renewals module alongside recurring routines, one-off events, and Gifts and Celebrations readiness:

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
- secondary `/household-admin` route for renewals, services, cover reviews, and practical household checks
- deterministic household-admin due-state derivation with completion, renewal, booking, and archive flows
- bounded Household Admin Watch surfacing on Dashboard, Today, and Week
- clear local-only and private-data warnings
- audit entries for export, restore and reset

Event CRUD, places, preparation, car needs, conflicts, routines, School Calendar and Family Countdown remain intact. IndexedDB is still the live source of truth. Household Admin adds a new durable store, export payload coverage, and sync registration, but remains intentionally narrow: no chores, no shopping, no document storage, and no payments. Realtime sync, background sync, merge import, external upload, invitations, cloud wipe and encrypted exports remain out of scope.

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

See [Tranche 10B documentation](docs/10B-household-admin-and-renewals-foundation-v0.1.md), [Tranche 10A documentation](docs/10A-school-hub-consolidation-v0.1.md), [Tranche 9B documentation](docs/09B-gifts-and-celebrations-readiness-v0.1.md), and the [Supabase configuration guide](docs/08-supabase-configuration-guide-v0.1.md).

## Suggested commit

```text
Add household admin and renewals foundation
```
