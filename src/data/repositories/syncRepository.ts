import { getSupabaseAvailability } from "../../sync/supabaseConfig";
import type { SyncSettings } from "../../domain/types";
import { db } from "../db";

export const SYNC_SETTINGS_ID = "sync_settings";

export function defaultSyncSettings(now = new Date().toISOString()): SyncSettings {
  return {
    id: SYNC_SETTINGS_ID,
    enabled: false,
    supabaseConfigured: getSupabaseAvailability().configured,
    lastSyncStatus: "never",
    lastSyncMessage: "Sync is not active yet.",
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
