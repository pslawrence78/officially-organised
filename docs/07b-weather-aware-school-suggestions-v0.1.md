# Tranche 7B: Weather-Aware School Suggestions v0.1

Officially Organised now derives calm, deterministic school-readiness suggestions from Seb's existing 7A day configuration and a small local forecast snapshot. Rules cover rain, Forest School, cold, PE, heat, UV, wind and hot-day packed lunches; closed school days suppress suggestions and specific Forest School guidance takes priority over generic rain advice.

Settings includes an opt-in “Weather for school suggestions” panel. Live weather is disabled by default and uses Open-Meteo directly from the browser with user-entered coarse coordinates. Only latitude, longitude and the forecast variables are sent to the provider; family names, events, notes and school configuration remain local. Manual and on-app-open refresh modes are supported.

Dexie schema version 8 adds a bounded `weatherForecasts` cache. The cache retains only the latest normalised seven-day snapshot. Fresh cached data avoids a network request; stale data remains usable if refresh fails and is labelled stale; a missing forecast produces a friendly unavailable state without affecting school readiness.

Weather settings use the existing `settings` store and therefore remain part of backup schema v2. Import validation checks the weather enums, booleans, stale window and coordinate bounds. Forecast snapshots are transient third-party data and are deliberately omitted from export; restore and reset clear them.

Suggestions appear within school readiness on Dashboard and Today, with compact cues in Week. Dashboard shows at most three suggestions per date and remains subordinate to operational conflicts and preparation. “Add to prep” is not shown because 7A school days are not event-backed and there is no safe task destination.

Known limitations: forecasts depend on Open-Meteo availability and an approximate user-entered location; advice is advisory; there are no notifications, geocoding, school portal integration, automatic prep creation, backend sync or weather maps.

Validation covers provider code mapping, normalisation, fresh/stale/offline cache behaviour, deterministic rules and weather-card states. Recommended next tranche: **Tranche 7C — School Readiness Review and Polish v0.1**.
