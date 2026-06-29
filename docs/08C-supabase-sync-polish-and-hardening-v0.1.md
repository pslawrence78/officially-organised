# Tranche 8C: Supabase Sync Polish and Hardening v0.1

Tranche 8C hardens the optional Supabase sync experience without adding new product capability. The app remains local-first: IndexedDB is still the live operational source for dashboard, today, week, prep, hub and settings views.

## Implemented

- Sync Settings now shows clearer status for Supabase configuration, auth, cloud household link, enabled or paused state, last sync, last attempt, queued changes and open conflicts.
- A setup checklist makes readiness visible before sync is used.
- First cloud push requires explicit confirmation after practical privacy and backup guidance.
- Sync can be paused and resumed without removing local data or cloud link metadata.
- Disconnect this device removes local sync metadata only after typing `DISCONNECT THIS DEVICE`.
- Manual sync is blocked when sync is paused, first-sync guidance is not confirmed, the device is offline, the user is signed out, or no cloud household is linked.
- Sync diagnostics can be copied without Supabase URL keys, publishable keys, sessions or secrets.
- Diagnostics include app version, export schema, Dexie schema version, device ID, remote household ID, masked user email, duration and last pull/push/error counts where available.
- Sync errors are mapped to practical messages for configuration, sign-in, offline, RLS, missing remote schema, validation and unknown failure cases.
- Conflict review now shows entity type, record title, local/cloud timestamps, reason, Keep local, Keep cloud and Leave unresolved.
- Import, restore and reset copy now explains how those actions interact with sync and cloud data.
- Documentation now includes this tranche note, a Supabase configuration guide, GitHub Pages deployment guidance and a manual live verification checklist.

## Not Implemented

- No realtime subscriptions.
- No background or interval sync.
- No push notifications.
- No calendar import/export.
- No AI features.
- No multi-household admin.
- No invitations.
- No field-level conflict merging.
- No cloud wipe/delete-all flow.
- No Edge Functions.
- No analytics or telemetry.

## Privacy and Safety

Sync remains opt-in. Creating or linking a household does not automatically push the local dataset. The first push requires the first-sync confirmation panel and a manual `Sync now`.

The copied diagnostics are intentionally safe to share for support. They mask the signed-in email and do not include Supabase publishable keys, auth tokens, session payloads or raw record data.

Weather forecast cache and device-only sync metadata are not synced. Export remains local-only.

## Import, Restore and Reset

After restore, local data is marked as not yet synced and the user must press `Sync now` explicitly. Restored data is not auto-pushed.

Before reset, Settings explains that local reset does not delete cloud data. Reset clears this device's local sync metadata and reseeds baseline local records.

## Manual Verification Checklist

### Local Unconfigured

- Clear Supabase env vars.
- Build and run the app.
- Confirm the app boots.
- Confirm Sync Settings says Supabase is not configured.
- Confirm normal app routes still work.

### Local Configured, Signed Out

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Confirm Sync Settings shows configured.
- Confirm signed-out state is clear.
- Confirm no sync occurs until sign-in and manual action.

### Signed In and Linked

- Sign in.
- Create or link a cloud household.
- Export a JSON backup.
- Confirm first-sync guidance.
- Run `Sync now`.
- Confirm last sync status updates.
- Confirm queue count clears when records are pushed.

### Offline

- Put the browser offline.
- Confirm normal routes still work.
- Confirm `Sync now` is disabled.
- Confirm no repeated error spam appears.

### Conflict

- Simulate a local and remote difference where practical.
- Confirm a conflict is surfaced.
- Confirm conflict card/title is understandable.
- Resolve once with Keep local.
- Resolve once with Keep cloud.

### Production

- Build production.
- Preview production locally.
- Confirm no env value is rendered in diagnostics.
- Confirm deployed URL guidance is followed in Supabase Auth settings.

## Validation Recorded During Implementation

- `corepack pnpm typecheck`: passed.
- `corepack pnpm test src/components/sync/SyncSettingsPanel.test.tsx`: passed.
- Full test suite and production build should be run before merging or deployment.

## Known Limitations

- Household linking still uses the first remote membership available to the account.
- Conflict handling is record-level only.
- Sync uses one linked household per device.
- Last sync duration and counts are populated by new sync attempts only.
- Browser visual checks for iPhone/tablet/desktop should still be completed during release QA.

## Recommended Next Tranche

Tranche 8D should stay narrow: improve household linking and account recovery guidance only if needed after real Supabase trial use. Background sync, realtime and invitations should remain separate decisions.
