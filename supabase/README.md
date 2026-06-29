# Supabase Setup

These scripts are for manual setup in the Supabase SQL Editor. They prepare the optional sync foundation only; the app remains local-first. Sync requires a signed-in Supabase user and still runs only when `Sync now` is pressed.

Run in this order:

1. `schema.sql`
2. `rls.sql`
3. `seed-dev.sql` only if you need local development notes

After running or changing SQL scripts, refresh the PostgREST schema cache if the Data API still reports old table or column metadata:

```sql
notify pgrst, 'reload schema';
```

## Supported RLS bootstrap path

The supported setup path is:

1. User signs in through Supabase Auth.
2. The app inserts `public.households` with `owner_user_id = auth.uid()`.
3. The app inserts the user's own `public.household_members` row with `role = 'owner'`.
4. RLS then allows that user to read/write `public.sync_entities` for the household.

The RLS script uses `SECURITY DEFINER` helper functions in the non-exposed `private` schema so membership checks do not recursively evaluate policies on `public.household_members`.

Frontend builds may use only:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Never put a service role key, database password, JWT secret or other privileged credential into the Vite app or GitHub Pages workflow.

For Supabase Authentication -> URL Configuration, include these redirect URLs:

- `https://www.lawnetcloud.uk/officially-organised/`
- `https://www.lawnetcloud.uk/officially-organised`
- `https://www.lawnetcloud.uk/officially-organised/**`
- `http://localhost:5173/**`
- `http://127.0.0.1:5173/**`

## Troubleshooting

### Table not found / schema cache

Error:

```text
Could not find the table 'public.households' in the schema cache
```

Likely causes: `supabase/schema.sql` was not run, the wrong Supabase project is configured, SQL failed part-way through, or the PostgREST schema cache has not refreshed.

Fix: run `supabase/schema.sql`, run `supabase/rls.sql`, then run:

```sql
notify pgrst, 'reload schema';
```

### Permission denied for households

Error:

```text
permission denied for table households
```

Likely cause: missing Data API grants to `authenticated`.

Fix: ensure `supabase/rls.sql` grants table privileges to `authenticated`. Do not grant Officially Organised sync table access to `anon`.

### New row violates RLS policy

Error:

```text
new row violates row-level security policy for table "households"
```

Likely causes: missing household bootstrap insert policy, the inserted row does not include `owner_user_id = auth.uid()`, or the app payload uses the wrong column name.

Fix: use the household insert policy in `supabase/rls.sql` and confirm the app inserts `owner_user_id`, not `ownerUserId`.

### Infinite recursion

Error:

```text
infinite recursion detected in policy for relation "household_members"
```

Likely cause: a `household_members` policy queries `household_members` directly.

Fix: use the `private.oo_is_household_member`, `private.oo_is_household_owner`, and `private.oo_can_write_household` `SECURITY DEFINER` helper functions from `supabase/rls.sql`.
