# Tranche 10B: Household Admin and Renewals Foundation v0.1

## Scope delivered

Tranche 10B adds a bounded Household Admin surface for infrequent but important practical renewals and services such as MOT, insurance renewal, boiler service, warranty expiry, and similar household obligations. The implementation stays local-first and deliberately avoids turning the app into a generic household management suite.

Delivered scope:

- persistent `householdAdminItems` Dexie store
- TypeScript domain model, labels, validation, repository CRUD, and audit entries
- deterministic due-state derivation and renewal-cycle calculation
- `/household-admin` page with add, edit, filter, complete, renew, book, and archive flows
- bounded Dashboard `Household Admin Watch` section
- light-touch Today and Week integration for due and overdue items only
- import/export schema update, validation, preview counts, restore support, and reset clearing
- sync registry registration for the new store
- unit, repository, page, dashboard, import/export, and sync coverage

## Data model

`householdAdminItems` stores:

- title, category, admin type, and lifecycle status
- date-only operational dates: due, start, and last completed
- renewal cycle and optional custom months
- optional owner, related resource, provider, reference label, cost, reminder days, and notes
- created, updated, and archived timestamps

Notes remain practical reminders only. No document uploads, no policy-number requirement, and no sensitive medical, legal, or financial detail are stored.

## Due-state rules

The derived service returns:

- `overdue`
- `due_today`
- `due_soon`
- `upcoming`
- `no_date`
- `complete`
- `archived`

Rules:

- archived records always derive as `archived`
- completed, renewed, and not-needed records without a future due date derive as `complete`
- active or booked items with no due date derive as `no_date`
- due-soon defaults to 30 days when no reminder window is supplied
- cycle roll-forward is month-clamped for month-end and leap-year stability

## UI surfaces

- new `/household-admin` route in the secondary `More` navigation
- page header, attention summary, filters, mobile-first form, and category-grouped cards
- quick actions for edit, book, complete, renew, and archive
- Dashboard watch section limited to overdue, due today, due soon, and missing-date items
- Today section limited to due today and overdue
- Week section limited to overdue and items due inside the visible week

Hub integration was deferred in this tranche to avoid adding a second watch-model path before the dedicated admin surface settles.

## Import/export and reset

Backup schema moved to `officially-organised-data-v5`.

Changes:

- `householdAdminItems` is exported and restored atomically with the rest of the app data
- import preview shows a Household Admin record count
- validation rejects unknown enums, invalid date-only values, duplicate IDs, broken owner/resource/place references, invalid reminder arrays, and non-GBP currencies
- reset clears the store and does not reseed live-looking admin records

## Sync changes

If Supabase sync is enabled, `householdAdminItems` is now part of the durable sync registry and uses the existing record-level local-first behaviour. No realtime, no invitations, and no field-level merge logic were introduced.

## Non-goals

Not delivered:

- chores
- shopping lists
- meal planning
- budgeting or payment workflows
- provider comparison or renewal purchase flows
- document storage, OCR, email import, or external integrations
- push notifications
- AI renewal advice

## Validation results

Implemented validation covers:

- repository input constraints
- due-state derivation and cycle roll-forward
- import/export schema and reference integrity
- page CRUD flows and archive behaviour
- dashboard, today, and week bounded surfacing
- sync serialisation coverage for the new store

## Known limitations

- no dedicated detail view; edit state is page-based via `/household-admin?edit=...`
- no Hub/Wallboard admin panel yet
- quick lifecycle actions use today’s date; editing is the path for more specific note/date adjustments
