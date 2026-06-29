import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { seedInitialDataIfNeeded } from "../data/repositories";
import { createCelebration } from "../data/repositories/celebrationRepository";
import { createGiftPlan } from "../data/repositories/giftPlanRepository";
import { listLocalSyncRecords } from "./syncSerialiser";

describe("syncSerialiser", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  it("includes durable stores and excludes transient sync metadata stores", async () => {
    const celebration = await createCelebration({ householdId: "household_lawrence", title: "Party", occasionType: "family_social", date: "2026-07-01", recurrence: "none", ownerAdultIds: [], status: "planned" });
    await createGiftPlan({ celebrationId: celebration.id, recipientName: "Alex", giftStatus: "idea", cardStatus: "not_needed", rsvpStatus: "not_needed", archived: false, linkedPrepTaskIds: [] });
    const records = await listLocalSyncRecords();
    const entityTypes = new Set(records.map((item) => item.entityType));
    expect(entityTypes.has("households")).toBe(true);
    expect(entityTypes.has("familyMembers")).toBe(true);
    expect(entityTypes.has("settings")).toBe(true);
    expect(entityTypes.has("celebrationOccasions")).toBe(true);
    expect(entityTypes.has("giftPlans")).toBe(true);
    expect(entityTypes.has("weatherForecasts")).toBe(false);
    expect(entityTypes.has("auditLog")).toBe(false);
    expect(entityTypes.has("syncState")).toBe(false);
  });
});
