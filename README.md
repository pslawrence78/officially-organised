# Officially Organised — The Lawrence Loop

A private, mobile-first, local-first family logistics PWA for the Lawrence family.

## Current implementation: Tranche 3

The application now makes the shared family car visible alongside events and preparation:

- general embedded resource needs, with the family car as the first supported resource
- required, maybe needed and not-required states
- independent needed-from and needed-until windows
- optional allocation to Phil or Beck and practical resource notes
- a mobile car section inside event create/edit flows
- car requirement and window indicators on Today and Week event cards
- an upcoming Car view grouped into Today, Tomorrow, This week and Later
- Dashboard car counts and upcoming “Car watch” entries
- event-detail car context
- repository-level resource, time-window and adult-allocation validation
- resource-need audit entries for create, update and removal
- IndexedDB schema version 4 with safe migration of existing events

Conflict or overlap detection is intentionally not included. Tranche 3 records and displays the source data; the next tranche can calculate clashes deterministically from it.

Preparation tasks, event CRUD, places and the offline PWA foundation remain intact. Recurrence, template-driven creation, reminders and JSON import/export remain out of scope.

## Run and verify

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

Static hosts must serve `index.html` as the fallback for client-side deep routes. Installable PWA hosting also requires HTTPS.

## Suggested commit

```text
Tranche 3: implement shared car and resource needs
```
