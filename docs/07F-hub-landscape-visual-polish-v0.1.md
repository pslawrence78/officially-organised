# Tranche 7F: Hub Landscape Visual Polish v0.1

## Summary

`/hub` and `/hub/wallboard` now share a display-grade visual system for a household landscape screen.

The intended target is a 1920 x 1080, 16:9 kitchen or family command display. The Hub is still read-only and remains outside the normal application shell.

## Visual Changes

- Added a centered 16:9 Hub display frame with a warm domestic background around it.
- Reworked the Hub header into a calm household display band with family Hub branding, current date and a short status line.
- Enlarged Hub panel typography, event titles, badges and supporting text for short-distance readability.
- Elevated cards with softer surfaces, clearer hierarchy, richer empty states and stronger warning treatment.
- Styled Previous, Next, Exit, Wallboard and wallboard controls as display controls rather than normal app buttons.
- Added a portrait/narrow helper message while keeping the Hub as a landscape-first display surface.
- Kept wallboard dwell progress, heartbeat and pause/resume controls in the same visual language as `/hub`.

## `/hub` Behaviour

`/hub` is the static household display. It shows one dominant panel at a time, driven by the Hub panel registry, with Previous card, Next card, Wallboard and Exit dashboard controls.

It does not expose add, edit, delete, complete, skip, reopen, import, export or reset actions.

## `/hub/wallboard` Behaviour

`/hub/wallboard` uses the same frame, panel styling and display hierarchy as `/hub`.

It keeps the Tranche 7E wallboard behaviours:

- Registry-driven panels.
- Auto-rotation and dwell timing.
- Pause and resume.
- Reduced-motion handling.
- Fullscreen where supported.
- Wake lock where supported and enabled.
- Heartbeat/status footer.

## Normal App Protection

The polish pass is scoped to Hub routes and `.hub-*` classes. The normal `AppShell`, bottom navigation and mobile-first app layouts were not changed.

Route tests continue to assert that `/hub` and `/hub/wallboard` render outside `AppShell`, while `/`, `/today`, `/week`, `/car`, `/prep` and `/settings` render through the normal shell.

## Manual QA Notes

Recommended manual checks:

- `/hub`
- `/hub/wallboard`
- `/`
- `/today`
- `/week`
- `/car`
- `/prep`
- `/settings`

Recommended Hub viewport checks:

- 1920 x 1080
- 1366 x 768
- 1024 x 768
- 430 x 932

Confirm that the Hub feels landscape-first, controls remain usable, privacy/offline/weather states are clear, wallboard pause/resume still works, and normal app pages do not gain horizontal overflow or Hub display styling.

## Known Limitations

The Hub remains a local, read-only display surface. This tranche does not add sync, authentication, push notifications, new weather providers, voice assistants, AI summaries or editing from Hub routes.

If browser QA cannot be performed in the current environment, treat the automated checks as coverage for route isolation, read-only controls, registry use, privacy sanitisation and reduced-motion behaviour, then complete visual QA on a real display before release.
