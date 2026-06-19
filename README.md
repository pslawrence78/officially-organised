# Officially Organised — The Lawrence Loop

A private, mobile-first, local-first family logistics PWA for the Lawrence family.

## Current implementation: Tranche 2

The application now provides operational memory alongside its event foundation:

- embedded preparation tasks owned by their events
- add, edit and delete prep tasks inside event create/edit flows
- open, done and skipped statuses with tick-off from event detail, Dashboard and Prep
- normal, important and critical priorities
- Phil, Beck, both or genuinely unassigned ownership
- optional British-friendly due date/time, blocking flag and notes
- a dedicated Prep view grouped into Overdue, Today, Tomorrow, This week, Later and No due date
- owner filtering, summary counts and critical/overdue styling
- open and critical prep indicators on Today and Week event cards
- repository validation and task-level audit entries
- IndexedDB schema version 3 with safe migration of existing events

Car/resource needs, conflict detection, recurrence, template-driven prep, reminders and JSON import/export remain intentionally out of scope.

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

## Suggested commit messages

For the preceding tranche:

```text
Tranche 1: implement events foundation
```

For this tranche:

```text
Tranche 2: implement operational preparation memory
```
