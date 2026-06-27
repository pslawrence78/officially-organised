# Tranche 7E: Hub Auto-Rotation and Wallboard Mode v0.1

## What Was Built

Enhanced the read-only Hub with an optional wallboard experience for household screens.

Added:

- `/hub/wallboard`
- A data-driven Hub panel registry
- Auto-rotation with panel-specific dwell times
- Pause, resume, previous and next controls
- Reduced-motion-aware rotation behaviour
- Fullscreen controls using the browser Fullscreen API
- Optional screen wake-lock controls
- Wallboard heartbeat/status footer
- Hidden/offline-safe fallback behaviour
- Compact wallboard settings under Settings

The existing `/hub` route remains stable and uses the same display-shell architecture from Tranche 7D.

## Route Added

- `/hub/wallboard`

The wallboard route sits outside the normal app shell, like `/hub`, and does not show standard app navigation.

## Panel Registry

The Hub panels are now registered through deterministic metadata:

- Today
- Tomorrow
- School readiness
- Weather suggestions
- Car watch
- Critical prep

The registry defines default dwell time, min/max dwell bounds, order priority and availability rules. Standard `/hub` still includes all registered panels. Wallboard mode may skip quiet panels when configured, while preserving important car conflicts and critical prep warnings.

## Rotation Behaviour

Rotation is handled by a small pure service plus a React hook.

It supports:

- Current panel index
- Active panel ID
- Available panel filtering
- Per-panel dwell timing
- Manual next and previous
- Pause and resume
- Hidden-tab pause
- Reduced-motion calming
- Safe zero-panel and one-panel behaviour

Timers are cleared through React effect cleanup, and rotation does not run with zero or one available panel.

## Dwell Time Settings

Settings are stored in the existing local `settings` store and are included in normal backup/export data.

Defaults:

- Default dwell: 15 seconds
- Today: 20 seconds
- Tomorrow: 15 seconds
- School readiness: 20 seconds
- Weather suggestions: 15 seconds
- Car watch: 20 seconds
- Critical prep: 20 seconds
- Minimum dwell: 5 seconds
- Maximum dwell: 120 seconds

Settings UI includes:

- Auto-rotation on/off
- Default dwell seconds
- Skip quiet panels
- Wake-lock control opt-in
- Reduced-motion policy
- Reset to defaults

## Pause and Resume Model

Users can pause and resume wallboard rotation explicitly. Manual previous and next controls remain available. Manual navigation briefly pauses rotation so the selected panel can be read.

Rotation also pauses when the document is hidden and resumes only if the user has not manually paused it.

## Reduced Motion

The wallboard detects `prefers-reduced-motion`.

By default, reduced-motion preference disables automatic rotation and removes progress animation. Settings can keep the system-respecting default, always keep rotation static, or allow rotation.

## Fullscreen Behaviour

Fullscreen is requested only after pressing the wallboard control. If unsupported or denied, the wallboard continues to work and shows a calm status message.

## Wake-Lock Behaviour

Wake lock is optional and disabled by default in settings. If enabled, the wallboard shows a user-initiated `Keep awake` control where the API exists.

The wake lock is released when:

- The user releases it
- The document becomes hidden
- The wallboard unmounts

Unsupported or denied wake-lock paths do not block wallboard use.

## Offline and Hidden Fallbacks

When offline, the wallboard continues showing local data and displays offline status in the heartbeat. Weather stale or unavailable states are surfaced through existing Hub view-model flags.

When hidden, rotation pauses and wake lock is released. When no panels are available, the wallboard shows a static fallback panel.

## Read-Only Guarantee

The Hub and wallboard remain read-only.

Allowed:

- Rotate panels
- Pause/resume
- Move next/previous
- Enter/exit wallboard
- Enter/exit fullscreen
- Request/release wake lock
- Adjust display-only wallboard settings

Not added:

- Event edits
- Prep completion/skipping/reopening
- School readiness operational mutation
- Weather source configuration from wallboard
- Car need changes
- Import/export/reset actions from wallboard

## Validation Performed

Completed:

- `corepack pnpm typecheck`
- `corepack pnpm test`

Added automated coverage for:

- Deterministic panel order
- Disabled panel exclusion
- Unavailable panel skipping
- Critical car/prep panel availability
- Rotation dwell advancement
- Per-panel dwell times
- Dwell clamping
- Pause behaviour
- Zero-panel and one-panel behaviour
- Manual next/previous wrapping
- Hidden pause
- Visible/manual pause resume logic
- Reduced-motion rotation calming
- Offline status
- Unsupported/denied permission status paths
- `/hub/wallboard` route contract

## Known Limitations

- Browser visual QA on a physical tablet was not performed in this environment.
- Fullscreen and wake-lock behaviour depend on browser/runtime support and user permission.
- Per-panel dwell editing is represented through defaults and stored settings plumbing, but the compact UI exposes only the global dwell value for now.

