# Supabase Setup

These scripts are for manual setup in the Supabase SQL Editor. They prepare the optional sync foundation only; the app remains local-first and does not push or pull family data in Tranche 8A.

Run in this order:

1. `schema.sql`
2. `rls.sql`
3. `seed-dev.sql` only if you need local development notes

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
