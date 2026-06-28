import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../data/db";
import { createPlace, getSyncSettings, saveSetting, seedInitialDataIfNeeded } from "../data/repositories";
import { runManualSync } from "./syncEngine";
import { hashPayload } from "./syncHasher";
import { putSyncState } from "./syncStateRepository";

const remoteState = {
  entities: [] as Array<Record<string, unknown>>,
  linkedHouseholds: ["remote-household-1"],
};

vi.mock("./authService", () => ({
  getCurrentSession: vi.fn(async () => ({ ok: true, value: { user: { id: "user_1", email: "phil@example.com" } } })),
}));

vi.mock("./remoteSyncRepository", () => ({
  createRemoteHousehold: vi.fn(),
  listLinkedHouseholdsForUser: vi.fn(async () => remoteState.linkedHouseholds),
  listRemoteSyncEntities: vi.fn(async () => remoteState.entities),
  upsertRemoteSyncEntity: vi.fn(async (entity) => {
    const index = remoteState.entities.findIndex((item) => item.entity_type === entity.entity_type && item.entity_id === entity.entity_id);
    if (index >= 0) remoteState.entities[index] = entity;
    else remoteState.entities.push(entity);
  }),
}));

describe("syncEngine", () => {
  beforeEach(async () => {
    remoteState.entities = [];
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
    await saveSetting("weather_settings", { enabled: true }, "Weather");
  });

  it("blocks safely when Supabase is not configured", async () => {
    const syncRepository = await import("../data/repositories/syncRepository");
    vi.spyOn(syncRepository, "getSyncSettings").mockResolvedValueOnce({
      ...(await getSyncSettings()),
      supabaseConfigured: false,
    });
    const result = await runManualSync();
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/unavailable until Supabase is configured/i);
  });

  it("blocks safely when no user session exists", async () => {
    const auth = await import("./authService");
    vi.mocked(auth.getCurrentSession).mockResolvedValueOnce({ ok: true, value: null });
    const result = await runManualSync();
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Sign in/i);
  });

  it("pushes a local-only record", async () => {
    await db.syncSettings.update("sync_settings", { supabaseConfigured: true, householdId: "remote-household-1" });
    await createPlace({ name: "Library", placeType: "other" });
    const result = await runManualSync();
    expect(result.ok).toBe(true);
    expect(result.stats.pushed).toBeGreaterThan(0);
    expect(remoteState.entities.some((item) => item.entity_type === "places")).toBe(true);
  });

  it("pulls a remote-only record", async () => {
    await db.syncSettings.update("sync_settings", { supabaseConfigured: true, householdId: "remote-household-1" });
    remoteState.entities.push({
      household_id: "remote-household-1",
      entity_type: "places",
      entity_id: "place_remote",
      payload: { id: "place_remote", name: "Remote Hall", placeType: "other", createdAt: "2026-06-28T10:00:00.000Z", updatedAt: "2026-06-28T10:00:00.000Z" },
      payload_hash: "hash_remote",
      schema_version: "test",
      client_updated_at: "2026-06-28T10:00:00.000Z",
      server_updated_at: "2026-06-28T10:00:01.000Z",
      deleted_at: null,
      updated_by: "user_1",
    });
    const result = await runManualSync();
    expect(result.ok).toBe(true);
    expect(result.stats.pulled).toBeGreaterThan(0);
    expect(await db.places.get("place_remote")).toBeTruthy();
  });

  it("does nothing when hashes already match", async () => {
    await db.syncSettings.update("sync_settings", { supabaseConfigured: true, householdId: "remote-household-1" });
    await createPlace({ name: "Cinema", placeType: "other" });
    await runManualSync();
    const beforeCount = remoteState.entities.length;
    const result = await runManualSync();
    expect(result.ok).toBe(true);
    expect(result.stats.pulled).toBe(0);
    expect(remoteState.entities.length).toBe(beforeCount);
  });

  it("creates a conflict when local and remote changed differently", async () => {
    await db.syncSettings.update("sync_settings", { supabaseConfigured: true, householdId: "remote-household-1" });
    const place = await createPlace({ name: "Playgroup", placeType: "other" });
    await putSyncState({
      entityType: "places",
      entityId: place.id,
      localUpdatedAt: place.updatedAt,
      remoteUpdatedAt: "2026-06-28T09:00:00.000Z",
      lastSyncedAt: "2026-06-28T09:00:00.000Z",
      localPayloadHash: "old_local_hash",
      remotePayloadHash: "old_remote_hash",
      dirty: false,
      deleted: false,
    });
    remoteState.entities.push({
      household_id: "remote-household-1",
      entity_type: "places",
      entity_id: place.id,
      payload: { ...place, name: "Cloud playgroup" },
      payload_hash: "new_remote_hash",
      schema_version: "test",
      client_updated_at: place.updatedAt,
      server_updated_at: "2026-06-28T10:00:00.000Z",
      deleted_at: null,
      updated_by: "user_1",
    });
    const result = await runManualSync();
    expect(result.ok).toBe(false);
    expect(result.stats.conflicts).toBeGreaterThan(0);
    expect(await db.syncConflicts.count()).toBeGreaterThan(0);
  });

  it("marks remote tombstones as deleted locally", async () => {
    await db.syncSettings.update("sync_settings", { supabaseConfigured: true, householdId: "remote-household-1" });
    const place = await createPlace({ name: "Old Hall", placeType: "other" });
    const payloadHash = await hashPayload(place);
    await putSyncState({
      entityType: "places",
      entityId: place.id,
      localUpdatedAt: place.updatedAt,
      remoteUpdatedAt: place.updatedAt,
      lastSyncedAt: place.updatedAt,
      localPayloadHash: payloadHash,
      remotePayloadHash: payloadHash,
      dirty: false,
      deleted: false,
    });
    remoteState.entities.push({
      household_id: "remote-household-1",
      entity_type: "places",
      entity_id: place.id,
      payload: { ...place },
      payload_hash: payloadHash,
      schema_version: "test",
      client_updated_at: place.updatedAt,
      server_updated_at: "2026-06-28T10:00:00.000Z",
      deleted_at: "2026-06-28T10:00:00.000Z",
      updated_by: "user_1",
    });
    const result = await runManualSync();
    expect(result.ok).toBe(true);
    expect(await db.places.get(place.id)).toBeUndefined();
  });

  it("records restore warnings without auto-push metadata", async () => {
    await db.syncSettings.update("sync_settings", { restoredSinceLastSync: true, lastSyncMessage: "Restored local data has not yet been synced." });
    const settings = await getSyncSettings();
    expect(settings.restoredSinceLastSync).toBe(true);
    expect(settings.lastSyncMessage).toMatch(/not yet been synced/i);
  });
});
