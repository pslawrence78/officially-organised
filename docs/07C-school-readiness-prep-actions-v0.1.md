# Tranche 7C — School Readiness Prep Actions v0.1

## What was built

OO now materialises Seb's operational school requirements and available Tranche 7B weather suggestions as durable local prep actions. Actions appear on Dashboard, Today, Week and Prep and can be completed, skipped or reopened.

## Data model and persistence

Dexie schema v9 adds `schoolReadinessPrepActions`, indexed by ID, school date, status, source, member, due time and useful compound keys. Each record retains its source identity, source version, status timestamps and stale explanation. React pages use the repository/service layer and do not access Dexie directly.

Backup schema v3 includes the new store in export, replace restore and reset. Import validation checks required fields, enum values, dates, member references, duplicate IDs and duplicate active source identities.

## Derivation

Operational candidates cover packed lunch, unknown lunch, PE kit, unknown attire, Forest School wellies, long trousers and waterproofs. Known school dinners and ordinary uniform create no noise. Closed or unknown school days create no actions.

Weather candidates consume the existing 7B suggestion output. No suggestion means no weather action, including unavailable forecasts. Equivalent operational and weather titles are deduplicated.

## Idempotency and status behaviour

Candidate IDs are deterministic hashes of member, source type and source key. A range refresh transaction:

1. Inserts genuinely new candidates as open.
2. Updates changed open candidates.
3. Never reopens done or skipped records.
4. Marks obsolete open candidates stale.
5. Preserves completed and skipped history.

Auditing records creation and user/status transitions without logging unchanged derivation passes.

## UI

The reusable school prep card shows source, category, priority, owner, detail and status controls. Cards retain the existing mobile-first layout and collapse to a two-column action layout below 432px. Prep adds source filtering while preserving existing event prep behavior.

## Validation

- TypeScript typecheck: passed.
- Full test suite: 150 tests passed across 33 files.
- Production build: passed.
- Lint: no lint script is configured.

## Known limitations

- Prep presents school actions in a dedicated section rather than merging them into every existing event due-date group.
- Weather quality and availability remain dependent on Tranche 7B.
- No push notifications, cloud sync, authentication, external calendar, school portal or AI.
- No general task-management expansion.

## Suggested commit

`Add school readiness prep actions`

## Recommended next tranche

Tranche 7D: Read-Only Hub Dashboard v0.1.
