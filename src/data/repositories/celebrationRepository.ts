import {
  CELEBRATION_OCCASION_TYPES,
  CELEBRATION_RECURRENCES,
  CELEBRATION_RELATIONSHIP_CONTEXTS,
  CELEBRATION_STATUSES,
} from "../../domain/constants";
import type {
  AuditLogEntry,
  CelebrationOccasion,
  CelebrationOccasionInput,
  CelebrationOccasionPatch,
} from "../../domain/types";
import { validDateKey } from "../../utils/celebrations";
import { createId } from "../../utils/ids";
import { db } from "../db";
import { getEventById } from "./eventRepository";

function sortCelebrations(items: CelebrationOccasion[]) {
  return [...items].sort((left, right) =>
    left.status === right.status
      ? left.date.localeCompare(right.date) || left.title.localeCompare(right.title)
      : left.status === "archived"
        ? 1
        : right.status === "archived"
          ? -1
          : left.date.localeCompare(right.date),
  );
}

async function validateCelebration(input: CelebrationOccasionInput) {
  const adults = await db.familyMembers.filter((member) => member.memberType === "adult").toArray();
  const adultIds = new Set(adults.map((member) => member.id));
  if (!input.householdId.trim()) throw new Error("Choose a valid household.");
  if (!input.title.trim()) throw new Error("Give the occasion a title.");
  if (!CELEBRATION_OCCASION_TYPES.includes(input.occasionType)) throw new Error("Choose a valid occasion type.");
  if (!CELEBRATION_RECURRENCES.includes(input.recurrence)) throw new Error("Choose a valid recurrence.");
  if (!CELEBRATION_STATUSES.includes(input.status)) throw new Error("Choose a valid occasion status.");
  if (!validDateKey(input.date)) throw new Error("Choose a valid occasion date.");
  if (input.relationshipContext && !CELEBRATION_RELATIONSHIP_CONTEXTS.includes(input.relationshipContext)) throw new Error("Choose a valid relationship context.");
  if (input.linkedMemberId && !await db.familyMembers.get(input.linkedMemberId)) throw new Error("The linked family member no longer exists.");
  if (input.linkedEventId && !await getEventById(input.linkedEventId)) throw new Error("The linked event could not be found.");
  if (input.ownerAdultIds.some((id) => !adultIds.has(id))) throw new Error("Celebration ownership can only be assigned to Phil or Beck.");
}

export async function listCelebrations() {
  return sortCelebrations(await db.celebrationOccasions.toArray());
}

export async function listUpcomingCelebrations(fromDate: string, toDate: string) {
  const items = await db.celebrationOccasions
    .where("date")
    .between(fromDate, toDate, true, true)
    .filter((item) => item.status !== "archived")
    .toArray();
  return sortCelebrations(items);
}

export async function getCelebrationById(id: string) {
  return db.celebrationOccasions.get(id);
}

export async function createCelebration(input: CelebrationOccasionInput): Promise<CelebrationOccasion> {
  await validateCelebration(input);
  const timestamp = new Date().toISOString();
  const celebration: CelebrationOccasion = {
    ...input,
    id: createId("celebration"),
    title: input.title.trim(),
    recipientName: input.recipientName?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    ownerAdultIds: [...new Set(input.ownerAdultIds)],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.transaction("rw", [db.celebrationOccasions, db.auditLog], async () => {
    await db.celebrationOccasions.add(celebration);
    const audit: AuditLogEntry = {
      id: createId("audit"),
      entityType: "celebration",
      entityId: celebration.id,
      action: "created",
      timestamp,
      summary: `Created celebration ${celebration.title}`,
    };
    await db.auditLog.add(audit);
  });

  return celebration;
}

export async function updateCelebration(id: string, patch: CelebrationOccasionPatch): Promise<CelebrationOccasion> {
  const existing = await db.celebrationOccasions.get(id);
  if (!existing) throw new Error("Celebration not found.");
  const input: CelebrationOccasionInput = {
    householdId: patch.householdId ?? existing.householdId,
    title: patch.title ?? existing.title,
    occasionType: patch.occasionType ?? existing.occasionType,
    date: patch.date ?? existing.date,
    recurrence: patch.recurrence ?? existing.recurrence,
    linkedEventId: "linkedEventId" in patch ? patch.linkedEventId : existing.linkedEventId,
    linkedMemberId: "linkedMemberId" in patch ? patch.linkedMemberId : existing.linkedMemberId,
    recipientName: "recipientName" in patch ? patch.recipientName : existing.recipientName,
    relationshipContext: "relationshipContext" in patch ? patch.relationshipContext : existing.relationshipContext,
    ownerAdultIds: patch.ownerAdultIds ?? existing.ownerAdultIds,
    status: patch.status ?? existing.status,
    notes: "notes" in patch ? patch.notes : existing.notes,
  };
  await validateCelebration(input);
  const timestamp = new Date(Math.max(Date.now(), Date.parse(existing.updatedAt) + 1)).toISOString();
  const celebration: CelebrationOccasion = {
    ...existing,
    ...input,
    title: input.title.trim(),
    recipientName: input.recipientName?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    ownerAdultIds: [...new Set(input.ownerAdultIds)],
    updatedAt: timestamp,
  };

  await db.transaction("rw", [db.celebrationOccasions, db.auditLog], async () => {
    await db.celebrationOccasions.put(celebration);
    await db.auditLog.add({
      id: createId("audit"),
      entityType: "celebration",
      entityId: celebration.id,
      action: "updated",
      timestamp,
      summary: `Updated celebration ${celebration.title}`,
    });
  });
  return celebration;
}

export async function archiveCelebration(id: string) {
  return updateCelebration(id, { status: "archived" });
}
