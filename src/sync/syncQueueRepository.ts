import { db } from "../data/db";
import type { SyncQueueItem, SyncQueueOperation } from "../domain/types";

function queueId(entityType: string, entityId: string) {
  return `${entityType}:${entityId}`;
}

export async function replaceSyncQueue(items: Array<{ entityType: string; entityId: string; operation: SyncQueueOperation }>) {
  const queuedAt = new Date().toISOString();
  await db.syncQueue.clear();
  if (!items.length) return [];
  const records: SyncQueueItem[] = items.map((item) => ({
    id: queueId(item.entityType, item.entityId),
    entityType: item.entityType,
    entityId: item.entityId,
    operation: item.operation,
    queuedAt,
  }));
  await db.syncQueue.bulkPut(records);
  return records;
}

export async function getSyncQueueCount() {
  return db.syncQueue.count();
}
