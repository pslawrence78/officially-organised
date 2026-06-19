# The Lawrence Loop

A private, mobile-first, local-first family logistics PWA for the Lawrence family.

## Current implementation: Tranche 1

The application now provides a usable events foundation:

- React, TypeScript and Vite mobile-first PWA shell
- IndexedDB persistence through Dexie schema version 2
- create, read, update and delete workflows for standard events
- participants, responsible adults, categories, statuses, notes and all-day events
- lightweight reusable places with create, edit and delete workflows
- repository-enforced reference and form validation
- functional Today and Monday-to-Sunday Week views
- reusable event cards and a lightly operational dashboard
- local audit entries for event and place mutations
- generated offline service worker and static production build

Preparation tasks, car/resource needs, conflict detection, recurrence, template-driven creation and JSON import/export remain intentionally out of scope.

## Run locally

```bash
pnpm install
pnpm dev
```

## Verify

```bash
pnpm test
pnpm build
pnpm preview
```

Static hosts must serve `index.html` as the fallback for client-side deep routes. Installable PWA hosting also requires HTTPS.

## Next tranche

**Tranche 2: Operational Memory — preparation tasks.**
