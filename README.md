# Officially Organised

Officially Organised is a private, mobile-first, local-first family logistics PWA for the Lawrence household.

Version: `1.0.0-rc.1`

## What it covers

The app is focused on practical family coordination:

- dashboard, today and week planning
- events, people, places, routines and templates
- prep tasks and family car visibility
- school readiness, school calendar support and weather-aware suggestions
- gifts, celebrations and household admin / renewals
- private local backup, restore and reset
- optional manual Supabase sync
- read-only Hub and wallboard routes for household display use

IndexedDB remains the live source of truth. Supabase sync stays optional. No analytics, telemetry, or public data-sharing services are included.

## Run

```bash
corepack pnpm install
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm dev
```

## Deployment

The hosted base path is:

```text
https://www.lawnetcloud.uk/officially-organised/
```

The app is configured for `/officially-organised/` in Vite and the PWA manifest. Static hosting still needs HTTPS and an `index.html` fallback for client-side routes.

## Release candidate status

RC1 is the final polish and readiness pass before real-device acceptance. See:

- [RC1 release candidate report](docs/RC1-officially-organised-release-candidate-v1.0.md)
- [Documentation index](docs/README.md)
- [Supabase configuration guide](docs/08-supabase-configuration-guide-v0.1.md)
- [Tranche 10D beta hardening](docs/10D-real-family-beta-hardening-v0.1.md)

## Known limits

- Real iPhone home-screen and install checks still need final acceptance on device.
- Live two-device Supabase rehearsal was not repeated in this RC1 pass.
- The production build still emits a large-chunk warning for the main application bundle.
