import { db } from "../data/db";
import type { SyncState } from "../domain/types";

function syncStateId(entityType: string, entityId: string) {
  return `${entityType}:${entityId}`;
}

export async function getAllSyncState() {
  return db.syncState.toArray();
}

export async function getSyncStateByEntity(entityType: string, entityId: string) {
  return db.syncState.get(syncStateId(entityType, entityId));
}

export async function putSyncState(state: Omit<SyncState, "id">) {
  const record: SyncState = { ...state, id: syncStateId(state.entityType, state.entityId) };
  await db.syncState.put(record);
  return record;
}

export async function deleteSyncState(entityType: string, entityId: string) {
  await db.syncState.delete(syncStateId(entityType, entityId));
}
