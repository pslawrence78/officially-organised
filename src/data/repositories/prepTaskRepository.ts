import { cleanPrepTask, validatePrepTask } from "../../domain/validation/prepTaskValidation";
import type { NewPrepTaskInput, PrepTask, PrepTaskStatus, PrepTaskUpdates, PrepTaskWithEvent } from "../../domain/types";
import { createId } from "../../utils/ids";
import { db } from "../db";

async function getEventAndAdults(eventId: string) {
  const [event, familyMembers] = await Promise.all([db.events.get(eventId), db.familyMembers.toArray()]);
  if (!event) throw new Error("Event not found");
  return { event, familyMembers };
}

export async function addPrepTask(eventId: string, input: NewPrepTaskInput): Promise<PrepTask> {
  const { event, familyMembers } = await getEventAndAdults(eventId);
  const errors = validatePrepTask(input, familyMembers);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const timestamp = new Date(Math.max(Date.now(), Date.parse(event.updatedAt) + 1)).toISOString();
  const task: PrepTask = { ...cleanPrepTask(input), id: createId("prep"), createdAt: timestamp, updatedAt: timestamp };
  const updatedEvent = { ...event, prepTasks: [...event.prepTasks, task], updatedAt: timestamp };

  await db.transaction("rw", [db.events, db.auditLog], async () => {
    await db.events.put(updatedEvent);
    await db.auditLog.add({ id: createId("audit"), entityType: "prepTask", entityId: task.id, action: "created", timestamp, summary: `Added ${task.title} to ${event.title}` });
  });
  return task;
}

export async function updatePrepTask(eventId: string, taskId: string, updates: PrepTaskUpdates): Promise<PrepTask> {
  const { event, familyMembers } = await getEventAndAdults(eventId);
  const existing = event.prepTasks.find((task) => task.id === taskId);
  if (!existing) throw new Error("Preparation task not found");
  const input: NewPrepTaskInput = {
    title: updates.title ?? existing.title,
    ownerIds: updates.ownerIds ?? existing.ownerIds,
    dueAt: "dueAt" in updates ? updates.dueAt : existing.dueAt,
    priority: updates.priority ?? existing.priority,
    status: updates.status ?? existing.status,
    blocksEvent: updates.blocksEvent ?? existing.blocksEvent,
    notes: "notes" in updates ? updates.notes : existing.notes,
  };
  const errors = validatePrepTask(input, familyMembers);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const timestamp = new Date(Math.max(Date.now(), Date.parse(existing.updatedAt) + 1)).toISOString();
  const task: PrepTask = { ...existing, ...cleanPrepTask(input), updatedAt: timestamp };
  const updatedEvent = { ...event, prepTasks: event.prepTasks.map((item) => item.id === taskId ? task : item), updatedAt: timestamp };

  await db.transaction("rw", [db.events, db.auditLog], async () => {
    await db.events.put(updatedEvent);
    await db.auditLog.add({ id: createId("audit"), entityType: "prepTask", entityId: task.id, action: "updated", timestamp, summary: `Updated ${task.title} for ${event.title}` });
  });
  return task;
}

export async function setPrepTaskStatus(eventId: string, taskId: string, status: PrepTaskStatus) {
  return updatePrepTask(eventId, taskId, { status });
}

export async function deletePrepTask(eventId: string, taskId: string): Promise<void> {
  const { event } = await getEventAndAdults(eventId);
  const task = event.prepTasks.find((item) => item.id === taskId);
  if (!task) return;
  const timestamp = new Date(Math.max(Date.now(), Date.parse(event.updatedAt) + 1)).toISOString();
  const updatedEvent = { ...event, prepTasks: event.prepTasks.filter((item) => item.id !== taskId), updatedAt: timestamp };
  await db.transaction("rw", [db.events, db.auditLog], async () => {
    await db.events.put(updatedEvent);
    await db.auditLog.add({ id: createId("audit"), entityType: "prepTask", entityId: task.id, action: "deleted", timestamp, summary: `Removed ${task.title} from ${event.title}` });
  });
}

export async function getPrepTasks(): Promise<PrepTaskWithEvent[]> {
  const events = await db.events.toArray();
  return events
    .flatMap((event) => event.prepTasks.map((task) => ({ task, event })))
    .sort((a, b) => {
      if (a.task.status === "open" && b.task.status !== "open") return -1;
      if (a.task.status !== "open" && b.task.status === "open") return 1;
      if (!a.task.dueAt && b.task.dueAt) return 1;
      if (a.task.dueAt && !b.task.dueAt) return -1;
      return (a.task.dueAt ?? a.event.startAt).localeCompare(b.task.dueAt ?? b.event.startAt);
    });
}
