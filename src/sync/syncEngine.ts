import { db } from "../data/db";
import { getHousehold } from "../data/repositories";
import { ensureSyncDevice, getSyncSettings, updateSyncSettings } from "../data/repositories/syncRepository";
import { getCurrentSession } from "./authService";
import { getOpenSyncConflictCount, getSyncConflictById, updateSyncConflictStatus, upsertSyncConflict } from "./syncConflictRepository";
import { getSyncQueueCount, replaceSyncQueue } from "./syncQueueRepository";
import { createRemoteHousehold, listLinkedHouseholdsForUser, listRemoteSyncEntities, upsertRemoteSyncEntity } from "./remoteSyncRepository";
import { listLocalSyncRecords, toRemoteSyncEntity } from "./syncSerialiser";
import { getAllSyncState, getSyncStateByEntity, putSyncState } from "./syncStateRepository";
import { getSyncEntityDefinition, getSyncEntityTitle } from "./syncEntityRegistry";
import { hashPayload } from "./syncHasher";
import type { RemoteSyncEntity, SyncRunResult } from "./syncTypes";

function normaliseTimestamp(value?: string | null) {
  return value && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

export async function createCloudHouseholdFromThisDevice(): Promise<{ ok: true } | { ok: false; message: string }> {
  const sessionResult = await getCurrentSession();
  if (!sessionResult.ok || !sessionResult.value?.user) {
    return { ok: false, message: "Sign in before creating a cloud household." };
  }
  const household = await getHousehold();
  if (!household) return { ok: false, message: "No local household was found on this device." };
  try {
    const link = await createRemoteHousehold(sessionResult.value.user, household.name);
    await updateSyncSettings({
      enabled: true,
      householdId: link.householdId,
      userId: sessionResult.value.user.id,
      lastSyncMessage: "Cloud household linked. Local records remain the live source until you sync.",
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Cloud household could not be created." };
  }
}

export async function linkFirstRemoteHousehold(): Promise<{ ok: true } | { ok: false; message: string }> {
  const sessionResult = await getCurrentSession();
  if (!sessionResult.ok || !sessionResult.value?.user) return { ok: false, message: "Sign in before linking a household." };
  try {
    const householdIds = await listLinkedHouseholdsForUser(sessionResult.value.user.id);
    if (!householdIds.length) return { ok: false, message: "No remote household memberships were found for this account." };
    await updateSyncSettings({
      enabled: true,
      householdId: householdIds[0],
      userId: sessionResult.value.user.id,
      lastSyncMessage: "Linked to the first remote household available to this account.",
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Household linking failed." };
  }
}

export async function runManualSync(): Promise<SyncRunResult> {
  const emptyStats = { pulled: 0, pushed: 0, conflicts: 0, queueCount: await getSyncQueueCount() };
  const settings = await getSyncSettings();
  if (!settings.supabaseConfigured) return { ok: false, message: "Sync is unavailable until Supabase is configured.", stats: emptyStats };
  const sessionResult = await getCurrentSession();
  if (!sessionResult.ok || !sessionResult.value?.user) return { ok: false, message: "Sign in to sync this device.", stats: emptyStats };
  if (!settings.householdId) return { ok: false, message: "Link a cloud household before syncing.", stats: emptyStats };
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { ok: false, message: "Sync is unavailable while this device is offline.", stats: emptyStats };

  await ensureSyncDevice();

  const now = new Date().toISOString();
  const localRecords = await listLocalSyncRecords();
  const localByKey = new Map(localRecords.map((item) => [`${item.entityType}:${item.entityId}`, item]));
  const previousState = await getAllSyncState();
  const stateByKey = new Map(previousState.map((item) => [`${item.entityType}:${item.entityId}`, item]));
  const remoteEntities = await listRemoteSyncEntities(settings.householdId);
  const remoteByKey = new Map(remoteEntities.map((item) => [`${item.entity_type}:${item.entity_id}`, item]));

  const queueItems: Array<{ entityType: string; entityId: string; operation: "upsert" | "delete" }> = [];
  let pulled = 0;
  let pushed = 0;
  let conflicts = 0;

  for (const localRecord of localRecords) {
    const key = `${localRecord.entityType}:${localRecord.entityId}`;
    const state = stateByKey.get(key);
    const remote = remoteByKey.get(key);
    const localDirty = !state || state.localPayloadHash !== localRecord.payloadHash || state.deleted;
    if (!remote) {
      queueItems.push({ entityType: localRecord.entityType, entityId: localRecord.entityId, operation: "upsert" });
      continue;
    }
    if (remote.deleted_at) {
      if (!localDirty) {
        await applyRemoteDeletion(localRecord.entityType, localRecord.entityId, remote, now);
        pulled += 1;
      } else {
        await recordConflict(localRecord, remote, state?.remoteUpdatedAt);
        conflicts += 1;
      }
      continue;
    }
    if (localRecord.payloadHash === remote.payload_hash) {
      await putSyncState({
        entityType: localRecord.entityType,
        entityId: localRecord.entityId,
        localUpdatedAt: localRecord.localUpdatedAt,
        remoteUpdatedAt: remote.server_updated_at,
        lastSyncedAt: now,
        localPayloadHash: localRecord.payloadHash,
        remotePayloadHash: remote.payload_hash,
        dirty: false,
        deleted: false,
      });
      continue;
    }

    const remoteChangedSinceSync = !state?.remotePayloadHash || state.remotePayloadHash !== remote.payload_hash;
    if (!localDirty && remoteChangedSinceSync) {
      await applyRemoteUpsert(localRecord.entityType, remote, now);
      pulled += 1;
      continue;
    }
    if (localDirty && !remoteChangedSinceSync) {
      queueItems.push({ entityType: localRecord.entityType, entityId: localRecord.entityId, operation: "upsert" });
      continue;
    }
    await recordConflict(localRecord, remote, state?.remoteUpdatedAt);
    conflicts += 1;
  }

  for (const remote of remoteEntities) {
    const key = `${remote.entity_type}:${remote.entity_id}`;
    if (localByKey.has(key)) continue;
    const state = stateByKey.get(key);
    if (remote.deleted_at) {
      await putSyncState({
        entityType: remote.entity_type,
        entityId: remote.entity_id,
        localUpdatedAt: state?.localUpdatedAt,
        remoteUpdatedAt: remote.server_updated_at,
        lastSyncedAt: now,
        localPayloadHash: state?.localPayloadHash,
        remotePayloadHash: remote.payload_hash,
        dirty: false,
        deleted: true,
      });
      continue;
    }
    if (state?.deleted) {
      await recordConflict(undefined, remote, state.remoteUpdatedAt);
      conflicts += 1;
      continue;
    }
    await applyRemoteUpsert(remote.entity_type, remote, now);
    pulled += 1;
  }

  for (const state of previousState) {
    const key = `${state.entityType}:${state.entityId}`;
    if (localByKey.has(key)) continue;
    const remote = remoteByKey.get(key);
    if (state.deleted && remote?.deleted_at) continue;
    queueItems.push({ entityType: state.entityType, entityId: state.entityId, operation: "delete" });
  }

  await replaceSyncQueue(queueItems);

  const remainingQueueItems: typeof queueItems = [];
  for (const item of queueItems) {
    if (await getSyncConflictById(`conflict:${item.entityType}:${item.entityId}`)) {
      remainingQueueItems.push(item);
      continue;
    }
    if (item.operation === "upsert") {
      const localRecord = localByKey.get(`${item.entityType}:${item.entityId}`);
      if (!localRecord) continue;
      const remote = await toRemoteSyncEntity(settings.householdId, localRecord);
      await upsertRemoteSyncEntity(remote);
      await putSyncState({
        entityType: item.entityType,
        entityId: item.entityId,
        localUpdatedAt: localRecord.localUpdatedAt,
        remoteUpdatedAt: now,
        lastSyncedAt: now,
        localPayloadHash: localRecord.payloadHash,
        remotePayloadHash: localRecord.payloadHash,
        dirty: false,
        deleted: false,
      });
      pushed += 1;
      continue;
    }
    const existingState = await getSyncStateByEntity(item.entityType, item.entityId);
    const remote = remoteByKey.get(`${item.entityType}:${item.entityId}`);
    await upsertRemoteSyncEntity({
      household_id: settings.householdId,
      entity_type: item.entityType,
      entity_id: item.entityId,
      payload: remote?.payload ?? {},
      payload_hash: remote?.payload_hash ?? existingState?.remotePayloadHash ?? "deleted",
      schema_version: remote?.schema_version ?? "tombstone",
      client_updated_at: now,
      server_updated_at: now,
      deleted_at: now,
      updated_by: sessionResult.value.user.id,
    });
    await putSyncState({
      entityType: item.entityType,
      entityId: item.entityId,
      localUpdatedAt: existingState?.localUpdatedAt,
      remoteUpdatedAt: now,
      lastSyncedAt: now,
      localPayloadHash: existingState?.localPayloadHash,
      remotePayloadHash: remote?.payload_hash ?? existingState?.remotePayloadHash,
      dirty: false,
      deleted: true,
    });
    pushed += 1;
  }
  await replaceSyncQueue(remainingQueueItems);

  const queueCount = await getSyncQueueCount();
  const conflictCount = await getOpenSyncConflictCount();
  const ok = conflicts === 0;
  const message = ok
    ? pushed || pulled
      ? `Sync finished. Pulled ${pulled} and pushed ${pushed} record changes.`
      : "Sync finished. Everything already matched."
    : `Sync finished with ${conflicts} conflict${conflicts === 1 ? "" : "s"} to review.`;

  await updateSyncSettings({
    enabled: true,
    userId: sessionResult.value.user.id,
    lastAuthCheckAt: now,
    lastSyncAt: now,
    lastSyncStatus: ok ? "success" : "warning",
    lastSyncMessage: message,
    queueCount,
    conflictCount,
    restoredSinceLastSync: false,
  });

  return { ok, message, stats: { pulled, pushed, conflicts, queueCount } };
}

async function applyRemoteUpsert(entityType: string, remote: RemoteSyncEntity, syncedAt: string) {
  const definition = getSyncEntityDefinition(entityType);
  if (!definition) return;
  await db.table(definition.tableName).put(remote.payload);
  await putSyncState({
    entityType,
    entityId: remote.entity_id,
    localUpdatedAt: normaliseTimestamp(remote.client_updated_at),
    remoteUpdatedAt: remote.server_updated_at,
    lastSyncedAt: syncedAt,
    localPayloadHash: remote.payload_hash,
    remotePayloadHash: remote.payload_hash,
    dirty: false,
    deleted: false,
  });
}

async function applyRemoteDeletion(entityType: string, entityId: string, remote: RemoteSyncEntity, syncedAt: string) {
  const definition = getSyncEntityDefinition(entityType);
  if (!definition) return;
  await db.table(definition.tableName).delete(entityId);
  await putSyncState({
    entityType,
    entityId,
    localUpdatedAt: undefined,
    remoteUpdatedAt: remote.server_updated_at,
    lastSyncedAt: syncedAt,
    localPayloadHash: undefined,
    remotePayloadHash: remote.payload_hash,
    dirty: false,
    deleted: true,
  });
}

async function recordConflict(
  localRecord: { entityType: string; entityId: string; payload: unknown; localUpdatedAt: string } | undefined,
  remote: RemoteSyncEntity,
  previousRemoteUpdatedAt?: string,
) {
  await upsertSyncConflict({
    entityType: localRecord?.entityType ?? remote.entity_type,
    entityId: localRecord?.entityId ?? remote.entity_id,
    localPayload: localRecord?.payload ?? null,
    remotePayload: remote.payload,
    localUpdatedAt: localRecord?.localUpdatedAt,
    remoteUpdatedAt: remote.server_updated_at,
    detectedAt: new Date().toISOString(),
    status: "open",
    reason: previousRemoteUpdatedAt
      ? "Both local and cloud versions changed since the last successful sync."
      : "This record was changed in both places before a common synced baseline existed.",
  });
}

export async function resolveSyncConflictKeepLocal(id: string) {
  const conflict = await getSyncConflictById(id);
  const settings = await getSyncSettings();
  if (!conflict || !settings.householdId) throw new Error("Conflict could not be resolved.");
  const localPayload = conflict.localPayload as Record<string, unknown> | null;
  if (!localPayload) throw new Error("No local payload is available for this conflict.");
  const localUpdatedAt = typeof localPayload.updatedAt === "string" ? localPayload.updatedAt : new Date().toISOString();
  const payloadHash = await hashPayload(localPayload);
  await upsertRemoteSyncEntity({
    household_id: settings.householdId,
    entity_type: conflict.entityType,
    entity_id: conflict.entityId,
    payload: localPayload,
    payload_hash: payloadHash,
    schema_version: "manual_resolution",
    client_updated_at: localUpdatedAt,
    server_updated_at: new Date().toISOString(),
    deleted_at: null,
    updated_by: settings.userId,
  });
  await putSyncState({
    entityType: conflict.entityType,
    entityId: conflict.entityId,
    localUpdatedAt,
    remoteUpdatedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    localPayloadHash: payloadHash,
    remotePayloadHash: payloadHash,
    dirty: false,
    deleted: false,
  });
  await updateSyncConflictStatus(id, "resolved_keep_local");
}

export async function resolveSyncConflictKeepCloud(id: string) {
  const conflict = await getSyncConflictById(id);
  if (!conflict) throw new Error("Conflict could not be resolved.");
  const remotePayload = conflict.remotePayload as Record<string, unknown>;
  await db.table(getSyncEntityDefinition(conflict.entityType)?.tableName ?? conflict.entityType).put(remotePayload);
  await putSyncState({
    entityType: conflict.entityType,
    entityId: conflict.entityId,
    localUpdatedAt: normaliseTimestamp(conflict.remoteUpdatedAt),
    remoteUpdatedAt: conflict.remoteUpdatedAt,
    lastSyncedAt: new Date().toISOString(),
    localPayloadHash: await hashPayload(remotePayload),
    remotePayloadHash: await hashPayload(remotePayload),
    dirty: false,
    deleted: false,
  });
  await updateSyncConflictStatus(id, "resolved_keep_remote");
}

export function describeSyncConflict(conflict: { entityType: string; localPayload: unknown; remotePayload: unknown }) {
  return getSyncEntityTitle(conflict.entityType, conflict.localPayload ?? conflict.remotePayload);
}

export async function markAllSyncableRecordsDirty(message: string) {
  await db.transaction("rw", [db.syncState, db.syncSettings, db.syncQueue], async () => {
    await db.syncState.clear();
    await db.syncQueue.clear();
    await updateSyncSettings({
      lastSyncStatus: "warning",
      lastSyncMessage: message,
      restoredSinceLastSync: true,
    });
  });
}

export async function clearLocalSyncMetadataForReset() {
  await db.syncDevices.clear();
  await db.syncState.clear();
  await db.syncQueue.clear();
  await db.syncConflicts.clear();
}
