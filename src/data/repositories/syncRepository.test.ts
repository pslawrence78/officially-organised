import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { ensureSyncMetadata, getSyncSettings, setSyncPrepared } from "./syncRepository";

describe("sync metadata repository", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("seeds sync settings idempotently", async () => {
    const first = await ensureSyncMetadata();
    const second = await ensureSyncMetadata();

    expect(first.id).toBe("sync_settings");
    expect(second).toEqual(first);
    expect(await db.syncSettings.count()).toBe(1);
  });

  it("stores local preparation without syncing application records", async () => {
    await setSyncPrepared(true);
    const settings = await getSyncSettings();

    expect(settings.enabled).toBe(true);
    expect(settings.lastSyncStatus).toBe("never");
    expect(await db.syncState.count()).toBe(0);
  });
});
