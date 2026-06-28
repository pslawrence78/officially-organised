import { db } from "../data/db";
import type { SyncConflict, SyncConflictStatus } from "../domain/types";

function conflictId(entityType: string, entityId: string) {
  return `conflict:${entityType}:${entityId}`;
}

export async function upsertSyncConflict(conflict: Omit<SyncConflict, "id">) {
  const record: SyncConflict = { ...conflict, id: conflictId(conflict.entityType, conflict.entityId) };
  await db.syncConflicts.put(record);
  return record;
}

export async function getOpenSyncConflicts() {
  return db.syncConflicts.where("status").equals("open").toArray();
}

export async function getOpenSyncConflictCount() {
  return db.syncConflicts.where("status").equals("open").count();
}

export async function updateSyncConflictStatus(id: string, status: SyncConflictStatus) {
  await db.syncConflicts.update(id, { status });
}

export async function getSyncConflictById(id: string) {
  return db.syncConflicts.get(id);
}
