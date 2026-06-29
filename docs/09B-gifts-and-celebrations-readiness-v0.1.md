# Tranche 9B: Gifts and Celebrations Readiness v0.1

## Summary

Tranche 9B adds a deterministic readiness layer on top of the bounded Gifts and Celebrations foundation.

The feature helps the family quickly see which upcoming occasions are ready, which gift plans still need action, and which celebration-related prep work is drifting into risk. It stays intentionally calm and operational rather than expanding into a shopping or wishlist product.

## What was added

- A pure `celebrationReadinessService` that derives occasion and gift-plan readiness from existing celebration, gift, event, and prep-task records
- Deterministic readiness levels and issue summaries for `ready`, `on_track`, `needs_attention`, `at_risk`, `overdue`, and `not_applicable`
- Deadline-risk interpretation for missing dates, missing gift plans, unresolved gift/card work, imminent occasions, and overdue generated prep
- Shared readiness badges for celebration and gift-plan UI surfaces
- A readiness overview and highest-priority issue section on `/celebrations`
- Bounded celebration-readiness visibility on Dashboard, Today, and Week
- Prep source labelling and filtering for generated Gifts and Celebrations tasks

## Readiness model

Readiness is fully derived. No readiness summaries are stored in IndexedDB or exported.

The service combines:

- celebration occasion status, type, and date
- linked gift-plan state
- generated celebration prep tasks already attached to linked events
- a fixed `now` input so output remains deterministic and testable

The service produces:

- overall readiness level and score per celebration
- issue lists with severity, due context, and suggested action
- gift-plan readiness summaries nested under each celebration
- stable priority sorting so overdue and critical work appears first

Completed, skipped, archived, or inactive items do not continue to raise active warnings.

## UI integration

### `/celebrations`

The page now shows:

- a compact readiness overview for the next 90 days
- a focused "Needs attention" list with the highest-priority celebration issues
- readiness badges and microcopy on celebration cards
- readiness badges and microcopy on gift-plan cards

### Dashboard

Dashboard now includes a bounded "Celebrations to check" section. It only surfaces at-risk or overdue celebration work within the near-term readiness window, plus overdue related prep.

### Today and Week

Today shows compact celebration-readiness items for today, tomorrow, and overdue work. Week adds lightweight celebration-readiness cards for relevant days without turning the week view into a second dashboard.

### Prep

Generated gift and celebration prep tasks are now clearly identifiable as a `Celebrations` source so they can be filtered separately from general event prep.

## Data and sync impact

No Dexie schema bump was required.

- `celebrationOccasions` and `giftPlans` already contained enough information for readiness derivation
- no app data schema version change was needed
- no export/import schema change was needed
- no sync registry change was needed

The tranche remains fully local-first and deterministic. It adds no network calls, realtime behaviour, or cloud-only logic.

## Validation

Validation for this tranche covers:

- readiness derivation unit tests across ready, on-track, attention, risk, overdue, missing-date, suppression, and sorting scenarios
- page-level tests for `/celebrations`, Dashboard, Today, Week, and Prep integration
- full `pnpm typecheck`, `pnpm test`, and `pnpm build`

An existing Vite chunk-size warning can still appear during production build and remains non-blocking.

## Known limitations

This tranche deliberately does not add:

- wishlists, shopping links, or ecommerce flows
- budgeting beyond existing short notes
- contacts, address books, or guest-management tools
- notifications, reminders, or background sync
- AI scoring, heuristics, or external API enrichment

Readiness is intentionally bounded to practical celebration follow-through using the existing event and prep architecture.
