# Tranche 10A: School Hub Consolidation v0.1

## Summary

Tranche 10A adds a dedicated `/school` route that consolidates school status, date-specific half-term readiness, weather-aware suggestions, deterministic school prep actions, setup gaps, and direct links back to the existing school configuration surfaces.

The goal is operational clarity rather than a new school-management domain. The new School Hub helps answer whether school is open, what Seb needs today and tomorrow, what is still missing, and where to update the underlying school setup.

## What was added

- A new `/school` route and School entry in the secondary navigation sheet.
- A derived `schoolHubService` that composes existing school readiness, weather, and school prep-action data into one deterministic page model.
- A mobile-first School Hub page with:
  - today and tomorrow summary cards
  - a compact upcoming readiness list
  - a setup-needed panel
  - an optional weather panel
  - outstanding school prep actions
  - management links back to existing school setup routes
- Route, page, and service tests covering setup-gap logic, action visibility, ordering, and the new navigation entry.

## Reused services and components

- `schoolReadinessService` for date-specific school status, lunch, attire, and Forest School derivation
- `schoolReadinessPrepActionService` for deterministic school prep generation and idempotent persistence
- `weatherService` for optional weather state and suggestion derivation
- Existing `SchoolPrepActionList` interactions for done, skip, and reopen behaviour
- Existing Settings routes for school calendar, half-term requirements, weather setup, and Prep

## Persistence and schema impact

- Dexie schema change: none
- Import/export schema change: none
- Supabase sync registry change: none

The hub is entirely derived from existing stores and reuses the existing school prep-action persistence.

## Routes added

- `/school`

## Key files changed

- `src/services/schoolHubService.ts`
- `src/pages/SchoolPage.tsx`
- `src/components/school/SchoolDaySummaryCard.tsx`
- `src/components/school/SchoolSetupGapCard.tsx`
- `src/components/school/SchoolWeatherPanel.tsx`
- `src/components/school/SchoolConfigLinks.tsx`
- `src/app/routes.tsx`
- `src/app/AppShell.tsx`
- `src/services/schoolHubService.test.ts`
- `src/pages/SchoolPage.test.tsx`

## Validation commands run

- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Known limitations

- The hub still depends on the existing school calendar and half-term setup coverage; when those are missing it can only point back to the source configuration pages.
- Weather suggestions remain optional and only surface what the existing weather service can already provide.
- The management links stay route-level rather than deep-linking to embedded sections inside Settings.

## Explicit non-goals

- No homework, messages, school inbox, or school portal integration
- No new recurring school-rule inference for lunch, PE, or Forest School
- No push notifications
- No schema or sync redesign
