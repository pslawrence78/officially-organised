# Tranche 9A: Gifts and Celebrations Foundation v0.1

## Summary

Tranche 9A adds a bounded Gifts and Celebrations foundation at `/celebrations`.

The feature exists to reduce recurring family logistics risk around birthdays, parties, cards, presents, RSVPs, wrapping, and "remember to take it" actions. It is intentionally not a shopping app, wishlist tool, guest planner, contact database, or general celebration manager.

## What was added

- New local data entities for `celebrationOccasions` and `giftPlans`
- Dexie schema migration to add both stores
- Repository support for creating, listing, updating, and archiving celebration and gift records
- A deterministic prep-task generation service for gift plans
- A new `/celebrations` management route surfaced through secondary navigation and Settings
- Event-detail integration showing linked gift and celebration context
- Prep integration by writing generated tasks into the existing event prep-task system
- Import, export, restore, reset, and sync support for the new stores

## Data added

### `celebrationOccasions`

Compact records for practical occasion tracking:

- title
- occasion type
- date and recurrence
- optional linked event or linked family member
- optional recipient name and lightweight relationship context
- owner adult IDs
- lifecycle status
- short practical notes
- created/updated timestamps

### `giftPlans`

Compact records for practical delivery planning:

- linked celebration ID
- optional linked event and recipient family member
- recipient name
- optional responsible adult
- short gift summary
- gift, card, and RSVP statuses
- target, buy-by, wrap-by, and take-by dates
- short budget note and practical notes
- linked generated prep-task IDs
- archived flag
- created/updated timestamps

## Prep and event integration

Gift plans can generate or refresh a deterministic set of practical prep tasks:

- RSVP to party
- Buy present
- Buy card
- Write card
- Wrap present
- Pack and take present and card

Generation is idempotent. Re-running the service updates the same generated task IDs instead of creating duplicates, and existing completed or skipped states are preserved where sensible.

If a gift plan is linked to an existing event, generated tasks flow into that event's existing prep list. If no suitable event exists, the app creates a lightweight support event so the work still appears in the shared operational layer and existing Prep surfaces.

Event detail now shows a compact Gifts and Celebrations card when linked records exist, while missing linked records degrade safely.

## Sync impact

Tranche 9A extends the existing local-first Supabase sync model rather than creating a new sync path.

- `celebrationOccasions` and `giftPlans` are registered as syncable entity types
- export/import/reset and sync now cover the same durable-store set
- no realtime sync, invitations, field-level merging, or cloud-only behaviour was added
- conflict review and diagnostics continue to use the existing safe record-level architecture

If Supabase sync is paused, offline, or disconnected, the feature remains fully local-first.

## Import and export impact

- export now includes celebration and gift-plan records
- import validation recognises both record types and validates key references
- restore writes both stores transactionally with the rest of the app data
- reset clears both stores and returns the app to the seeded baseline
- backup schema/version identifiers were incremented to match the extended payload

## Known limitations

This tranche deliberately does not include:

- celebration readiness scoring
- dashboard warning engines for gift deadlines
- advanced risk/conflict logic
- budgeting beyond a short note
- gift recommendations, shopping links, or wishlists
- guest lists, invitations, messaging, or contact management
- notifications or calendar sync

The UI is intentionally lightweight and operational. It is suitable for storing the practical minimum needed to keep family preparation flowing through the existing system.

## Deferred to Tranche 9B

Tranche 9B should focus on readiness rather than broadening scope. Recommended follow-on work:

- low-noise readiness surfacing
- deadline/risk interpretation built on generated task state
- calmer visibility of upcoming celebration pressure in existing operational surfaces
- safe, bounded follow-through improvements without turning the module into a general planner
