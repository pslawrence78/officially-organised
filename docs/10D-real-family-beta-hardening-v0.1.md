# Tranche 10D: Real Family Beta Hardening v0.1

## Summary

Tranche 10D hardens **Officially Organised** for real Lawrence family beta use without expanding the product boundary. The work adds a small private beta-readiness surface in Settings, safer diagnostics, a lightweight offline banner, a deterministic dense-week fixture, stronger route and schema guardrail coverage, and clearer backup and restore guidance.

The goal of this tranche is confidence, not new modules.

## What was hardened

1. Added `/settings/beta-readiness` for calm local diagnostics, safe copyable beta evidence, and a lightweight soak checklist.
2. Improved offline clarity with an app-shell banner while preserving the existing local-first model.
3. Tightened sync diagnostics copying so secrets, cloud IDs, and household content are not copied out.
4. Strengthened import/export wording to separate Supabase sync from JSON backup and restore.
5. Added a deterministic dense Lawrence week fixture for route, backup, and readiness coverage.
6. Added route smoke coverage across core shell routes, Hub routes, Settings subroutes, and safe fallbacks.
7. Added schema guardrail tests so new Dexie tables must be either exported or explicitly excluded.
8. Widened the shared operational event horizon so recent records still appear in prep, car, and hub-derived views during dense-week use.

## Files changed

Major code and test files touched in this tranche:

- `src/pages/BetaReadinessPage.tsx`
- `src/services/betaReadinessService.ts`
- `src/services/dataBoundaries.ts`
- `src/config/appVersion.ts`
- `src/app/routes.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/ExportPage.tsx`
- `src/pages/ImportPage.tsx`
- `src/components/sync/SyncSettingsPanel.tsx`
- `src/app/AppShell.tsx`
- `src/data/repositories/eventRepository.ts`
- `src/test/denseWeekFixture.ts`
- `src/app/routeSmoke.test.tsx`
- `src/data/schemaSafety.test.ts`
- `src/pages/BetaReadinessPage.test.tsx`
- `src/components/sync/SyncSettingsPanel.test.tsx`
- `src/app/routes.test.ts`
- `src/styles/globals.css`

## Data and schema impact

- Dexie schema changed: **No**
- Dexie schema version: **still 13**
- App data schema changed: **No**
- Export/import schema changed: **No**
- Export schema: **still `officially-organised-data-v5` / version 5**
- Sync registry changed: **No**
- Service worker behaviour changed: **No functional caching change**
  Reporting and offline clarity were improved, but the generated PWA/service worker strategy was not redesigned.

## Automated tests added or strengthened

- Beta-readiness page rendering, diagnostics copy, and checklist persistence
- Dense-week route smoke coverage for shell routes, Hub routes, and safe fallbacks
- Schema safety guardrails for export coverage and sync scope
- Sync diagnostics masking assertion
- Dense-week fixture reuse for round-trip and route hardening support

## Manual iPhone PWA soak checklist

Run this on a real iPhone using Safari and the installed Home Screen app. Codex did **not** complete these device checks from this environment.

1. Open the live app in Safari.
2. Use `Share -> Add to Home Screen`.
3. Launch the app from the Home Screen.
4. Confirm `Settings -> Beta readiness` shows `PWA standalone: Ready`.
5. Confirm the Dashboard loads.
6. Open and scan: Today, Week, Prep, Car, School, Routines, Household Admin, Settings, Hub, and Hub wallboard.
7. Create a quick event.
8. Edit that event.
9. Add or complete a prep item.
10. Fully close the PWA.
11. Reopen from the Home Screen.
12. Enable Airplane Mode or otherwise remove network access.
13. Reopen the PWA while offline.
14. Confirm the offline banner appears and existing local data still loads.
15. Add or edit local data while offline.
16. Reconnect network.
17. If Supabase is configured, confirm sync status recovers and `Sync now` becomes usable again.
18. Export a backup from the iPhone.
19. Rehearse restore only in a controlled test scenario.
20. Confirm no major route has document-level horizontal overflow, blocked bottom navigation, unusable tap targets, or keyboard/safe-area obstruction.

## Manual two-device Supabase validation runbook

This runbook assumes optional Supabase sync is already configured and both devices belong to the same household.

### Device A

1. Export a backup first.
2. Open `Settings -> Sync`.
3. Confirm Supabase is configured, signed in, and linked.
4. Create or update a harmless test event.
5. Create or update a prep action.
6. If present, create or update a household admin or renewal item.
7. Run `Sync now` or wait for the current manual workflow you are using.
8. Open `Settings -> Beta readiness` and copy beta diagnostics.

### Device B

1. Open `Settings -> Sync`.
2. Sign in and link the same household.
3. Run `Sync now`.
4. Confirm the harmless test event appears.
5. Confirm the prep action appears.
6. Confirm the household admin or renewal item appears if used.
7. Update one synced record.
8. Run `Sync now`.
9. Return to Device A and confirm the update is visible after another sync.

### Offline recovery check

1. On Device B, disable network access.
2. Edit one synced record locally.
3. Confirm local use continues.
4. Reconnect network.
5. Run `Sync now`.
6. Confirm Device A and Device B converge.
7. If a conflict is raised, review it through `Settings -> Sync` rather than deleting data manually.

### Scope notes

- Local-first data remains the live source for every route.
- Synced records are limited to the existing durable sync registry.
- Weather forecast cache remains excluded from sync.
- JSON backup and Supabase sync remain separate safety concepts.
- Beta diagnostics are technical only and do not include family schedule contents.

## Backup and restore rehearsal procedure

1. Export a fresh backup from `Settings -> Export backup`.
2. Save the file somewhere safe.
3. Open `Settings -> Import and restore`.
4. Validate the backup JSON.
5. Confirm the preview counts look correct.
6. Restore only in a controlled test environment or after a deliberate local reset scenario.
7. Confirm the app reloads with the expected records.
8. Confirm `Settings -> Beta readiness` shows the last export and current store counts.
9. Confirm `Settings -> Sync` shows restore pending review rather than auto-pushing restored data.
10. Export again after the rehearsal so there is a known-good post-rehearsal backup.

## Dense Lawrence week coverage

The deterministic fixture includes:

- School readiness through half-term config entries
- Seb gymnastics
- Seb swimming
- Beavers as a routine
- Beck Baby Group
- Phil Oracle office day
- Albert vet check
- A birthday party item with a long title
- A household admin renewal
- Car required and maybe-needed overlaps
- Open and completed prep work
- A quieter reminder-only day

Coverage uses that fixture for:

- Route smoke rendering
- Settings and diagnostics readiness checks
- Dense operational backup/import expectations

## Known limitations

- Real iPhone PWA validation was **not** completed from this environment.
- No real Supabase household credentials were used in automated tests.
- Browser-level overflow and touch-target validation remain limited to jsdom-friendly smoke coverage here.
- The production bundle still emits a large-chunk warning during `pnpm build`.
- Service worker status is reported only through browser-safe detection APIs, so some browsers may show `Unknown` or `Needs checking` rather than a definitive state.

## RC1 readiness notes

The app is materially more trustworthy for private family beta use after 10D:

- There is now an evidence surface for local diagnostics.
- Backup and restore wording is clearer and calmer.
- Dense-week data has explicit regression coverage.
- Core route rendering, schema boundaries, and copyable diagnostics are better protected.

Remaining RC1 work should focus on real-device acceptance and final polish rather than new features.

Recommended next tranche:

`RC1 - Release Candidate 1 Stabilisation and Final Acceptance v0.1`
