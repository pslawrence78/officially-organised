# Tranche 7 — Import, Export and Local Data Safety v0.1

## What was built

Officially Organised now provides manual, local JSON backup and restore tools under Settings. Export shows a record summary and privacy warning before downloading. Import accepts a JSON file or pasted JSON, validates without writing, previews current-versus-backup counts, and restores only after exact phrase confirmation. Reset is separately protected and reseeds baseline records.

## Export schema

Schema identifier: `officially-organised-data-v1`; schema version: `1`.

The envelope includes source app, export ID, ISO export timestamp, app version, database version, record counts and a `data` object. The human-readable filename is `officially-organised-backup-YYYY-MM-DD-HHmm.json`.

Included stores: `households`, `familyMembers`, `resources`, `places`, `events`, `eventSeries`, `templates`, `settings`, `schoolCalendars`, `countdownTargets`, and `auditLog`.

Derived conflicts, UI state, caches and service-worker data are excluded.

## Validation

Validation checks JSON and envelope structure, schema/version support, required store arrays and fields, missing/duplicate IDs, recognised enum values, strict dates and timestamps, event ordering, school periods and closures, countdown dates, occurrence exceptions, and references among events, members, places, resources, templates, routines, school calendars and countdown sources. Issues contain severity, code, readable message, path and optional related ID.

Record-count mismatches are warnings because preview counts are recalculated from actual data. Any validation error blocks restore.

## Restore and reset

Restore mode replaces all supported stores; merge is not supported. Before restore, the service creates an in-memory export of current data. Dexie clears and repopulates all stores in one transaction, then appends a restore audit entry. Transaction failure rolls back the write.

Restore confirmation: `RESTORE MY DATA`.

Reset clears the same stores and inserts baseline household, members, resources, templates, school calendar, countdowns, settings and audit entry in one transaction. Repeated reset does not duplicate seeds.

Reset confirmation: `RESET OFFICIALLY ORGANISED`.

## Privacy and limitations

All work happens inside the browser; no backend, analytics, telemetry or upload was added. Exported JSON is unencrypted and may reveal private schedules, locations and travel plans, so users are warned to store it safely.

Backup and restore remain manual and device-local. There is no cloud sync, multi-device merge, password protection, persistent backup history or merge import. Clearing browser storage can still destroy data that has not been exported.

## Validation results

- TypeScript typecheck: passed.
- Automated tests: 128 passed across 27 files, including validation, UI gating, reset and round-trip restore.
- Production build: passed (Vite emitted the existing advisory that the main chunk exceeds 500 kB).
- Browser visual QA: not run because local dev-server approval was unavailable in the execution environment; responsive layouts use the existing mobile-first breakpoints and are covered structurally by UI tests.

## Principal files changed

- `src/types/importExport.ts`
- `src/services/importExportService.ts`
- `src/pages/ExportPage.tsx`
- `src/pages/ImportPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/styles/globals.css`
- Tranche 7 service and page tests

## Recommended next tranche

Tranche 8 — Mobile PWA Hardening and Release Readiness v0.1.
