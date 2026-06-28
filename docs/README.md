# Documentation index

The documents in this folder define **Officially Organised**, a private, mobile-first family logistics PWA. They progress from early product discovery through the validated product definition, technical architecture, and implementation plan.

## Start here

- **To understand the product:** read [Product Specification v0.2](03-product-specification-v0.2.md).
- **To understand how it should be built:** read [Technical Architecture v0.1](04-technical-architecture-v0.1.md).
- **To begin implementation:** follow [Build Plan v0.1](05-build-plan-v0.1.md), starting with Tranche 0 (formerly Milestone A).

## Document map

| # | Document | Purpose | Status |
|---|---|---|---|
| 01 | [Early Product Specification v0.1](01-early-product-specification-v0.1.md) | Establishes the original problem, household use cases, product principles, MVP boundary, and open questions. | Historical context |
| 02 | [Core Data Model and Realistic Week Test v0.1](02-core-data-model-and-realistic-week-test-v0.1.md) | Develops the core entities and stress-tests them against a realistic family week. | Supporting rationale |
| 03 | [Product Specification v0.2](03-product-specification-v0.2.md) | Defines the current product scope, users, workflows, screens, data concepts, conflict rules, and acceptance criteria. | Current product source of truth |
| 04 | [Technical Architecture v0.1](04-technical-architecture-v0.1.md) | Defines the local-first PWA architecture, stack, storage, offline behaviour, domain logic, testing, security, and future extension paths. | Current technical source of truth |
| 05 | [Build Plan v0.1](05-build-plan-v0.1.md) | Converts the specification and architecture into phased deliverables, acceptance tests, development prompts, milestones, and the MVP definition of done. | Current delivery source of truth |
| 06 | [Tranche 6: Routines and Recurrence v0.1](06-tranche-6-routines-and-recurrence-v0.1.md) | Records the implemented recurrence model, integration, validation and known limits. | Implemented |
| 07 | [Tranche 7: Import, Export and Local Data Safety v0.1](07-tranche-7-import-export-local-data-safety-v0.1.md) | Records the versioned backup format, validation, transactional restore, reset and privacy posture. | Implemented |
| 07F | [Tranche 7F: Hub Landscape Visual Polish v0.1](07F-hub-landscape-visual-polish-v0.1.md) | Records the landscape-first Hub display frame, shared wallboard visual system, layout isolation and QA notes. | Implemented |

## Reading order

For a complete understanding, read the documents in numeric order. For day-to-day product and implementation decisions, use **03 -> 04 -> 05**. Documents 01 and 02 explain how those decisions were reached.

If documents disagree, prefer the later document for its area of authority:

1. Product behaviour and scope: document 03.
2. Engineering decisions: document 04.
3. Implementation sequence and acceptance: document 05.

## Topic guide

| Topic | Best source |
|---|---|
| Product purpose, users, scope, and principles | [Product Specification, sections 2-7](03-product-specification-v0.2.md#2-product-summary) |
| Data model and why each field exists | [Core Data Model and Realistic Week Test](02-core-data-model-and-realistic-week-test-v0.1.md#2-core-data-model) |
| Current product data definitions | [Product Specification, section 9](03-product-specification-v0.2.md#9-core-data-model) |
| User workflows and screens | [Product Specification, sections 12-13](03-product-specification-v0.2.md#12-core-workflows) |
| Conflict and reminder behaviour | [Product Specification, sections 14-15](03-product-specification-v0.2.md#14-conflict-detection-rules) |
| Framework, storage, PWA, and offline design | [Technical Architecture, sections 2-7](04-technical-architecture-v0.1.md#2-core-architecture-decision) |
| Recurrence, conflicts, reminders, and import/export implementation | [Technical Architecture, sections 9-12](04-technical-architecture-v0.1.md#9-recurrence-architecture) |
| Proposed source folder structure | [Technical Architecture, section 24](04-technical-architecture-v0.1.md#24-folder-structure) |
| Build phases and per-phase acceptance criteria | [Build Plan, section 5](05-build-plan-v0.1.md#5-build-phases) |
| Full MVP acceptance suite | [Build Plan, section 7](05-build-plan-v0.1.md#7-mvp-acceptance-test-suite) |
| Recommended first implementation boundary | [Build Plan, section 10](05-build-plan-v0.1.md#10-recommended-first-implementation-boundary) |
| Milestone order and MVP definition of done | [Build Plan, sections 11-12](05-build-plan-v0.1.md#11-recommended-milestone-order) |

## Current implementation boundary

The application is implemented through **Tranche 7F**, including versioned local backup, validated transactional restore, protected reset, and the landscape-first read-only Hub display polish. See documents 07 and 07F for the current boundary.

When adding a document, retain the numeric prefix, include its version in the filename, and update this index with its purpose, status, and authority.
