import type {
  AuditLogEntry,
  HouseholdAdminItem,
  HouseholdAdminItemInput,
  HouseholdAdminItemPatch,
} from "../../domain/types";
import { validateHouseholdAdminItemInput } from "../../domain/validation/householdAdminValidation";
import { createId } from "../../utils/ids";
import { db } from "../db";

async function validateInput(input: HouseholdAdminItemInput) {
  const [members, resources, places] = await Promise.all([
    db.familyMembers.toArray(),
    db.resources.toArray(),
    db.places.toArray(),
  ]);
  validateHouseholdAdminItemInput(input, { members, resources, places });
}

function sortItems(items: HouseholdAdminItem[]) {
  return [...items].sort((left, right) =>
    Number(left.status === "archived") - Number(right.status === "archived")
      || (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31")
      || left.title.localeCompare(right.title),
  );
}

function cleanInput(input: HouseholdAdminItemInput, createdAt?: string): HouseholdAdminItem {
  const now = new Date().toISOString();
  return {
    ...input,
    id: createId("household_admin"),
    title: input.title.trim(),
    providerName: input.providerName?.trim() || undefined,
    referenceLabel: input.referenceLabel?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    reminderDaysBefore: input.reminderDaysBefore?.length ? [...new Set(input.reminderDaysBefore)].sort((left, right) => right - left) : undefined,
    costCurrency: input.costAmount !== undefined ? "GBP" : undefined,
    createdAt: createdAt ?? now,
    updatedAt: now,
    archivedAt: input.status === "archived" ? now : undefined,
  };
}

export async function listHouseholdAdminItems() {
  return sortItems(await db.householdAdminItems.toArray());
}

export async function listHouseholdAdminItemsByStatus(status: HouseholdAdminItem["status"]) {
  return sortItems(await db.householdAdminItems.where("status").equals(status).toArray());
}

export async function listHouseholdAdminItemsByDueDateRange(startDate: string, endDate: string) {
  return sortItems(await db.householdAdminItems.where("dueDate").between(startDate, endDate, true, true).toArray());
}

export function getHouseholdAdminItemById(id: string) {
  return db.householdAdminItems.get(id);
}

export async function createHouseholdAdminItem(input: HouseholdAdminItemInput): Promise<HouseholdAdminItem> {
  await validateInput(input);
  const item = cleanInput(input);
  const timestamp = item.updatedAt;
  await db.transaction("rw", [db.householdAdminItems, db.auditLog], async () => {
    await db.householdAdminItems.add(item);
    const audit: AuditLogEntry = {
      id: createId("audit"),
      entityType: "household_admin",
      entityId: item.id,
      action: "created",
      timestamp,
      summary: `Created household admin item ${item.title}`,
    };
    await db.auditLog.add(audit);
  });
  return item;
}

export async function updateHouseholdAdminItem(id: string, patch: HouseholdAdminItemPatch): Promise<HouseholdAdminItem> {
  const existing = await db.householdAdminItems.get(id);
  if (!existing) throw new Error("Household admin item not found.");
  const input: HouseholdAdminItemInput = {
    title: patch.title ?? existing.title,
    category: patch.category ?? existing.category,
    adminType: patch.adminType ?? existing.adminType,
    status: patch.status ?? existing.status,
    dueDate: "dueDate" in patch ? patch.dueDate : existing.dueDate,
    startDate: "startDate" in patch ? patch.startDate : existing.startDate,
    lastCompletedDate: "lastCompletedDate" in patch ? patch.lastCompletedDate : existing.lastCompletedDate,
    renewalCycle: patch.renewalCycle ?? existing.renewalCycle,
    customCycleMonths: "customCycleMonths" in patch ? patch.customCycleMonths : existing.customCycleMonths,
    ownerMemberId: "ownerMemberId" in patch ? patch.ownerMemberId : existing.ownerMemberId,
    relatedResourceId: "relatedResourceId" in patch ? patch.relatedResourceId : existing.relatedResourceId,
    relatedPlaceId: "relatedPlaceId" in patch ? patch.relatedPlaceId : existing.relatedPlaceId,
    providerName: "providerName" in patch ? patch.providerName : existing.providerName,
    referenceLabel: "referenceLabel" in patch ? patch.referenceLabel : existing.referenceLabel,
    costAmount: "costAmount" in patch ? patch.costAmount : existing.costAmount,
    costCurrency: "costCurrency" in patch ? patch.costCurrency : existing.costCurrency,
    reminderDaysBefore: "reminderDaysBefore" in patch ? patch.reminderDaysBefore : existing.reminderDaysBefore,
    notes: "notes" in patch ? patch.notes : existing.notes,
  };
  await validateInput(input);
  const next = {
    ...existing,
    ...cleanInput(input, existing.createdAt),
    id: existing.id,
  };
  await db.transaction("rw", [db.householdAdminItems, db.auditLog], async () => {
    await db.householdAdminItems.put(next);
    await db.auditLog.add({
      id: createId("audit"),
      entityType: "household_admin",
      entityId: id,
      action: "updated",
      timestamp: next.updatedAt,
      summary: `Updated household admin item ${next.title}`,
    });
  });
  return next;
}

export async function archiveHouseholdAdminItem(id: string) {
  return updateHouseholdAdminItem(id, { status: "archived" });
}
