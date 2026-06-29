# Supabase Configuration Guide v0.1

This guide explains how to configure Supabase for Officially Organised. It is a setup guide, not proof that any live project has been configured.

## 1. Create Supabase Project

Create a Supabase project in the Supabase dashboard. Keep the project URL and publishable key available for environment variables. Do not commit real credentials.

## 2. Configure Auth Provider

Enable email authentication. Magic links are supported by the app. Email/password sign-in is available in Settings for practical testing.

## 3. Add Site URL and Redirect URLs

In Supabase Authentication -> URL Configuration, set the production Site URL to the deployed app URL.

Allowed redirect URLs should include:

```text
http://localhost:5173/**
http://127.0.0.1:5173/**
https://www.lawnetcloud.uk/officially-organised/
https://www.lawnetcloud.uk/officially-organised
https://www.lawnetcloud.uk/officially-organised/**
```

If a custom domain is used, add both the exact app URL and a wildcard path for that domain. Do not remove localhost URLs while local validation is still needed.

## 4. Run Schema SQL

Run `supabase/schema.sql` in the Supabase SQL editor for the target project.

## 5. Run RLS SQL

Run `supabase/rls.sql` after the schema script. This enables row-level security and grants access only through authenticated household membership.

If the Data API reports stale schema information, run:

```sql
notify pgrst, 'reload schema';
```

## 6. Create First Phil Account

Use the app's Sync Settings sign-in controls or Supabase Auth dashboard to create/sign in the first Phil account. The first account should create the cloud household from the device after local data is reviewed.

## 7. Create or Link Household

In Settings:

1. Confirm Supabase is configured.
2. Sign in.
3. Create cloud household from this device, or link the first existing remote household membership.
4. Export a JSON backup before first sync.
5. Confirm first-sync guidance.
6. Press `Sync now`.

## 8. Beck Account Path

This tranche does not add invitations or account administration. Beck account setup should be done by adding an authenticated household membership in Supabase once the account exists, then signing in on Beck's device and linking the household. Treat this as an operator-assisted path until a future tranche implements invitations.

## 9. Set Local `.env`

Use `.env.local` for local development:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The app reads these at build/dev-server time. Restart Vite after changes.

## 10. Set Production Deployment Environment Variables

For GitHub Pages via GitHub Actions, set repository or environment variables/secrets for:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Use GitHub repository Settings -> Secrets and variables -> Actions. Do not hard-code project IDs or credentials into source files.

## 11. Run Local Validation

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

Then open Settings and confirm Supabase status, auth redirect URL and first-sync guidance.

## 12. Perform First Backup

Before the first push, go to Settings -> Export backup and download a JSON backup. Store it somewhere private.

## 13. Perform First Sync

Return to Settings:

1. Confirm first-sync guidance.
2. Press `Sync now`.
3. Confirm last sync status, pull count, push count and queue count update.
4. Copy diagnostics and confirm no keys or tokens appear.

## 14. Check RLS

Use a second test account without household membership. Confirm it cannot see another household's rows in `sync_entities`. If unauthorised data is visible, stop and review `supabase/rls.sql` before real use.

## GitHub Pages Notes

The Vite `base` path and Supabase redirect URLs must agree with the deployed path. Static hosting must serve `index.html` for client-side routes. The deployed app must be HTTPS for installable PWA behavior and Supabase Auth redirects.
