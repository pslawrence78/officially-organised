import { getSupabaseAvailability } from "../../sync/supabaseConfig";
import type { SyncDevice, SyncSettings } from "../../domain/types";
import { db } from "../db";
import { createId } from "../../utils/ids";

export const SYNC_SETTINGS_ID = "sync_settings";
export const THIS_DEVICE_LABEL = "This device";

export function defaultSyncSettings(now = new Date().toISOString()): SyncSettings {
  return {
    id: SYNC_SETTINGS_ID,
    enabled: false,
    paused: false,
    firstSyncConfirmed: false,
    supabaseConfigured: getSupabaseAvailability().configured,
    lastSyncStatus: "never",
    lastSyncMessage: "Sync is not active yet.",
    queueCount: 0,
    conflictCount: 0,
    restoredSinceLastSync: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function ensureSyncMetadata(): Promise<SyncSettings> {
  const existing = await db.syncSettings.get(SYNC_SETTINGS_ID);
  const configured = getSupabaseAvailability().configured;
  if (existing) {
    if (existing.supabaseConfigured === configured) return existing;
    const updated = { ...existing, supabaseConfigured: configured, updatedAt: new Date().toISOString() };
    await db.syncSettings.put(updated);
    return updated;
  }

  const settings = defaultSyncSettings();
  await db.syncSettings.put(settings);
  return settings;
}

export async function getSyncSettings(): Promise<SyncSettings> {
  return ensureSyncMetadata();
}

export async function setSyncPrepared(enabled: boolean): Promise<SyncSettings> {
  const current = await ensureSyncMetadata();
  const updated = {
    ...current,
    enabled,
    paused: enabled ? false : current.paused,
    supabaseConfigured: getSupabaseAvailability().configured,
    lastSyncStatus: "never" as const,
    lastSyncMessage: enabled ? "Sync is enabled on this device. First cloud push still needs confirmation." : "Sync is paused on this device.",
    updatedAt: new Date().toISOString(),
  };
  await db.syncSettings.put(updated);
  return updated;
}

export async function pauseSync(): Promise<SyncSettings> {
  return updateSyncSettings({
    enabled: false,
    paused: true,
    lastSyncStatus: "warning",
    lastSyncMessage: "Sync is paused. Local data remains available and the cloud link is kept.",
  });
}

export async function resumeSync(): Promise<SyncSettings> {
  return updateSyncSettings({
    enabled: true,
    paused: false,
    lastSyncStatus: "warning",
    lastSyncMessage: "Sync has been resumed. Use Sync now when you are ready.",
  });
}

export async function confirmFirstSync(): Promise<SyncSettings> {
  return updateSyncSettings({
    firstSyncConfirmed: true,
    lastSyncMessage: "First sync guidance confirmed. Sync now can push local records to Supabase.",
  });
}

export async function disconnectSyncDevice(): Promise<SyncSettings> {
  const current = await ensureSyncMetadata();
  await db.transaction("rw", [db.syncDevices, db.syncState, db.syncQueue, db.syncConflicts, db.syncSettings], async () => {
    await db.syncDevices.clear();
    await db.syncState.clear();
    await db.syncQueue.clear();
    await db.syncConflicts.clear();
    await db.syncSettings.put({
      ...defaultSyncSettings(),
      supabaseConfigured: getSupabaseAvailability().configured,
      lastSyncStatus: "warning",
      lastSyncMessage: "This device was disconnected from Supabase. Local family data was kept.",
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    });
  });
  return ensureSyncMetadata();
}

export async function ensureSyncDevice(now = new Date().toISOString()): Promise<SyncDevice> {
  const settings = await ensureSyncMetadata();
  if (settings.deviceId) {
    const existing = await db.syncDevices.get(settings.deviceId);
    if (existing) {
      const updated = { ...existing, lastSeenAt: now };
      await db.syncDevices.put(updated);
      if (settings.deviceLabel !== updated.label) {
        await db.syncSettings.put({ ...settings, deviceLabel: updated.label, updatedAt: now });
      }
      return updated;
    }
  }

  const device: SyncDevice = {
    id: createId("device"),
    label: THIS_DEVICE_LABEL,
    createdAt: now,
    lastSeenAt: now,
  };
  await db.transaction("rw", [db.syncDevices, db.syncSettings], async () => {
    await db.syncDevices.put(device);
    await db.syncSettings.put({ ...settings, deviceId: device.id, deviceLabel: device.label, updatedAt: now });
  });
  return device;
}

export async function updateSyncSettings(patch: Partial<SyncSettings>): Promise<SyncSettings> {
  const current = await ensureSyncMetadata();
  const updated = {
    ...current,
    ...patch,
    supabaseConfigured: getSupabaseAvailability().configured,
    updatedAt: new Date().toISOString(),
  };
  await db.syncSettings.put(updated);
  return updated;
}
