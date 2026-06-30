# RC1: Officially Organised Release Candidate v1.0

## Purpose

RC1 is the final polish and readiness pass for Officially Organised before final real-device acceptance.

This pass focused on:

- documentation alignment
- release naming and version alignment
- final copy and empty/error states
- route and navigation safety
- deployment / PWA sanity
- one dedicated release-candidate validation suite

This pass did not add new product modules, new schemas, new sync models, analytics, notifications, or cloud-only behaviour.

## Release label

- Product name: `Officially Organised`
- Release label: `1.0.0-rc.1`

## What was polished

- Root and docs index now describe the current application honestly instead of the older tranche state.
- Settings now exposes app identity and version, and the user-facing readiness surface is labelled `Release readiness`.
- A compatibility route alias was added for `/household`, while `/household-admin` remains supported.
- A compatibility route alias was added for `/settings/release-readiness`, while `/settings/beta-readiness` remains supported.
- Shared loading and error copy was rewritten to be calmer and less technical.
- The not-found page now uses a clearer route-level message.
- Calendar and Car copy no longer read like unfinished future placeholders.
- PWA update-event naming was aligned away from the older internal product name.
- A dedicated `RC1ReleaseCandidate.test.tsx` suite now covers release-level route, copy, reset-guard, dense-week, and hosted-routing assertions.

## Routes audited

Automated route coverage now includes the main app shell, settings routes, Hub isolation, wallboard isolation, not-found handling, and dense-week route stability.

Routes verified in automated tests:

- `/`
- `/today`
- `/week`
- `/calendar`
- `/car`
- `/prep`
- `/school`
- `/celebrations`
- `/household`
- `/household-admin`
- `/people`
- `/people/:memberId`
- `/routines`
- `/templates`
- `/places`
- `/settings`
- `/settings/import`
- `/settings/export`
- `/settings/release-readiness`
- `/settings/beta-readiness`
- `/settings/sync`
- `/settings/school-calendar`
- `/settings/school-half-terms`
- `/settings/countdowns`
- `/hub`
- `/hub/wallboard`
- invalid routes through the not-found surface

## Validation commands run

The following commands were run successfully:

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Results:

- TypeScript passed.
- Tests passed: `63` files, `326` tests.
- Production build passed.
- The PWA build generated `dist/sw.js` and `dist/workbox-d191b065.js`.

## Built preview checks

A built-preview smoke pass was completed against a local static server serving `dist/` at:

```text
http://127.0.0.1:4275/officially-organised/
```

Routes manually opened in the in-app browser:

- `/`
- `/today`
- `/week`
- `/settings/release-readiness`
- `/hub`
- `/hub/wallboard`

Observed outcomes:

- The hosted `/officially-organised/` base path loaded correctly.
- Normal app routes kept the standard app shell.
- Hub and wallboard remained outside the standard app shell.
- Release-readiness copy and RC1 versioning rendered correctly.

## Manual checks completed

Completed in this environment:

- production build
- built-preview route smoke on desktop
- direct URL loading under `/officially-organised/`
- Hub and wallboard isolation check

Not completed in this environment:

- mobile viewport sweep at `390`, `430`, `768`, `1024`, `1440`
- no-horizontal-overflow review across those widths
- iPhone install / home-screen validation
- PWA install acceptance on device
- offline reopen smoke on the built preview
- import/export round-trip as a full manual rehearsal
- restore cancellation and reset cancellation as full manual UI rehearsals
- reduced-motion manual review
- two-device live Supabase sync rehearsal
- final Phil / Beck real-family smoke path

## Known limitations

- The production build still emits a large-chunk warning for the main application bundle:
  `assets/index-ClzizaNy.js` is over the default Vite chunk-size warning threshold.
- Real-device iPhone and home-screen checks remain outstanding.
- Live Supabase / multi-device verification remains outstanding for this RC1 pass.
- The current environment cannot honestly claim final real-family acceptance.

## Suggested final acceptance checklist for Phil

1. Launch the app locally and from the hosted deployment.
2. Check Dashboard, Today, Week, Car, Prep, School, Household Admin, Hub, and wallboard on iPhone.
3. Confirm no horizontal overflow at the main mobile widths you use.
4. Add or edit an event, then add and complete prep.
5. Export a backup and keep the file safely.
6. Rehearse restore and cancel safely before confirming a real restore.
7. Rehearse reset and cancel safely before confirming a real reset.
8. If sync is configured, confirm sign-in, household link, Sync now, and conflict review on real devices.
9. Check offline reopening from the iPhone home-screen install.
10. Confirm Hub and wallboard readability in the real household location.

## v1 readiness statement

Officially Organised is now at **v1.0 release-candidate readiness**.

That statement is supported by:

- passing TypeScript
- passing automated tests
- a passing production build
- successful dense-week and route-smoke validation
- intact import / export / reset protection checks in automated coverage
- sane hosted-base routing under `/officially-organised/`

Remaining acceptance still depends on:

- final real-device iPhone / PWA validation
- live device and optional Supabase rehearsal where applicable

## Final statement

Officially Organised is now at v1.0 release-candidate readiness, subject to final real-device iPhone/PWA acceptance and live Supabase/device checks where applicable.
