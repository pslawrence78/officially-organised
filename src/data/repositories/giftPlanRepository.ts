import { CARD_STATUSES, GIFT_STATUSES, RSVP_STATUSES } from "../../domain/constants";
import type {
  AuditLogEntry,
  GiftPlan,
  GiftPlanInput,
  GiftPlanPatch,
} from "../../domain/types";
import { validDateKey } from "../../utils/celebrations";
import { createId } from "../../utils/ids";
import { db } from "../db";
import { getEventById } from "./eventRepository";

function sortGiftPlans(items: GiftPlan[]) {
  return [...items].sort((left, right) =>
    Number(left.archived) - Number(right.archived)
      || (left.targetDate ?? "9999-12-31").localeCompare(right.targetDate ?? "9999-12-31")
      || left.recipientName.localeCompare(right.recipientName),
  );
}

async function validateGiftPlan(input: GiftPlanInput) {
  const adults = await db.familyMembers.filter((member) => member.memberType === "adult").toArray();
  const adultIds = new Set(adults.map((member) => member.id));
  if (!await db.celebrationOccasions.get(input.celebrationId)) throw new Error("Choose a valid celebration.");
  if (!input.recipientName.trim()) throw new Error("Give the gift plan a recipient name.");
  if (input.recipientMemberId && !await db.familyMembers.get(input.recipientMemberId)) throw new Error("The selected recipient is no longer available.");
  if (input.linkedEventId && !await getEventById(input.linkedEventId)) throw new Error("The linked event could not be found.");
  if (input.responsibleAdultId && !adultIds.has(input.responsibleAdultId)) throw new Error("Gift plans can only be assigned to Phil or Beck.");
  if (!GIFT_STATUSES.includes(input.giftStatus)) throw new Error("Choose a valid gift status.");
  if (!CARD_STATUSES.includes(input.cardStatus)) throw new Error("Choose a valid card status.");
  if (!RSVP_STATUSES.includes(input.rsvpStatus)) throw new Error("Choose a valid RSVP status.");
  for (const [label, value] of [["target date", input.targetDate], ["buy-by date", input.buyBy], ["wrap-by date", input.wrapBy], ["take-by date", input.takeBy]] as const) {
    if (value && !validDateKey(value)) throw new Error(`Choose a valid ${label}.`);
  }
}

export async function listGiftPlans() {
  return sortGiftPlans(await db.giftPlans.toArray());
}

export async function listGiftPlansForCelebration(celebrationId: string) {
  return sortGiftPlans(await db.giftPlans.where("celebrationId").equals(celebrationId).toArray());
}

export async function listGiftPlansForEvent(eventId: string) {
  return sortGiftPlans(await db.giftPlans.where("linkedEventId").equals(eventId).toArray());
}

export async function getGiftPlanById(id: string) {
  return db.giftPlans.get(id);
}

export async function createGiftPlan(input: GiftPlanInput): Promise<GiftPlan> {
  await validateGiftPlan(input);
  const timestamp = new Date().toISOString();
  const giftPlan: GiftPlan = {
    ...input,
    id: createId("gift"),
    recipientName: input.recipientName.trim(),
    giftSummary: input.giftSummary?.trim() || undefined,
    budgetNote: input.budgetNote?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    linkedPrepTaskIds: [...new Set(input.linkedPrepTaskIds ?? [])],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await db.transaction("rw", [db.giftPlans, db.auditLog], async () => {
    await db.giftPlans.add(giftPlan);
    const audit: AuditLogEntry = {
      id: createId("audit"),
      entityType: "giftPlan",
      entityId: giftPlan.id,
      action: "created",
      timestamp,
      summary: `Created gift plan for ${giftPlan.recipientName}`,
    };
    await db.auditLog.add(audit);
  });
  return giftPlan;
}

export async function updateGiftPlan(id: string, patch: GiftPlanPatch): Promise<GiftPlan> {
  const existing = await db.giftPlans.get(id);
  if (!existing) throw new Error("Gift plan not found.");
  const input: GiftPlanInput = {
    celebrationId: patch.celebrationId ?? existing.celebrationId,
    linkedEventId: "linkedEventId" in patch ? patch.linkedEventId : existing.linkedEventId,
    recipientMemberId: "recipientMemberId" in patch ? patch.recipientMemberId : existing.recipientMemberId,
    recipientName: patch.recipientName ?? existing.recipientName,
    responsibleAdultId: "responsibleAdultId" in patch ? patch.responsibleAdultId : existing.responsibleAdultId,
    giftSummary: "giftSummary" in patch ? patch.giftSummary : existing.giftSummary,
    giftStatus: patch.giftStatus ?? existing.giftStatus,
    cardStatus: patch.cardStatus ?? existing.cardStatus,
    rsvpStatus: patch.rsvpStatus ?? existing.rsvpStatus,
    targetDate: "targetDate" in patch ? patch.targetDate : existing.targetDate,
    buyBy: "buyBy" in patch ? patch.buyBy : existing.buyBy,
    wrapBy: "wrapBy" in patch ? patch.wrapBy : existing.wrapBy,
    takeBy: "takeBy" in patch ? patch.takeBy : existing.takeBy,
    budgetNote: "budgetNote" in patch ? patch.budgetNote : existing.budgetNote,
    linkedPrepTaskIds: patch.linkedPrepTaskIds ?? existing.linkedPrepTaskIds,
    notes: "notes" in patch ? patch.notes : existing.notes,
    archived: patch.archived ?? existing.archived,
  };
  await validateGiftPlan(input);
  const timestamp = new Date(Math.max(Date.now(), Date.parse(existing.updatedAt) + 1)).toISOString();
  const giftPlan: GiftPlan = {
    ...existing,
    ...input,
    recipientName: input.recipientName.trim(),
    giftSummary: input.giftSummary?.trim() || undefined,
    budgetNote: input.budgetNote?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    linkedPrepTaskIds: [...new Set(input.linkedPrepTaskIds ?? [])],
    updatedAt: timestamp,
  };
  await db.transaction("rw", [db.giftPlans, db.auditLog], async () => {
    await db.giftPlans.put(giftPlan);
    await db.auditLog.add({
      id: createId("audit"),
      entityType: "giftPlan",
      entityId: giftPlan.id,
      action: "updated",
      timestamp,
      summary: `Updated gift plan for ${giftPlan.recipientName}`,
    });
  });
  return giftPlan;
}

export async function archiveGiftPlan(id: string) {
  return updateGiftPlan(id, { archived: true });
}
