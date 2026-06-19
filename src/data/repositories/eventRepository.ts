import { validateEventInput, EventValidationError } from "../../domain/validation/eventValidation";
import type { FamilyEvent, FamilyEventInput, FamilyEventUpdates } from "../../domain/types";
import { dateKeyToIsoStart, isoToDateKey, addDaysToDateKey } from "../../utils/dates";
import { createId } from "../../utils/ids";
import { db } from "../db";

async function assertValidEvent(input: FamilyEventInput) {
  const [familyMembers, places] = await Promise.all([
    db.familyMembers.toArray(),
    db.places.toArray(),
  ]);
  const errors = validateEventInput(input, familyMembers, places);
  if (Object.keys(errors).length > 0) throw new EventValidationError(errors);
}

export async function createEvent(input: FamilyEventInput): Promise<FamilyEvent> {
  await assertValidEvent(input);
  const timestamp = new Date().toISOString();
  const event: FamilyEvent = {
    ...input,
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    id: createId("event"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.transaction("rw", [db.events, db.auditLog], async () => {
    await db.events.add(event);
    await db.auditLog.add({
      id: createId("audit"),
      entityType: "event",
      entityId: event.id,
      action: "created",
      timestamp,
      summary: `Created ${event.title}`,
    });
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
    notes: "notes" in updates ? updates.notes : existing.notes,
    seriesId: "seriesId" in updates ? updates.seriesId : existing.seriesId,
    templateId: "templateId" in updates ? updates.templateId : existing.templateId,
  };
  await assertValidEvent(input);

  const timestamp = new Date(Math.max(Date.now(), Date.parse(existing.updatedAt) + 1)).toISOString();
  const event: FamilyEvent = {
    ...existing,
    ...input,
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    updatedAt: timestamp,
  };

  await db.transaction("rw", [db.events, db.auditLog], async () => {
    await db.events.put(event);
    await db.auditLog.add({
      id: createId("audit"),
      entityType: "event",
      entityId: id,
      action: "updated",
      timestamp,
      summary: `Updated ${event.title}`,
    });
  });

  return event;
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
  return db.events.get(id);
}

export async function getEvents() {
  return db.events.orderBy("startAt").toArray();
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
  return db.events
    .where("startAt")
    .below(endIso)
    .filter((event) => event.endAt > startIso)
    .sortBy("startAt");
}
