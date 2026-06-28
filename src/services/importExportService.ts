import { db, databaseMetadata } from "../data/db";
import {
  seedCountdownTargets, seedFamilyMembers, seedHousehold, seedResources,
  seedSchoolCalendar, seedSettings, seedTemplates,
} from "../data/seedData/initialData";
import { defaultSyncSettings } from "../data/repositories/syncRepository";
import { clearLocalSyncMetadataForReset, markAllSyncableRecordsDirty } from "../sync/syncEngine";
import {
  EVENT_CATEGORIES, EVENT_STATUSES, EXPORT_DATA_SCHEMA, EXPORT_SCHEMA_VERSION,
  PLACE_TYPES, PREP_TASK_PRIORITIES, PREP_TASK_STATUSES, RESOURCE_NEED_STATUSES, SCHOOL_ATTIRE_TYPES, SCHOOL_LUNCH_TYPES,
} from "../domain/constants";
import type { ExportEnvelope, ExportDataPayload, ImportPreview, ImportRecordCounts, ImportValidationIssue, ImportValidationResult, ParseImportResult, RestoreResult } from "../types/importExport";
import { EXPORT_STORE_NAMES } from "../types/importExport";

const APP_VERSION = "0.4.0";
const MEMBER_TYPES = ["adult", "child", "pet"];
const RESOURCE_TYPES = ["car", "equipment", "room", "other"];
const SERIES_STATUSES = ["active", "paused", "archived"];
const RECURRENCE_FREQUENCIES = ["weekly", "fortnightly", "monthly"];
const SCHOOL_PERIOD_TYPES = ["term", "holiday"];
const SCHOOL_CLOSURE_TYPES = ["inset", "bank_holiday", "other_closed"];
const COUNTDOWN_SOURCES = ["manual", "event", "school_period_start", "school_period_end", "school_closure", "birthday", "seasonal"];
const COUNTDOWN_VISIBILITIES = ["dashboard_primary", "dashboard_secondary", "hidden"];
const SCHOOL_PREP_SOURCES = ["operational_school_readiness", "weather_school_suggestion"];
const SCHOOL_PREP_CATEGORIES = ["lunch", "attire", "pe", "forest_school", "weather", "check_required", "general_school"];
const SCHOOL_PREP_OWNERS = ["member_phil", "member_beck", "either", "both"];
const SCHOOL_PREP_STATUSES = ["open", "done", "skipped", "stale"];

