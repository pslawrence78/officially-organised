# Tranche 8A: Supabase Sync Foundation v0.1

Tranche 8A adds an optional Supabase foundation while keeping Officially Organised fully local-first. IndexedDB remains the operational source of truth and no family data is pushed, pulled, subscribed to, or synced automatically.

## Added

- Safe environment handling for `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Lazy Supabase client creation through `src/sync/supabaseClient.ts`.
- Light auth/session helpers in `src/sync/authService.ts`.
- Dexie schema version 10 with local-only `syncSettings`, `syncDevices`, and `syncState` metadata stores.
- A Settings Sync panel showing configuration, auth and local preparation status.
- Manual Supabase SQL scripts under `supabase/`.
- GitHub Pages build environment mapping for the two public Vite values.

## Not Added

- No sync engine.
- No realtime subscriptions.
- No automatic cloud backup.
- No push or pull of family records.
- No invite, role-management or household onboarding UI.
- No service role key, database password, JWT secret or other privileged secret in the client.

## Environment

Use placeholders locally in `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

The production GitHub Actions workflow reads these same names from repository secrets. Because this is a Vite client-side PWA, both values are exposed in the built bundle. Only the Supabase project URL and publishable key are suitable for this.

When either value is missing or invalid, the app boots normally, the Sync panel reports Supabase as unavailable, and no Supabase client is created.

## Supabase Project Setup

1. Create a Supabase project.
2. Configure Auth providers as needed. Email magic links are the lightest supported foundation.
3. Copy the project URL and publishable key into local `.env` or GitHub repository secrets.
4. Run `supabase/schema.sql` in the SQL Editor.
5. Run `supabase/rls.sql` in the SQL Editor.
6. Run `notify pgrst, 'reload schema';` if the Data API reports stale schema metadata.
7. Use `supabase/seed-dev.sql` only as a manual development note.

### Supabase Auth URL configuration

Under **Authentication -> URL Configuration**, include:

- `https://www.lawnetcloud.uk/officially-organised/`
- `https://www.lawnetcloud.uk/officially-organised`
- `https://www.lawnetcloud.uk/officially-organised/**`
- `http://localhost:5173/**`
- `http://127.0.0.1:5173/**`

## RLS Intent

Authenticated users can create a household only with `owner_user_id = auth.uid()`, then insert their own owner membership row. Owners can update/delete household metadata and manage membership. Members can read sync envelopes. Adults and owners can insert, update or delete sync envelopes. Audit rows are scoped to household members and an explicit `actor_user_id` must be null or the current user.

The RLS script uses `SECURITY DEFINER` helper functions in a non-exposed `private` schema for membership checks. This avoids recursive RLS evaluation when policies on `household_members` need to check whether the current user belongs to a household.

Live Supabase validation reached successful manual sync after applying this corrected SQL/RLS design. To reconcile a clean project, run `supabase/schema.sql`, then `supabase/rls.sql`, then refresh the schema cache if needed:

```sql
notify pgrst, 'reload schema';
```

## Troubleshooting

- `Could not find the table 'public.households' in the schema cache`: check that `supabase/schema.sql` ran in the correct project, then run `supabase/rls.sql` and `notify pgrst, 'reload schema';`.
- `permission denied for table households`: ensure `supabase/rls.sql` granted the minimum table privileges to `authenticated`; do not grant sync table access to `anon`.
- `new row violates row-level security policy for table "households"`: confirm the bootstrap insert policy exists and the app inserts `owner_user_id = auth.uid()`.
- `infinite recursion detected in policy for relation "household_members"`: ensure membership checks use the `private.oo_*` `SECURITY DEFINER` helpers rather than direct self-queries in `household_members` policy bodies.

## Local-First Safety

Sync metadata records are local IndexedDB records. The "Prepare this device for sync" toggle does not upload or download anything. Import, export, reset, dashboard, today, week, prep, school readiness and Hub workflows continue to use local data.

## Known Limitations

Supabase setup is manual. Sign-in is a foundation only and does not create household invitations or profile management. The generic `sync_entities` envelope is intentionally broad so a future Tranche 8B sync engine can evolve without remote schema churn.

Recommended next tranche: **8B Local-First Sync Engine**.
