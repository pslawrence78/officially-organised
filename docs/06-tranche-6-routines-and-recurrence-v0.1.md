# Tranche 6: Routines and Recurrence v0.1

Officially Organised now supports local-first weekly, fortnightly and monthly family routines. Active series expand into virtual occurrences only for requested date ranges and participate in Dashboard, Today, Week, Car, Prep, People and conflict detection like stored events.

## Changes

- Added the `EventSeries`, occurrence-exception and safe `EventOccurrence` models.
- Added deterministic Europe/London recurrence expansion, date limits, term-time filtering and materialised-event suppression.
- Added validated series persistence using the existing `eventSeries` IndexedDB store.
- Added routine create, edit, pause and archive flows with participants, responsibility, place, car windows, prep defaults and notes.
- Added generated occurrence detail and single-occurrence cancel, move, responsibility and car overrides.
- Persisted generated prep completion as a changed occurrence exception without mutating future defaults.
- Included generated events in existing event, people, resource, prep and conflict selectors.

## Main new files

- `src/domain/series/seriesService.ts`
- `src/domain/validation/eventSeriesValidation.ts`
- `src/data/repositories/eventSeriesRepository.ts`
- `src/components/routines/SeriesCard.tsx`
- `src/components/routines/SeriesForm.tsx`
- `src/components/routines/OccurrenceExceptionEditor.tsx`

## Data and schema

The existing `eventSeries` store is reused, so IndexedDB remains at schema version 6. Materialised occurrences may carry `seriesId` and `occurrenceDate`. Generated occurrences remain virtual by default and use stable `occurrence_<seriesId>_<YYYY-MM-DD>` IDs.

## Validation and limits

Validation covers title, frequency, recurrence day, dates, duration, members, responsible adults, places and resources. The deliberately restrained model supports one weekday, skips impossible monthly dates, and does not add yearly rules, RRULE strings, external calendars, notifications or sync. Archived routines are retained locally but hidden from the routine list.

## Recommended next tranche

Tranche 7: Import, Export and Local Data Safety v0.1.
