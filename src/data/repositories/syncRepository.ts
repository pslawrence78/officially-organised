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
    supabaseConfigured: getSupabaseAvailability().configured,
    lastSyncStatus: "never" as const,
    lastSyncMessage: enabled ? "This device is prepared for a future sync tranche." : "Sync preparation is off on this device.",
    updatedAt: new Date().toISOString(),
  };
  await db.syncSettings.put(updated);
  return updated;
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
