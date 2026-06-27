# Tranche 7D: Read-Only Hub Dashboard v0.1

## What Was Built

Added a dedicated `/hub` route for a calm, display-first household dashboard aimed at a kitchen screen or tablet.

Refinement added before Tranche 7E:

- `/hub` now uses a dedicated display shell rather than the normal app shell.
- The standard app header, menu sheet and bottom navigation are not present on `/hub`.
- Hub panels are presented as landscape display cards with previous and next controls.
- The visible exit path is a single `Exit dashboard` control back to `/`.
- The shell is designed around a 16:9 landscape surface, while still degrading on narrow screens.

The Hub now shows:

- Today
- Tomorrow
- School readiness
- Weather suggestions
- Car watch
- Critical prep
- A compact status footer

## Route Added

- `/hub`

The route is directly addressable and discoverable from:

- Dashboard hero link
- Settings

## Data Sources Used

The Hub composes existing local-first data and services rather than duplicating business logic:

- Events and routine occurrences
- Prep tasks
- Family car resource needs
- School calendar and half-term configuration
- Existing school readiness derivation
- Existing weather settings and forecast cache
- Existing deterministic weather-aware suggestions
- Existing school readiness prep actions, projected read-only when needed

## Privacy Mode Behaviour

The Hub includes a local display privacy toggle that does not mutate household operational data.

When privacy mode is on, the Hub hides or strips:

- Exact addresses
- Postcodes
- Coordinate-like values
- Booking/reference-style details
- Notes routed through Hub summaries where they may expose unnecessary detail

High-level logistics remain visible where useful.

## Read-Only Guarantee

The `/hub` route does not add, edit, delete, complete, skip, reopen, or otherwise mutate operational data.

Allowed from the Hub:

- Previous card
- Next card
- Exit dashboard

Not used in the Hub:

- Event mutation controls
- Prep completion controls
- School readiness mutation flows
- Weather settings mutation flows
- Standard app navigation
- Normal app page chrome

## Known Limitations

- This tranche does not include auto-rotation, wallboard mode, wake lock, or dwell timing.
- Visual manual QA in a real tablet/browser session was not performed inside this environment.
- The production build still reports an existing large-JS-chunk warning from Vite.

## Validation Performed

Completed:

- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

Not available:

- No `lint` script is configured in `package.json`

Added automated coverage for:

- Populated Hub view model
- Empty Hub state
- Today vs tomorrow date windows
- Closed-day school readiness suppression
- Unknown school readiness visibility
- Weather disabled fallback
- Weather stale state
- Required and maybe car windows
- Critical prep prioritisation
- Privacy sanitisation
- Read-only Hub UI constraints
- `/hub` route rendering contract

## Next Tranche

Suggested next tranche:

- Tranche 7E: Hub Auto-Rotation and Wallboard Mode v0.1
