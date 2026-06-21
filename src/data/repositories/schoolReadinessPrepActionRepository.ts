import { db } from "../db";
import type { SchoolPrepStatus, SchoolReadinessPrepAction } from "../../domain/types";

export function listSchoolPrepActionsByDate(date: string) {
  return db.schoolReadinessPrepActions.where("schoolDate").equals(date).sortBy("dueAt");
}

export function listSchoolPrepActionsByRange(startDate: string, endDate: string) {
  return db.schoolReadinessPrepActions.where("schoolDate").between(startDate, endDate, true, true).sortBy("dueAt");
}

export async function listOpenSchoolPrepActionsByRange(startDate: string, endDate: string) {
  const values = await listSchoolPrepActionsByRange(startDate, endDate);
  return values.filter((item) => item.status === "open");
}

export function getSchoolPrepActionById(id: string) {
  return db.schoolReadinessPrepActions.get(id);
}

export function exportSchoolPrepActions() {
  return db.schoolReadinessPrepActions.toArray();
}

export function deleteAllSchoolPrepActionsForRestore() {
  return db.schoolReadinessPrepActions.clear();
}

export async function bulkUpsertSchoolPrepActions(actions: SchoolReadinessPrepAction[]) {
  if (actions.length) await db.schoolReadinessPrepActions.bulkPut(actions);
}

export async function setSchoolPrepActionStatus(id: string, status: Exclude<SchoolPrepStatus, "stale">) {
  const action = await db.schoolReadinessPrepActions.get(id);
  if (!action || action.status === status) return action;
  const now = new Date().toISOString();
  const next: SchoolReadinessPrepAction = {
    ...action, status, updatedAt: now,
    completedAt: status === "done" ? now : undefined,
    skippedAt: status === "skipped" ? now : undefined,
    staleAt: undefined, staleReason: undefined,
  };
  await db.transaction("rw", db.schoolReadinessPrepActions, db.auditLog, async () => {
    await db.schoolReadinessPrepActions.put(next);
    await db.auditLog.put({ id: `audit_school_prep_${id}_${Date.now()}`, entityType: "school_readiness_prep_action", entityId: id, action: status === "open" ? "reopened" : status === "done" ? "completed" : "skipped", timestamp: now, summary: `${status === "open" ? "Reopened" : status === "done" ? "Completed" : "Skipped"} school readiness prep action: ${action.title}` });
  });
  return next;
}

export async function markSchoolPrepActionsStale(ids: string[], reason: string) {
  if (!ids.length) return;
  const now = new Date().toISOString();
  await db.transaction("rw", db.schoolReadinessPrepActions, db.auditLog, async () => {
    const actions = (await db.schoolReadinessPrepActions.bulkGet(ids)).filter((item): item is SchoolReadinessPrepAction => Boolean(item && item.status === "open"));
    await db.schoolReadinessPrepActions.bulkPut(actions.map((item) => ({ ...item, status: "stale", staleAt: now, staleReason: reason, updatedAt: now })));
    await db.auditLog.bulkPut(actions.map((item) => ({ id: `audit_school_prep_stale_${item.id}_${Date.now()}`, entityType: "school_readiness_prep_action", entityId: item.id, action: "marked_stale", timestamp: now, summary: `Marked school readiness prep action stale: ${item.title}` })));
  });
}
