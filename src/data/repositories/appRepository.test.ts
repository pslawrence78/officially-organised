import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EVENT_CATEGORIES } from "../../domain/constants";
import { db, databaseMetadata } from "../db";
import {
  getFamilyMemberById,
  getFamilyMembers,
  getHousehold,
  getResources,
  getSettings,
  getTemplates,
  seedInitialDataIfNeeded,
} from "./appRepository";

describe("Tranche 0 local data foundation", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("creates the complete baseline data and leaves future stores empty", async () => {
    await expect(seedInitialDataIfNeeded()).resolves.toBe(true);

    expect(await getHousehold()).toMatchObject({
      id: "household_lawrence",
      name: "Lawrence Family",
      timezone: "Europe/London",
      defaultStartOfWeek: "monday",
    });
    expect(await getFamilyMembers()).toHaveLength(4);
    expect((await getFamilyMembers()).map((member) => member.displayName)).toEqual([
      "Albert",
      "Beck",
      "Phil",
      "Seb",
    ]);
    expect(await getResources()).toEqual([
      expect.objectContaining({ id: "resource_family_car", resourceType: "car" }),
    ]);
    expect(await getTemplates()).toHaveLength(9);
    expect(await db.auditLog.toArray()).toEqual([
      expect.objectContaining({
        id: "audit_seed_initial_data",
        action: "seeded",
        summary: "Initial Lawrence Loop seed data created",
      }),
    ]);
    expect(await db.places.count()).toBe(0);
    expect(await db.events.count()).toBe(0);
    expect(await db.eventSeries.count()).toBe(0);
  });

  it("does not duplicate records when seeding more than once", async () => {
    await expect(seedInitialDataIfNeeded()).resolves.toBe(true);
    await expect(seedInitialDataIfNeeded()).resolves.toBe(false);

    expect(await db.households.count()).toBe(1);
    expect(await db.familyMembers.count()).toBe(4);
    expect(await db.resources.count()).toBe(1);
    expect(await db.templates.count()).toBe(9);
    expect(await db.auditLog.count()).toBe(1);
  });

  it("exposes members and versioned category settings through repositories", async () => {
    await seedInitialDataIfNeeded();

    await expect(getFamilyMemberById("member_albert")).resolves.toMatchObject({
      displayName: "Albert",
      memberType: "pet",
      defaultResponsibleAdults: ["member_phil", "member_beck"],
    });
    await expect(getFamilyMemberById("member_unknown")).resolves.toBeUndefined();

    const settings = await getSettings();
    expect(settings.find((setting) => setting.id === "event_categories")?.value).toEqual(EVENT_CATEGORIES);
    expect(settings.find((setting) => setting.id === "app_data_schema")?.value).toBe(databaseMetadata.appDataSchema);
  });
});
