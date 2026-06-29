# Tranche 9C: Gifts and Celebrations Polish and Operational Fit v0.1

## 1. Purpose

Tranche 9C refines the bounded Gifts and Celebrations module introduced in 9A and expanded in 9B so it behaves more calmly, reads more clearly, and fits better into day-to-day operational views. The focus of this tranche is polish rather than feature expansion: clearer language, better empty states, more consistent readiness signalling, improved mobile presentation, and a realistic repeatable test/demo dataset.

This tranche does **not** change the Dexie schema, import/export format, sync registry, or the product boundary. Gifts and Celebrations remains a bounded operational aid for occasions, gift plans, readiness checks, and derived prep tasks.

## 2. What Was Polished

- Reworded readiness copy to use more natural household language instead of implementation-style status phrasing.
- Renamed the intermediate readiness badge label from "On track" to "Partly ready" while keeping the underlying readiness state unchanged.
- Added calmer empty states across Celebrations, Dashboard, Today, Week, and Prep so zero-state screens feel intentional rather than unfinished.
- Improved card structure and spacing on the Celebrations page, especially for upcoming occasions and gift-plan lists.
- Tightened the mobile layout for celebration cards, form action rows, detail actions, prep filters, and prep summary blocks.
- Added deterministic shared fixture data covering birthdays plus a mixed-readiness Christmas scenario for stable tests and demos.

## 3. Copy and Wording Decisions

The tranche intentionally shifts Gifts and Celebrations toward plain-English household copy.

Examples of the wording update include:

- "No present chosen yet."
- "Present not marked as bought..."
- "Card not marked as written."
- "Present still needs wrapping."
- "Present or card still needs packing for today/tomorrow."
- "No gift plan has been added for this occasion."
- "Check the remaining present, card and prep items now."

The aim is to make readiness issues understandable at a glance without asking the household to mentally translate internal workflow states.

## 4. Empty States and Calm UX

The following empty or low-urgency states were added or refined:

- Celebrations page:
  - "No upcoming celebrations yet"
  - "No celebrations added yet"
  - "Nothing urgent for celebrations"
  - "Everything currently looks ready."
  - "No gift plans yet for this occasion."
- Dashboard:
  - celebration section renamed to "Celebration prep"
  - low-urgency state now reads "Nothing urgent for celebrations"
- Today:
  - celebration section always renders, even when empty
  - low-urgency state reads "Nothing urgent for celebrations today."
- Week:
  - dedicated weekly celebration summary shows either risk-only work or "No celebration prep due this week"
- Prep:
  - celebration-filter empty state reads "No celebration prep due right now"
  - supporting copy confirms when no celebration-derived prep items are open

Together these changes make the module feel operationally complete even when there is nothing to act on.

## 5. Badge Consistency and Accessibility

Readiness status is now more consistent across surfaces:

- the label set is aligned around "Ready", "Partly ready", and "At risk"
- the badge component now accepts `title` and `ariaLabel`
- celebration readiness badges expose accessible labels such as "Celebration readiness: At risk"

This keeps the same readiness model from 9B while improving consistency and usability.

## 6. Mobile Layout Improvements

Global styling was extended to improve narrow-screen behaviour without changing the overall design system:

- celebration and gift-plan card headers stack more cleanly on small screens
- prep filters wrap into a more usable grid
- prep summary tiles compress to a two-column layout on narrow devices
- action rows stretch buttons to full width where that reduces crowding
- supporting small text wraps more reliably in compact card layouts

These changes target the real primary use case: quick family operations from a phone.

## 7. Deterministic Test and Demo Dataset

A shared fixture module now provides repeatable celebration data for both tests and local demo use.

The dataset includes:

- a realistic birthday-party scenario
- a family birthday lunch
- a mixed-readiness Christmas example across Phil, Beck, Seb, and Albert

This gives the product a more believable operational shape during testing while avoiding flaky date handling and unstable fixtures.

## 8. Files Changed

- `src/test/celebrationFixtures.ts`
- `src/services/celebrationReadinessService.ts`
- `src/components/common/Badge.tsx`
- `src/components/celebrations/CelebrationReadinessBadge.tsx`
- `src/pages/CelebrationsPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/TodayPage.tsx`
- `src/pages/WeekPage.tsx`
- `src/pages/PrepPage.tsx`
- `src/styles/globals.css`
- `src/pages/CelebrationsPage.test.tsx`
- `src/pages/DashboardPage.test.tsx`
- `src/pages/TodayPage.test.tsx`
- `src/pages/WeekPage.test.tsx`
- `src/pages/PrepPage.test.tsx`
- `src/services/celebrationReadinessService.test.ts`

## 9. Validation

Commands run for this tranche:

- `corepack pnpm typecheck`
- `corepack pnpm build`
- `corepack pnpm test`

Results:

- typecheck passed
- production build passed
- tests passed after replacing time-sensitive fixture setup with deterministic seeded celebration data and resolving a duplicate-text assertion in the Celebrations page test

The build still emits the existing Vite warning about a large JavaScript chunk size, but this tranche does not materially change that pre-existing condition.

## 10. Known Limitations

- Gifts and Celebrations is still intentionally bounded and is not a general shopping, budgeting, wishlist, or notification system.
- Readiness remains derived from simple gift/card/wrap/pack states and linked prep tasks rather than richer timelines or reminder automation.
- Christmas and multi-recipient scenarios are supported operationally, but the UI remains deliberately lightweight rather than deeply specialized for complex seasonal planning.

## 11. Recommended Next Tranche

Recommended follow-on:

**Tranche 9D - Gifts and Celebrations Workflow Hardening v0.1**

Suggested focus:

- edit/delete polish and guardrails
- stronger duplicate and recovery flows
- clearer multi-recipient and grouped-occasion handling
- sharper operational summaries for larger seasonal workloads
