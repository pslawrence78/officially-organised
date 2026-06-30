import { validateEventInput, EventValidationError } from "../../domain/validation/eventValidation";
import { cleanPrepTask } from "../../domain/validation/prepTaskValidation";
import { cleanResourceNeed } from "../../domain/validation/resourceNeedValidation";
import type { AuditLogEntry, FamilyEvent, FamilyEventInput, FamilyEventUpdates, PrepTask, ResourceNeed } from "../../domain/types";
import { dateKeyToIsoStart, isoToDateKey, addDaysToDateKey, currentDateKey } from "../../utils/dates";
import { createId } from "../../utils/ids";
import { db } from "../db";
import { expandAllSeriesForRange, expandSeriesForRange } from "../../domain/series/seriesService";

async function assertValidEvent(input: FamilyEventInput) {
  const [familyMembers, places, resources] = await Promise.all([
    db.familyMembers.toArray(),
    db.places.toArray(),
    db.resources.toArray(),
  ]);
  const errors = validateEventInput(input, familyMembers, places, resources);
  if (Object.keys(errors).length > 0) throw new EventValidationError(errors);
}

export async function createEvent(input: FamilyEventInput): Promise<FamilyEvent> {
  await assertValidEvent(input);
  const timestamp = new Date().toISOString();
  const event: FamilyEvent = {
    ...input,
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    prepTasks: input.prepTasks.map((task) => cleanPrepTask(task)),
    resourceNeeds: input.resourceNeeds.map((need) => cleanResourceNeed(need)),
    id: createId("event"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.transaction("rw", [db.events, db.auditLog], async () => {
    await db.events.add(event);
    const auditEntries: AuditLogEntry[] = [{
      id: createId("audit"),
      entityType: "event",
      entityId: event.id,
      action: "created",
      timestamp,
      summary: `Created ${event.title}`,
    }, ...event.prepTasks.map((task) => ({
      id: createId("audit"),
      entityType: "prepTask",
      entityId: task.id,
      action: "created",
      timestamp,
      summary: `Added ${task.title} to ${event.title}`,
    })), ...event.resourceNeeds.map((need) => ({
      id: createId("audit"),
      entityType: "resourceNeed",
      entityId: need.id,
      action: "created",
      timestamp,
      summary: `Added ${need.needStatus} ${need.resourceId} need to ${event.title}`,
    }))];
    await db.auditLog.bulkAdd(auditEntries);
  });

  return event;
}

export async function updateEvent(id: string, updates: FamilyEventUpdates): Promise<FamilyEvent> {
  const existing = await db.events.get(id);
  if (!existing) throw new Error("Event not found");

  const input: FamilyEventInput = {
    title: updates.title ?? existing.title,
    category: updates.category ?? existing.category,
    status: updates.status ?? existing.status,
    startAt: updates.startAt ?? existing.startAt,
    endAt: updates.endAt ?? existing.endAt,
    allDay: updates.allDay ?? existing.allDay,
    placeId: "placeId" in updates ? updates.placeId : existing.placeId,
    participants: updates.participants ?? existing.participants,
    responsibleAdults: updates.responsibleAdults ?? existing.responsibleAdults,
    prepTasks: updates.prepTasks ?? existing.prepTasks,
    resourceNeeds: updates.resourceNeeds ?? existing.resourceNeeds,
    notes: "notes" in updates ? updates.notes : existing.notes,
    seriesId: "seriesId" in updates ? updates.seriesId : existing.seriesId,
    occurrenceDate: "occurrenceDate" in updates ? updates.occurrenceDate : existing.occurrenceDate,
    templateId: "templateId" in updates ? updates.templateId : existing.templateId,
  };
  await assertValidEvent(input);

  const timestamp = new Date(Math.max(Date.now(), Date.parse(existing.updatedAt) + 1)).toISOString();
  const event: FamilyEvent = {
    ...existing,
    ...input,
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    prepTasks: input.prepTasks.map((task) => cleanPrepTask(task)),
    resourceNeeds: input.resourceNeeds.map((need) => cleanResourceNeed(need)),
    updatedAt: timestamp,
  };

  await db.transaction("rw", [db.events, db.auditLog], async () => {
    await db.events.put(event);
    const auditEntries: AuditLogEntry[] = [{
      id: createId("audit"),
      entityType: "event",
      entityId: id,
      action: "updated",
      timestamp,
      summary: `Updated ${event.title}`,
    }, ...prepTaskAuditEntries(existing.prepTasks, event.prepTasks, event.title, timestamp), ...resourceNeedAuditEntries(existing.resourceNeeds, event.resourceNeeds, event.title, timestamp)];
    await db.auditLog.bulkAdd(auditEntries);
  });

  return event;
}

function resourceNeedAuditEntries(previous: ResourceNeed[], current: ResourceNeed[], eventTitle: string, timestamp: string): AuditLogEntry[] {
  const previousById = new Map(previous.map((need) => [need.id, need]));
  const currentById = new Map(current.map((need) => [need.id, need]));
  const entries: AuditLogEntry[] = [];
  for (const need of current) {
    const oldNeed = previousById.get(need.id);
    if (!oldNeed) entries.push({ id: createId("audit"), entityType: "resourceNeed", entityId: need.id, action: "created", timestamp, summary: `Added ${need.needStatus} car need to ${eventTitle}` });
    else if (JSON.stringify(oldNeed) !== JSON.stringify(need)) entries.push({ id: createId("audit"), entityType: "resourceNeed", entityId: need.id, action: "updated", timestamp, summary: `Updated car need for ${eventTitle}` });
  }
  for (const need of previous) {
    if (!currentById.has(need.id)) entries.push({ id: createId("audit"), entityType: "resourceNeed", entityId: need.id, action: "deleted", timestamp, summary: `Removed car need from ${eventTitle}` });
  }
  return entries;
}

function prepTaskAuditEntries(previous: PrepTask[], current: PrepTask[], eventTitle: string, timestamp: string): AuditLogEntry[] {
  const previousById = new Map(previous.map((task) => [task.id, task]));
  const currentById = new Map(current.map((task) => [task.id, task]));
  const entries: AuditLogEntry[] = [];

  for (const task of current) {
    const oldTask = previousById.get(task.id);
    if (!oldTask) {
      entries.push({ id: createId("audit"), entityType: "prepTask", entityId: task.id, action: "created", timestamp, summary: `Added ${task.title} to ${eventTitle}` });
    } else if (JSON.stringify(oldTask) !== JSON.stringify(task)) {
      entries.push({ id: createId("audit"), entityType: "prepTask", entityId: task.id, action: "updated", timestamp, summary: `Updated ${task.title} for ${eventTitle}` });
    }
  }

  for (const task of previous) {
    if (!currentById.has(task.id)) entries.push({ id: createId("audit"), entityType: "prepTask", entityId: task.id, action: "deleted", timestamp, summary: `Removed ${task.title} from ${eventTitle}` });
  }
  return entries;
}

export async function deleteEvent(id: string): Promise<void> {
  const existing = await db.events.get(id);
  if (!existing) return;
  const timestamp = new Date().toISOString();

  await db.transaction("rw", [db.events, db.auditLog], async () => {
    await db.events.delete(id);
    await db.auditLog.add({
      id: createId("audit"),
      entityType: "event",
      entityId: id,
      action: "deleted",
      timestamp,
      summary: `Deleted ${existing.title}`,
    });
  });
}

export async function getEventById(id: string) {
  const stored = await db.events.get(id); if (stored) return stored;
  const match = /^occurrence_(.+)_(\d{4}-\d{2}-\d{2})$/.exec(id); if (!match) return undefined;
  const series = await db.eventSeries.get(match[1]); if (!series) return undefined;
  const target = series.exceptions.find((item) => item.occurrenceDate === match[2])?.movedToDate ?? match[2];
  const [calendar, materialised] = await Promise.all([db.schoolCalendars.toCollection().first(), db.events.filter((event) => Boolean(event.seriesId && event.occurrenceDate)).toArray()]);
  return expandSeriesForRange(series, target, addDaysToDateKey(target, 1), { schoolCalendar: calendar, materialisedEvents: materialised }).find((event) => event.id === id);
}

export async function getEvents() {
  const today = currentDateKey();
  // Unbounded consumers still use a bounded operational horizon for generated
  // series, but keep enough recent history for dense-week and overdue-task views.
  return getEventsForDateRange(dateKeyToIsoStart(addDaysToDateKey(today, -30)), dateKeyToIsoStart(addDaysToDateKey(today, 90)));
}

function dateKeyFromInput(date: Date | string) {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return isoToDateKey((date instanceof Date ? date : new Date(date)).toISOString());
}

export async function getEventsForDate(date: Date | string) {
  const dateKey = dateKeyFromInput(date);
  return getEventsForDateRange(
    new Date(dateKeyToIsoStart(dateKey)),
    new Date(dateKeyToIsoStart(addDaysToDateKey(dateKey, 1))),
  );
}

export async function getEventsForDateRange(start: Date | string, end: Date | string) {
  const startIso = (start instanceof Date ? start : new Date(start)).toISOString();
  const endIso = (end instanceof Date ? end : new Date(end)).toISOString();
  const stored = await db.events
    .where("startAt")
    .below(endIso)
    .filter((event) => event.endAt > startIso)
    .sortBy("startAt");
  const [series, calendar, materialised] = await Promise.all([db.eventSeries.toArray(), db.schoolCalendars.toCollection().first(), db.events.filter((event) => Boolean(event.seriesId && event.occurrenceDate)).toArray()]);
  const generated = expandAllSeriesForRange(series, isoToDateKey(startIso), isoToDateKey(endIso), { schoolCalendar: calendar, materialisedEvents: materialised }).filter((event) => event.startAt < endIso && event.endAt > startIso);
  return [...stored, ...generated].sort((a, b) => a.startAt.localeCompare(b.startAt));
}
