# Tranche 7A: School Half-Term Configuration v0.1

Officially Organised now stores date-specific school readiness facts for each half-term. A configuration belongs to Seb's existing school calendar and embeds one entry per open school day, using local `YYYY-MM-DD` dates.

The Settings workflow at `/settings/school-half-terms` generates open school-day rows from a date range. Parents can record lunch and dinner choice, school uniform or PE kit, and Forest School requirements. Quick-fill controls apply common lunch or uniform values across the period; individual days remain editable. Overlapping ranges are blocked and unknown values remain visibly flagged.

Dashboard, Today and Week combine the existing open/closed/unknown calendar status with the matching configuration. Closed days suppress readiness warnings. Open days without data show a clear unconfigured warning. The data remains derived operational context and does not create events or prep tasks.

Dexie schema version 7 adds `schoolHalfTermConfigs`. Backup schema v2 includes, validates, restores and resets this store, including references, ranges, enum values and duplicate dates.
