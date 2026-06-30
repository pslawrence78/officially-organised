# Tranche 10C: Mobile Capture and Daily Use Friction Pass v0.1

## Summary

This tranche adds a shared quick-capture path, reduces form density across Event and Routine entry, and tightens the Dashboard for faster mobile scanning. The implementation keeps the existing Event, Routine and Household Admin models intact and routes capture into those established flows rather than creating parallel records or new modules.

## Scope delivered

- Shared quick-capture entry from the shell and Dashboard.
- Explicit Event, Routine and Admin/Renewal chooser with calm decision copy.
- Event quick save and Admin/Renewal quick save with safe defaults.
- Event form prefill from quick capture and a lighter sectioned layout.
- Routine form grouping so recurrence fields appear before lower-frequency details.
- Household Admin prefill from quick capture with clearer copy about when the surface should be used.
- Dashboard hero updated to emphasise quick capture and at-a-glance summary chips.
- Mobile-friendly floating Add action with safer spacing above bottom navigation.
- Tests covering quick capture entry points and prefill paths.

## Files changed

- `src/app/AppShell.tsx`
- `src/app/AppShell.test.tsx`
- `src/components/capture/QuickCaptureSheet.tsx`
- `src/components/events/EventForm.tsx`
- `src/components/routines/SeriesForm.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/DashboardPage.test.tsx`
- `src/pages/EventFormPage.tsx`
- `src/pages/EventFormPage.test.tsx`
- `src/pages/HouseholdAdminPage.tsx`
- `src/pages/HouseholdAdminPage.test.tsx`
- `src/services/quickCaptureService.ts`
- `src/styles/globals.css`
- `docs/README.md`

## UX decisions

- Quick capture lives in the existing shell so it is available from high-frequency daily routes without adding another top-level module.
- Event and Admin/Renewal support direct "Save now" behaviour because the defaults are deterministic and low-risk.
- Routine capture always supports "Continue" into the full routine form because recurrence needs a clearer review step than a one-tap save.
- Event and Routine forms now keep core fields visible first and move place, car, prep and notes into disclosures that open automatically when existing data is present.
- Household Admin copy now more clearly tells the user when to use Admin/Renewal rather than Events.

## Data/schema impact

- No Dexie schema change.
- No domain model additions.
- New quick-capture state is transient router/component state only.

## Sync/import/export impact

- No import/export schema changes.
- No Supabase sync registry changes.
- No cloud schema or RLS changes.

## Tests run

- `corepack pnpm typecheck`
- `corepack pnpm build`
- `corepack pnpm test`

## Manual QA notes

- Automated validation completed for typecheck and production build.
- Manual responsive/browser QA was not completed in this run.

## Known limitations

- `corepack pnpm test` still has existing unrelated failures in repository and hub-service tests:
  - `src/data/repositories/eventRepository.test.ts`
  - `src/data/repositories/prepTaskRepository.test.ts`
  - `src/data/repositories/resourceNeedRepository.test.ts`
  - `src/services/hubService.test.ts`
- Routine quick capture intentionally routes into the full routine form instead of one-tap saving, to avoid hidden recurrence assumptions.
- Household Admin still uses its existing single-page edit surface; this tranche improves entry and copy rather than splitting that flow into new routes.

## Suggested next tranche

Focus on a follow-up responsive QA and workflow hardening pass:

- Manual viewport verification across Dashboard, Today, Week, Prep, Car, Routines and Household Admin.
- Smaller dashboard-card information density reductions beyond the hero area.
- Targeted clean-up of the unrelated failing repository and hub-service tests so validation returns to green.
