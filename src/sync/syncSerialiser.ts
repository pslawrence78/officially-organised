import { db } from "../data/db";
import { APP_DATA_SCHEMA } from "../domain/constants";
import { SYNC_ENTITY_DEFINITIONS, type SyncEntityDefinition } from "./syncEntityRegistry";
import { hashPayload } from "./syncHasher";
import type { RemoteSyncEntity } from "./syncTypes";

export interface LocalSyncRecord {
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  localUpdatedAt: string;
}

function inferUpdatedAt(definition: SyncEntityDefinition, payload: Record<string, unknown>) {
  const raw = definition.updatedAtField ? payload[definition.updatedAtField] : undefined;
  return typeof raw === "string" && raw.length > 0 ? raw : new Date(0).toISOString();
}

export async function listLocalSyncRecords(): Promise<LocalSyncRecord[]> {
  const results: LocalSyncRecord[] = [];
  for (const definition of SYNC_ENTITY_DEFINITIONS) {
    const records = await db.table(definition.tableName).toArray();
    for (const value of records) {
      const payload = value as Record<string, unknown>;
      results.push({
        entityType: definition.entityType,
        entityId: String(payload.id),
        payload,
        payloadHash: await hashPayload(payload),
        localUpdatedAt: inferUpdatedAt(definition, payload),
      });
    }
  }
  return results;
}

export async function toRemoteSyncEntity(householdId: string, record: LocalSyncRecord): Promise<RemoteSyncEntity> {
  return {
    household_id: householdId,
    entity_type: record.entityType,
    entity_id: record.entityId,
    payload: record.payload,
    payload_hash: record.payloadHash,
    schema_version: APP_DATA_SCHEMA,
    client_updated_at: record.localUpdatedAt,
    server_updated_at: new Date(0).toISOString(),
    deleted_at: null,
    updated_by: null,
  };
}
