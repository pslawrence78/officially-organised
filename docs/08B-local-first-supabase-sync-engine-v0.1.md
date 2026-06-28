# Tranche 8B: Local-First Supabase Sync Engine v0.1

Tranche 8B adds the first manual sync engine while keeping Officially Organised local-first. IndexedDB remains the operational source of truth for every page and repository. Supabase is an optional sync layer used only when the user signs in, links a household and presses `Sync now`.

## Sync architecture

- Local durable records are serialised from Dexie through `src/sync/syncSerialiser.ts`.
- Stable hashes are generated in `src/sync/syncHasher.ts`.
- Sync decisions are coordinated in `src/sync/syncEngine.ts`.
- Remote records are stored in the generic `sync_entities` envelope table.
- Local metadata lives in `syncSettings`, `syncDevices`, `syncState`, `syncQueue` and `syncConflicts`.

## Included durable stores

- `households`
- `familyMembers`
- `resources`
- `places`
- `events`
- `eventSeries`
- `templates`
- `settings`
- `schoolCalendars`
- `schoolHalfTermConfigs`
- `schoolReadinessPrepActions`
- `countdownTargets`

## Excluded stores

- `weatherForecasts`: transient third-party cache data
- `auditLog`: local audit trail, intentionally device-local and bounded
- `syncSettings`, `syncDevices`, `syncState`, `syncQueue`, `syncConflicts`: local sync metadata and review state
- service worker/cache state: browser-managed, not app-domain data

## Manual sync flow

1. Check Supabase configuration, auth session, linked household and online status.
2. Read all durable syncable local entities.
3. Hash and compare local records with saved sync state.
4. Pull remote envelopes for the linked household.
5. Apply safe remote changes when local data has not changed since the last sync.
6. Queue safe local pushes when the remote side has not changed since the last sync.
7. Create local conflict records when both sides changed differently.
8. Push queued upserts and tombstones.
9. Update local sync state, queue counts and conflict counts.

## Auth redirect handling

- Magic-link sign-in now derives its callback URL from the current origin plus `import.meta.env.BASE_URL`.
- The Sync settings panel shows the resolved redirect URL for debugging without exposing secrets.
- A temporary email/password sign-in option is available in the Sync panel for Supabase Auth testing when magic-link email limits are inconvenient.
- Supabase Authentication -> URL Configuration should include:
- `https://www.lawnetcloud.uk/officially-organised/`
- `https://www.lawnetcloud.uk/officially-organised`
- `https://www.lawnetcloud.uk/officially-organised/**`
- `http://localhost:5173/**`
- `http://127.0.0.1:5173/**`

## Conflict policy

- Same hash: no write, mark clean.
- Safe pull: apply remote locally.
- Safe push: upload local payload.
- Conflict: keep local operational data unchanged, do not overwrite cloud automatically, create a local conflict record for review.

## Conflict resolution

The Settings panel links to `/settings/sync` when open conflicts exist.

- `Keep local`: pushes the local payload to Supabase and resolves the conflict.
- `Keep cloud`: applies the remote payload locally and resolves the conflict.

There is no field-level merge or raw JSON editor in this tranche.

## Tombstones

- Local deletes are pushed as `deleted_at` tombstones in `sync_entities`.
- Remote tombstones delete the corresponding local record only when the local copy has not also diverged.
- Tombstone metadata remains in local sync state so deleted records do not reappear on the next sync.
- Local reset clears local sync metadata only. It does not wipe Supabase data.

## Import, export and reset interaction

- Export remains local-only and excludes sync metadata.
- Restore replaces durable local data, clears local sync metadata, and sets a warning that restored data has not yet been synced.
- Reset clears local app data plus local sync metadata, then reseeds the baseline local data.
- Neither restore nor reset deletes cloud data automatically.

## Known limitations

- Manual sync only. No realtime, no background sync and no periodic polling.
- Household linking is intentionally minimal.
- Conflict handling is record-level only.
- Sync still uses one linked household per device.
- Audit history is not synced.

## Manual testing checklist

- Configure or remove Supabase env vars and confirm Settings gating changes.
- Sign in, create or link a cloud household, then run `Sync now`.
- Create a local record and confirm it pushes.
- Seed a remote-only envelope and confirm it pulls.
- Change the same record locally and remotely and confirm a conflict appears.
- Resolve one conflict with `Keep local` and another with `Keep cloud`.
- Delete a record locally, sync, then confirm a tombstone is written remotely.
- Restore a backup and confirm the unsynced restore warning appears.

## Recommended next tranche

**8C Sync Polish and Production Hardening**: tighter migration handling, better household linking UX, richer conflict summaries, sync telemetry and optional guarded background sync.