function exportId() {
  return `export_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
}

function countsFor(data: ExportDataPayload): ImportRecordCounts {
  return Object.fromEntries(EXPORT_STORE_NAMES.map((name) => [name, data[name].length])) as ImportRecordCounts;
}

export async function getLocalDataSummary(): Promise<ImportRecordCounts> {
  const values = await Promise.all(EXPORT_STORE_NAMES.map((name) => db.table(name).count()));
  return Object.fromEntries(EXPORT_STORE_NAMES.map((name, index) => [name, values[index]])) as ImportRecordCounts;
}

export async function createExportPayload(): Promise<ExportEnvelope> {
  const data = Object.fromEntries(await Promise.all(EXPORT_STORE_NAMES.map(async (name) => [name, await db.table(name).toArray()]))) as unknown as ExportDataPayload;
  return {
    schema: EXPORT_DATA_SCHEMA,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    sourceAppName: "Officially Organised",
    exportId: exportId(),
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    databaseVersion: databaseMetadata.schemaVersion,
    recordCounts: countsFor(data),
    data,
  };
}

export function exportFilename(date = new Date()) {
  const stamp = date.toISOString().replace(/:/g, "").slice(0, 15).replace("T", "-");
  return `officially-organised-backup-${stamp}.json`;
}

export function downloadExportFile(payload: ExportEnvelope) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exportFilename(new Date(payload.exportedAt));
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function recordExportCompleted(exportId: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.auditLog.put({ id: `audit_export_${Date.now()}`, entityType: "system", entityId: exportId, action: "exported", timestamp, summary: "Exported local Officially Organised backup" });
}

export function parseImportJson(input: string): ParseImportResult {
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch {
    return { ok: false, issue: { severity: "error", code: "invalid_json", message: "Import blocked. The backup is not valid JSON." } };
  }
}

function issue(code: string, message: string, path?: string, relatedId?: string): ImportValidationIssue {
  return { severity: "error", code, message: `Import blocked. ${message}`, path, relatedId };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyId(value: unknown) { return typeof value === "string" && value.trim().length > 0; }
function validIso(value: unknown) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && !Number.isNaN(Date.parse(value)); }
function validDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function oneOf(value: unknown, options: readonly string[]) { return typeof value === "string" && options.includes(value); }

function validateIds(records: unknown[], store: string, errors: ImportValidationIssue[]) {
  const seen = new Set<string>();
  records.forEach((record, index) => {
    const value = isObject(record) ? record.id : undefined;
    if (!nonEmptyId(value)) errors.push(issue("missing_id", `${store} record ${index + 1} has no valid ID.`, `data.${store}[${index}].id`));
    else if (seen.has(value as string)) errors.push(issue("duplicate_id", `Two ${store} records use the same ID ‘${value}’.`, `data.${store}[${index}].id`, value as string));
    else seen.add(value as string);
  });
}

function requireFields(record: Record<string, unknown>, fields: string[], store: string, index: number, errors: ImportValidationIssue[]) {
  fields.forEach((field) => {
    if (record[field] === undefined || record[field] === null || (typeof record[field] === "string" && !(record[field] as string).trim())) {
      errors.push(issue("missing_field", `${store} record ‘${String(record.id ?? index + 1)}’ is missing ${field}.`, `data.${store}[${index}].${field}`, String(record.id ?? "")));
    }
  });
}

function validatePayloadStructure(value: unknown, errors: ImportValidationIssue[]): value is ExportEnvelope {
  if (!isObject(value)) { errors.push(issue("invalid_envelope", "The backup must be a JSON object.")); return false; }
  if (value.schema !== EXPORT_DATA_SCHEMA) errors.push(issue("unsupported_schema", `This backup does not use the recognised ${EXPORT_DATA_SCHEMA} schema.`, "schema"));
  if (value.schemaVersion !== EXPORT_SCHEMA_VERSION) errors.push(issue("unsupported_schema_version", "This backup uses an unsupported schema version.", "schemaVersion"));
  if (!isObject(value.data)) { errors.push(issue("missing_data", "The backup has no valid data object.", "data")); return false; }
  for (const store of EXPORT_STORE_NAMES) if (!Array.isArray(value.data[store])) errors.push(issue("store_not_array", `${store} must be an array.`, `data.${store}`));
  return errors.length === 0;
}

export function validateImportPayload(value: unknown): Omit<ImportValidationResult, "preview"> {
  const errors: ImportValidationIssue[] = [];
  const warnings: ImportValidationIssue[] = [];
  if (!validatePayloadStructure(value, errors)) return { valid: false, errors, warnings };
  const payload = value as ExportEnvelope;
  const d = payload.data;
  for (const store of EXPORT_STORE_NAMES) {
    validateIds(d[store], store, errors);
    d[store].forEach((record, index) => { if (!isObject(record)) errors.push(issue("invalid_record", `${store} record ${index + 1} must be an object.`, `data.${store}[${index}]`)); });
  }
  if (errors.length) return { valid: false, errors, warnings };

  const requireArray = (value: unknown, path: string) => { if (!Array.isArray(value)) errors.push(issue("field_not_array", `${path} must be an array.`, path)); };
  d.familyMembers.forEach((r, i) => { if (r.defaultResponsibleAdults !== undefined) requireArray(r.defaultResponsibleAdults, `data.familyMembers[${i}].defaultResponsibleAdults`); });
  d.events.forEach((r, i) => { requireArray(r.participants, `data.events[${i}].participants`); requireArray(r.responsibleAdults, `data.events[${i}].responsibleAdults`); requireArray(r.prepTasks, `data.events[${i}].prepTasks`); requireArray(r.resourceNeeds, `data.events[${i}].resourceNeeds`); r.prepTasks?.forEach((item, n) => { if (!isObject(item)) errors.push(issue("invalid_record", `Event prep task ${n + 1} must be an object.`, `data.events[${i}].prepTasks[${n}]`)); }); r.resourceNeeds?.forEach((item, n) => { if (!isObject(item)) errors.push(issue("invalid_record", `Event resource need ${n + 1} must be an object.`, `data.events[${i}].resourceNeeds[${n}]`)); }); });
  d.eventSeries.forEach((r, i) => { requireArray(r.defaultParticipants, `data.eventSeries[${i}].defaultParticipants`); requireArray(r.defaultResponsibleAdults, `data.eventSeries[${i}].defaultResponsibleAdults`); requireArray(r.defaultResourceNeeds, `data.eventSeries[${i}].defaultResourceNeeds`); requireArray(r.defaultPrepTasks, `data.eventSeries[${i}].defaultPrepTasks`); requireArray(r.exceptions, `data.eventSeries[${i}].exceptions`); });
  d.schoolCalendars.forEach((r, i) => { requireArray(r.periods, `data.schoolCalendars[${i}].periods`); requireArray(r.closureDays, `data.schoolCalendars[${i}].closureDays`); });
  d.schoolHalfTermConfigs.forEach((r, i) => { requireArray(r.entries, `data.schoolHalfTermConfigs[${i}].entries`); });
  if (errors.length) return { valid: false, errors, warnings };
  if (d.households.length === 0) errors.push(issue("missing_household", "The backup contains no household record.", "data.households"));

  const members = new Set(d.familyMembers.map((x) => x.id));
  const places = new Set(d.places.map((x) => x.id));
  const resources = new Set(d.resources.map((x) => x.id));
  const series = new Set(d.eventSeries.map((x) => x.id));
  const templates = new Set(d.templates.map((x) => x.id));
  const events = new Set(d.events.map((x) => x.id));
  const calendars = new Set(d.schoolCalendars.map((x) => x.id));

  d.households.forEach((r, i) => { requireFields(r as unknown as Record<string, unknown>, ["id", "name", "timezone", "defaultStartOfWeek"], "household", i, errors); if (!oneOf(r.defaultStartOfWeek, ["monday", "sunday"])) errors.push(issue("unknown_week_start", `Household ‘${r.name}’ has an unknown week start.`, `data.households[${i}].defaultStartOfWeek`, r.id)); });
  d.familyMembers.forEach((r, i) => { requireFields(r as unknown as Record<string, unknown>, ["id", "displayName", "memberType"], "family member", i, errors); if (!oneOf(r.memberType, MEMBER_TYPES)) errors.push(issue("unknown_member_type", `Family member ‘${r.displayName}’ has an unknown member type.`, `data.familyMembers[${i}].memberType`, r.id)); r.defaultResponsibleAdults?.forEach((id) => { if (!members.has(id)) errors.push(issue("missing_member_reference", `Family member ‘${r.displayName}’ references missing responsible adult ‘${id}’.`, `data.familyMembers[${i}].defaultResponsibleAdults`, r.id)); }); });
  d.resources.forEach((r, i) => { requireFields(r as unknown as Record<string, unknown>, ["id", "name", "resourceType"], "resource", i, errors); if (!oneOf(r.resourceType, RESOURCE_TYPES)) errors.push(issue("unknown_resource_type", `Resource ‘${r.name}’ has an unknown type.`, `data.resources[${i}].resourceType`, r.id)); });
  d.places.forEach((r, i) => { requireFields(r as unknown as Record<string, unknown>, ["id", "name", "placeType", "createdAt", "updatedAt"], "place", i, errors); if (!oneOf(r.placeType, PLACE_TYPES)) errors.push(issue("unknown_place_type", `Place ‘${r.name}’ has an unknown type.`, `data.places[${i}].placeType`, r.id)); if (!validIso(r.createdAt) || !validIso(r.updatedAt)) errors.push(issue("invalid_timestamp", `Place ‘${r.name}’ has an invalid timestamp.`, `data.places[${i}]`, r.id)); });
  d.templates.forEach((r, i) => { requireFields(r as unknown as Record<string, unknown>, ["id", "name", "category"], "template", i, errors); if (!oneOf(r.category, EVENT_CATEGORIES)) errors.push(issue("unknown_category", `Template ‘${r.name}’ has an unknown category.`, `data.templates[${i}].category`, r.id)); });

  d.events.forEach((r, i) => {
    requireFields(r as unknown as Record<string, unknown>, ["id", "title", "category", "status", "startAt", "endAt", "participants", "responsibleAdults", "prepTasks", "resourceNeeds", "createdAt", "updatedAt"], "event", i, errors);
    if (!oneOf(r.category, EVENT_CATEGORIES)) errors.push(issue("unknown_category", `Event ‘${r.title}’ has an unknown category.`, `data.events[${i}].category`, r.id));
    if (!oneOf(r.status, EVENT_STATUSES)) errors.push(issue("unknown_event_status", `Event ‘${r.title}’ has an unknown status.`, `data.events[${i}].status`, r.id));
    if (!validIso(r.startAt) || !validIso(r.endAt)) errors.push(issue("invalid_event_date", `Event ‘${r.title}’ has an invalid start or end date.`, `data.events[${i}]`, r.id));
    else if (Date.parse(r.endAt) <= Date.parse(r.startAt)) errors.push(issue("invalid_event_order", `Event ‘${r.title}’ must end after it starts.`, `data.events[${i}].endAt`, r.id));
    if (r.placeId && !places.has(r.placeId)) errors.push(issue("missing_place_reference", `Event ‘${r.title}’ references missing place ‘${r.placeId}’.`, `data.events[${i}].placeId`, r.id));
    r.participants?.forEach((id) => { if (!members.has(id)) errors.push(issue("missing_participant", `Event ‘${r.title}’ references missing participant ‘${id}’.`, `data.events[${i}].participants`, r.id)); });
    r.responsibleAdults?.forEach((id) => { if (!members.has(id)) errors.push(issue("missing_responsible_adult", `Event ‘${r.title}’ references missing responsible adult ‘${id}’.`, `data.events[${i}].responsibleAdults`, r.id)); });
    if (r.seriesId && !series.has(r.seriesId)) errors.push(issue("missing_series_reference", `Event ‘${r.title}’ references missing routine ‘${r.seriesId}’.`, `data.events[${i}].seriesId`, r.id));
    if (r.templateId && !templates.has(r.templateId)) errors.push(issue("missing_template_reference", `Event ‘${r.title}’ references missing template ‘${r.templateId}’.`, `data.events[${i}].templateId`, r.id));
    r.resourceNeeds?.forEach((need, n) => { if (!resources.has(need.resourceId)) errors.push(issue("missing_resource_reference", `Event ‘${r.title}’ needs missing resource ‘${need.resourceId}’.`, `data.events[${i}].resourceNeeds[${n}]`, r.id)); if (!oneOf(need.needStatus, RESOURCE_NEED_STATUSES)) errors.push(issue("unknown_resource_need_status", `Event ‘${r.title}’ has an unknown resource need status.`, `data.events[${i}].resourceNeeds[${n}].needStatus`, r.id)); if (need.allocatedTo && !members.has(need.allocatedTo)) errors.push(issue("missing_member_reference", `Event ‘${r.title}’ allocates a resource to missing member ‘${need.allocatedTo}’.`, `data.events[${i}].resourceNeeds[${n}].allocatedTo`, r.id)); });
    r.prepTasks?.forEach((task, n) => { task.ownerIds?.forEach((id) => { if (!members.has(id)) errors.push(issue("missing_prep_owner", `Prep task ‘${task.title}’ for event ‘${r.title}’ references missing owner ‘${id}’.`, `data.events[${i}].prepTasks[${n}].ownerIds`, r.id)); }); if (!oneOf(task.status, PREP_TASK_STATUSES)) errors.push(issue("unknown_prep_status", `Prep task ‘${task.title}’ has an unknown status.`, `data.events[${i}].prepTasks[${n}].status`, r.id)); if (!oneOf(task.priority, PREP_TASK_PRIORITIES)) errors.push(issue("unknown_prep_priority", `Prep task ‘${task.title}’ has an unknown priority.`, `data.events[${i}].prepTasks[${n}].priority`, r.id)); if (task.dueAt && !validIso(task.dueAt)) errors.push(issue("invalid_prep_date", `Prep task ‘${task.title}’ has an invalid due date.`, `data.events[${i}].prepTasks[${n}].dueAt`, r.id)); });
  });

  d.eventSeries.forEach((r, i) => {
    requireFields(r as unknown as Record<string, unknown>, ["id", "title", "category", "status", "recurrence", "defaultParticipants", "defaultResponsibleAdults", "defaultResourceNeeds", "defaultPrepTasks", "exceptions", "createdAt", "updatedAt"], "routine", i, errors);
    if (!oneOf(r.category, EVENT_CATEGORIES)) errors.push(issue("unknown_category", `Routine ‘${r.title}’ has an unknown category.`, `data.eventSeries[${i}].category`, r.id));
    if (!oneOf(r.status, SERIES_STATUSES)) errors.push(issue("unknown_series_status", `Routine ‘${r.title}’ has an unknown status.`, `data.eventSeries[${i}].status`, r.id));
    if (!r.recurrence || !oneOf(r.recurrence.frequency, RECURRENCE_FREQUENCIES) || !validDate(r.recurrence.startDate) || (r.recurrence.endDate && !validDate(r.recurrence.endDate))) errors.push(issue("invalid_recurrence", `Routine ‘${r.title}’ has invalid recurrence details.`, `data.eventSeries[${i}].recurrence`, r.id));
    if (r.defaultPlaceId && !places.has(r.defaultPlaceId)) errors.push(issue("missing_place_reference", `Routine ‘${r.title}’ references missing place ‘${r.defaultPlaceId}’.`, `data.eventSeries[${i}].defaultPlaceId`, r.id));
    r.defaultParticipants?.forEach((id) => { if (!members.has(id)) errors.push(issue("missing_participant", `Routine ‘${r.title}’ references missing participant ‘${id}’.`, `data.eventSeries[${i}].defaultParticipants`, r.id)); });
    r.defaultResponsibleAdults?.forEach((id) => { if (!members.has(id)) errors.push(issue("missing_responsible_adult", `Routine ‘${r.title}’ references missing responsible adult ‘${id}’.`, `data.eventSeries[${i}].defaultResponsibleAdults`, r.id)); });
    r.defaultResourceNeeds?.forEach((need, n) => { if (!resources.has(need.resourceId)) errors.push(issue("missing_resource_reference", `Routine ‘${r.title}’ needs missing resource ‘${need.resourceId}’.`, `data.eventSeries[${i}].defaultResourceNeeds[${n}]`, r.id)); });
    r.defaultPrepTasks?.forEach((task, n) => task.ownerIds?.forEach((id) => { if (!members.has(id)) errors.push(issue("missing_prep_owner", `Routine prep task ‘${task.title}’ references missing owner ‘${id}’.`, `data.eventSeries[${i}].defaultPrepTasks[${n}]`, r.id)); }));
    r.exceptions?.forEach((exception, n) => { if (!nonEmptyId(exception.id) || !validDate(exception.occurrenceDate) || !oneOf(exception.type, ["cancelled", "moved", "changed"]) || (exception.movedToDate && !validDate(exception.movedToDate))) errors.push(issue("invalid_occurrence_exception", `Routine ‘${r.title}’ has an invalid occurrence exception.`, `data.eventSeries[${i}].exceptions[${n}]`, r.id)); });
  });

  d.schoolCalendars.forEach((r, i) => { requireFields(r as unknown as Record<string, unknown>, ["id", "childMemberId", "schoolName", "academicYearLabel", "timezone", "periods", "closureDays", "createdAt", "updatedAt"], "school calendar", i, errors); if (!members.has(r.childMemberId)) errors.push(issue("missing_school_child", `School calendar ‘${r.schoolName}’ references missing child ‘${r.childMemberId}’.`, `data.schoolCalendars[${i}].childMemberId`, r.id)); r.periods?.forEach((p, n) => { if (!validDate(p.startDate) || !validDate(p.endDate) || p.endDate < p.startDate || !oneOf(p.type, SCHOOL_PERIOD_TYPES)) errors.push(issue("invalid_school_period", `School calendar period ‘${p.label}’ has invalid dates or type.`, `data.schoolCalendars[${i}].periods[${n}]`, r.id)); }); r.closureDays?.forEach((c, n) => { if (!validDate(c.date) || !oneOf(c.type, SCHOOL_CLOSURE_TYPES)) errors.push(issue("invalid_school_closure", `School closure ‘${c.label}’ has an invalid date or type.`, `data.schoolCalendars[${i}].closureDays[${n}]`, r.id)); }); });
  d.schoolHalfTermConfigs.forEach((r, i) => {
    requireFields(r as unknown as Record<string, unknown>, ["id", "schoolCalendarId", "label", "startDate", "endDate", "entries", "createdAt", "updatedAt"], "school half-term", i, errors);
    if (!calendars.has(r.schoolCalendarId)) errors.push(issue("missing_school_calendar_reference", `School half-term ‘${r.label}’ references a missing calendar.`, `data.schoolHalfTermConfigs[${i}].schoolCalendarId`, r.id));
    if (!validDate(r.startDate) || !validDate(r.endDate) || r.endDate < r.startDate) errors.push(issue("invalid_half_term_range", `School half-term ‘${r.label}’ has an invalid date range.`, `data.schoolHalfTermConfigs[${i}]`, r.id));
    const dates = new Set<string>();
    r.entries?.forEach((entry, n) => { if (!validDate(entry.date) || entry.date < r.startDate || entry.date > r.endDate) errors.push(issue("invalid_school_requirement_date", `School requirement ${n + 1} has an invalid date.`, `data.schoolHalfTermConfigs[${i}].entries[${n}]`, r.id)); if (dates.has(entry.date)) errors.push(issue("duplicate_school_requirement_date", `School half-term ‘${r.label}’ contains duplicate date ${entry.date}.`, `data.schoolHalfTermConfigs[${i}].entries[${n}].date`, r.id)); dates.add(entry.date); if (entry.schoolCalendarId !== r.schoolCalendarId || entry.halfTermConfigId !== r.id) errors.push(issue("broken_school_requirement_reference", `School requirement ${entry.date} has a broken parent reference.`, `data.schoolHalfTermConfigs[${i}].entries[${n}]`, r.id)); if (!oneOf(entry.lunchType, SCHOOL_LUNCH_TYPES) || !oneOf(entry.attireType, SCHOOL_ATTIRE_TYPES)) errors.push(issue("invalid_school_requirement_type", `School requirement ${entry.date} has an unknown lunch or clothing value.`, `data.schoolHalfTermConfigs[${i}].entries[${n}]`, r.id)); });
    if (d.schoolHalfTermConfigs.some((other) => other.id !== r.id && other.schoolCalendarId === r.schoolCalendarId && other.startDate <= r.endDate && r.startDate <= other.endDate)) errors.push(issue("overlapping_half_terms", `School half-term ‘${r.label}’ overlaps another configuration.`, `data.schoolHalfTermConfigs[${i}]`, r.id));
  });
  const activeSchoolPrepKeys = new Set<string>();
  d.schoolReadinessPrepActions.forEach((r, i) => {
    requireFields(r as unknown as Record<string, unknown>, ["id", "householdId", "memberId", "schoolDate", "sourceType", "sourceKey", "sourceVersion", "title", "category", "owner", "priority", "status", "dueAt", "createdAt", "updatedAt", "originLabel"], "school readiness prep action", i, errors);
    if (!members.has(r.memberId)) errors.push(issue("missing_school_prep_member", `School prep action ‘${r.title}’ references missing member ‘${r.memberId}’.`, `data.schoolReadinessPrepActions[${i}].memberId`, r.id));
    if (!validDate(r.schoolDate) || !validIso(r.dueAt) || !validIso(r.createdAt) || !validIso(r.updatedAt) || (r.completedAt && !validIso(r.completedAt)) || (r.skippedAt && !validIso(r.skippedAt)) || (r.staleAt && !validIso(r.staleAt))) errors.push(issue("invalid_school_prep_date", `School prep action ‘${r.title}’ has an invalid date.`, `data.schoolReadinessPrepActions[${i}]`, r.id));
    if (!oneOf(r.sourceType, SCHOOL_PREP_SOURCES) || !oneOf(r.category, SCHOOL_PREP_CATEGORIES) || !oneOf(r.owner, SCHOOL_PREP_OWNERS) || !oneOf(r.status, SCHOOL_PREP_STATUSES) || !oneOf(r.priority, PREP_TASK_PRIORITIES)) errors.push(issue("invalid_school_prep_enum", `School prep action ‘${r.title}’ has an unknown type, category, owner, priority or status.`, `data.schoolReadinessPrepActions[${i}]`, r.id));
    const key = `${r.schoolDate}:${r.memberId}:${r.sourceType}:${r.sourceKey}`;
    if (r.status !== "stale" && activeSchoolPrepKeys.has(key)) errors.push(issue("duplicate_school_prep_source", `School prep action ‘${r.title}’ duplicates an active source key.`, `data.schoolReadinessPrepActions[${i}].sourceKey`, r.id));
    if (r.status !== "stale") activeSchoolPrepKeys.add(key);
  });
  const weatherSetting = d.settings.find((setting) => setting.id === "weather_settings");
  if (weatherSetting) {
    const value = weatherSetting.value;
    if (!isObject(value)) errors.push(issue("invalid_weather_settings", "Weather settings must be an object.", "data.settings.weather_settings"));
    else {
      if (typeof value.enabled !== "boolean" || typeof value.showOnDashboard !== "boolean" || typeof value.showOnToday !== "boolean" || typeof value.showOnWeek !== "boolean") errors.push(issue("invalid_weather_flags", "Weather visibility and enabled values must be true or false.", "data.settings.weather_settings.value"));
      if (!oneOf(value.provider, ["open_meteo", "manual"]) || !oneOf(value.refreshMode, ["manual", "on_app_open"])) errors.push(issue("invalid_weather_mode", "Weather provider or refresh mode is not recognised.", "data.settings.weather_settings.value"));
      if (value.latitude !== undefined && (typeof value.latitude !== "number" || value.latitude < -90 || value.latitude > 90)) errors.push(issue("invalid_weather_latitude", "Weather latitude must be between -90 and 90.", "data.settings.weather_settings.value.latitude"));
      if (value.longitude !== undefined && (typeof value.longitude !== "number" || value.longitude < -180 || value.longitude > 180)) errors.push(issue("invalid_weather_longitude", "Weather longitude must be between -180 and 180.", "data.settings.weather_settings.value.longitude"));
      if (typeof value.staleAfterHours !== "number" || value.staleAfterHours < 1 || value.staleAfterHours > 48) errors.push(issue("invalid_weather_stale_window", "Weather stale window must be between 1 and 48 hours.", "data.settings.weather_settings.value.staleAfterHours"));
    }
  }
  d.countdownTargets.forEach((r, i) => { requireFields(r as unknown as Record<string, unknown>, ["id", "title", "targetDate", "sourceType", "visibility", "createdAt", "updatedAt"], "countdown", i, errors); if (!validDate(r.targetDate)) errors.push(issue("invalid_countdown_date", `Countdown ‘${r.title}’ has an invalid target date.`, `data.countdownTargets[${i}].targetDate`, r.id)); if (!oneOf(r.sourceType, COUNTDOWN_SOURCES) || !oneOf(r.visibility, COUNTDOWN_VISIBILITIES)) errors.push(issue("invalid_countdown_type", `Countdown ‘${r.title}’ has an unknown source or visibility.`, `data.countdownTargets[${i}]`, r.id)); if (r.sourceType === "event" && r.sourceId && !events.has(r.sourceId)) errors.push(issue("missing_countdown_source", `Countdown ‘${r.title}’ references missing event ‘${r.sourceId}’.`, `data.countdownTargets[${i}].sourceId`, r.id)); if (typeof r.sourceType === "string" && r.sourceType.startsWith("school_") && r.sourceId && ![...calendars].some((id) => r.sourceId?.startsWith(`${id}:`))) errors.push(issue("missing_countdown_source", `Countdown ‘${r.title}’ references a missing school calendar.`, `data.countdownTargets[${i}].sourceId`, r.id)); });
  d.auditLog.forEach((r, i) => { if (!validIso(r.timestamp)) errors.push(issue("invalid_audit_date", `Audit entry ‘${r.id}’ has an invalid timestamp.`, `data.auditLog[${i}].timestamp`, r.id)); });

  const actualCounts = countsFor(d);
  if (!isObject(payload.recordCounts) || EXPORT_STORE_NAMES.some((store) => payload.recordCounts[store] !== actualCounts[store])) warnings.push({ severity: "warning", code: "record_counts_recalculated", message: "The backup’s stated record counts do not match its contents. Counts shown are calculated from the data." });
  return { valid: errors.length === 0, errors, warnings, payload: errors.length === 0 ? payload : undefined };
}

export async function createImportPreview(payload: ExportEnvelope): Promise<ImportPreview> {
  return { sourceAppName: payload.sourceAppName, schema: payload.schema, exportedAt: payload.exportedAt, appVersion: payload.appVersion, databaseVersion: payload.databaseVersion, importedRecordCounts: countsFor(payload.data), currentRecordCounts: await getLocalDataSummary(), mode: "replace" };
}

export async function validateAndPreviewImport(input: string): Promise<ImportValidationResult> {
  const parsed = parseImportJson(input);
  if (!parsed.ok) return { valid: false, errors: [parsed.issue], warnings: [] };
  const result = validateImportPayload(parsed.value);
  if (!result.valid || !result.payload) return result;
  return { ...result, preview: await createImportPreview(result.payload) };
}

export async function restoreFromImport(payload: ExportEnvelope): Promise<RestoreResult> {
  const validation = validateImportPayload(payload);
  if (!validation.valid) throw new Error(validation.errors[0]?.message ?? "Import validation failed.");
  const safetySnapshot = await createExportPayload();
  const restoredAt = new Date().toISOString();
  await db.transaction("rw", db.tables, async () => {
    for (const store of EXPORT_STORE_NAMES) await db.table(store).clear();
    for (const store of EXPORT_STORE_NAMES) if (payload.data[store].length) await db.table(store).bulkAdd(payload.data[store]);
    await db.weatherForecasts.clear();
    await db.syncSettings.clear();
    await db.syncDevices.clear();
    await db.syncState.clear();
    await db.syncQueue.clear();
    await db.syncConflicts.clear();
    await db.syncSettings.put(defaultSyncSettings(restoredAt));
    await db.auditLog.put({ id: `audit_restore_${Date.now()}`, entityType: "system", entityId: payload.exportId, action: "restored", timestamp: restoredAt, summary: "Restored local data from backup" });
  });
  await markAllSyncableRecordsDirty("Restored local data has not yet been synced.");
  return { restored: true, restoredAt, recordCounts: countsFor(payload.data), safetySnapshot };
}

export async function resetLocalDataAndReseed(): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.transaction("rw", db.tables, async () => {
    for (const store of EXPORT_STORE_NAMES) await db.table(store).clear();
    await db.weatherForecasts.clear();
    await clearLocalSyncMetadataForReset();
    await db.syncSettings.clear();
    await db.households.add(seedHousehold);
    await db.familyMembers.bulkAdd(seedFamilyMembers);
    await db.resources.bulkAdd(seedResources);
    await db.templates.bulkAdd(seedTemplates);
    await db.schoolCalendars.add(seedSchoolCalendar);
    await db.countdownTargets.bulkAdd(seedCountdownTargets);
    await db.settings.bulkAdd([...seedSettings, { id: "initial_seed_completed", value: timestamp, description: "Timestamp of the initial Tranche 0 seed" }, { id: "school_calendar_seed_completed", value: timestamp }, { id: "countdown_seed_completed", value: timestamp }]);
    await db.syncSettings.add(defaultSyncSettings(timestamp));
    await db.auditLog.add({ id: `audit_reset_${Date.now()}`, entityType: "system", entityId: "local_database", action: "reset", timestamp, summary: "Reset local data and reseeded baseline records" });
  });
}
