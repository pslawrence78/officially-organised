import { EventSeriesValidationError, validateEventSeries } from "../../domain/validation/eventSeriesValidation";
import type { AuditLogEntry, EventSeries, EventSeriesException, EventSeriesInput, EventSeriesPatch, PrepTask, ResourceNeed } from "../../domain/types";
import { createId } from "../../utils/ids";
import { db } from "../db";

async function validate(input: EventSeriesInput) {
  const [members, places, resources] = await Promise.all([db.familyMembers.toArray(), db.places.toArray(), db.resources.toArray()]);
  const errors = validateEventSeries(input, members, places, resources);
  if (Object.keys(errors).length) throw new EventSeriesValidationError(errors);
}

function cleaned(input: EventSeriesInput): EventSeriesInput {
  return { ...input, title: input.title.trim(), notes: input.notes?.trim() || undefined,
    defaultParticipants: [...input.defaultParticipants], defaultResponsibleAdults: [...input.defaultResponsibleAdults],
    defaultResourceNeeds: input.defaultResourceNeeds.map((item) => ({ ...item })), defaultPrepTasks: input.defaultPrepTasks.map((item) => ({ ...item, title: item.title.trim(), ownerIds: [...item.ownerIds] })),
    exceptions: input.exceptions.map((item) => ({ ...item })), recurrence: { ...input.recurrence } };
}

async function writeAudit(series: EventSeries, action: string, timestamp: string) {
  const entry: AuditLogEntry = { id: createId("audit"), entityType: "eventSeries", entityId: series.id, action, timestamp, summary: `${action === "created" ? "Created" : "Updated"} routine ${series.title}` };
  await db.auditLog.add(entry);
}

export async function createSeries(input: EventSeriesInput) {
  await validate(input); const timestamp = new Date().toISOString();
  const series: EventSeries = { ...cleaned(input), id: createId("series"), createdAt: timestamp, updatedAt: timestamp };
  await db.transaction("rw", [db.eventSeries, db.auditLog], async () => { await db.eventSeries.add(series); await writeAudit(series, "created", timestamp); });
  return series;
}

export async function updateSeries(id: string, patch: EventSeriesPatch) {
  const existing = await db.eventSeries.get(id); if (!existing) throw new Error("Routine not found");
  const input = cleaned({ ...existing, ...patch, recurrence: patch.recurrence ? { ...existing.recurrence, ...patch.recurrence } : existing.recurrence });
  await validate(input); const timestamp = new Date(Math.max(Date.now(), Date.parse(existing.updatedAt) + 1)).toISOString();
  const series: EventSeries = { ...input, id, createdAt: existing.createdAt, updatedAt: timestamp };
  await db.transaction("rw", [db.eventSeries, db.auditLog], async () => { await db.eventSeries.put(series); await writeAudit(series, "updated", timestamp); });
  return series;
}

export const getSeries = () => db.eventSeries.orderBy("id").toArray();
export const getSeriesById = (id: string) => db.eventSeries.get(id);
export const pauseSeries = (id: string) => updateSeries(id, { status: "paused" }).then(() => undefined);
export const archiveSeries = (id: string) => updateSeries(id, { status: "archived" }).then(() => undefined);

async function changeException(seriesId: string, occurrenceDate: string, patch: Partial<EventSeriesException> & Pick<EventSeriesException, "type">) {
  const series = await db.eventSeries.get(seriesId); if (!series) throw new Error("Routine not found");
  const previous = series.exceptions.find((item) => item.occurrenceDate === occurrenceDate);
  const timestamp = new Date().toISOString();
  const exception: EventSeriesException = { ...previous, ...patch, id: previous?.id ?? createId("exception"), occurrenceDate, createdAt: previous?.createdAt ?? timestamp, updatedAt: timestamp };
  await updateSeries(seriesId, { exceptions: [...series.exceptions.filter((item) => item.occurrenceDate !== occurrenceDate), exception] });
  return exception;
}

export const cancelOccurrence = (seriesId: string, occurrenceDate: string) => changeException(seriesId, occurrenceDate, { type: "cancelled" });
export const moveOccurrence = (seriesId: string, occurrenceDate: string, newDate: string, newStartTime?: string, newDurationMinutes?: number) => changeException(seriesId, occurrenceDate, { type: "moved", movedToDate: newDate, movedToStartTime: newStartTime, movedToDurationMinutes: newDurationMinutes });
export const changeOccurrenceResponsibility = (seriesId: string, occurrenceDate: string, responsibleAdults: string[]) => changeException(seriesId, occurrenceDate, { type: "changed", responsibleAdults });
export const changeOccurrenceResources = (seriesId: string, occurrenceDate: string, resourceNeeds: ResourceNeed[]) => changeException(seriesId, occurrenceDate, { type: "changed", resourceNeeds });
export const changeOccurrencePrep = (seriesId: string, occurrenceDate: string, prepTasks: PrepTask[]) => changeException(seriesId, occurrenceDate, { type: "changed", prepTasks });
export async function clearOccurrenceException(seriesId: string, occurrenceDate: string) { const series = await db.eventSeries.get(seriesId); if (series) await updateSeries(seriesId, { exceptions: series.exceptions.filter((item) => item.occurrenceDate !== occurrenceDate) }); }
