import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { seedInitialDataIfNeeded } from "../data/repositories";
import { listLocalSyncRecords } from "./syncSerialiser";

describe("syncSerialiser", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  it("includes durable stores and excludes transient sync metadata stores", async () => {
    const records = await listLocalSyncRecords();
    const entityTypes = new Set(records.map((item) => item.entityType));
    expect(entityTypes.has("households")).toBe(true);
    expect(entityTypes.has("familyMembers")).toBe(true);
    expect(entityTypes.has("settings")).toBe(true);
    expect(entityTypes.has("weatherForecasts")).toBe(false);
    expect(entityTypes.has("auditLog")).toBe(false);
    expect(entityTypes.has("syncState")).toBe(false);
  });
});
