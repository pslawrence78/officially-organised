import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { seedInitialDataIfNeeded } from "./appRepository";
import {
  archiveHouseholdAdminItem,
  createHouseholdAdminItem,
  getHouseholdAdminItemById,
  listHouseholdAdminItems,
  listHouseholdAdminItemsByDueDateRange,
  updateHouseholdAdminItem,
} from "./householdAdminRepository";

function input(title: string, dueDate = "2026-07-10") {
  return {
    title,
    category: "vehicle" as const,
    adminType: "car_service" as const,
    status: "active" as const,
    dueDate,
    renewalCycle: "annual" as const,
    ownerMemberId: "member_phil" as const,
    reminderDaysBefore: [30, 14, 7],
  };
}

describe("household admin repository", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("creates and reads an item with an audit entry", async () => {
    const created = await createHouseholdAdminItem(input("Family car service"));
    expect(await getHouseholdAdminItemById(created.id)).toMatchObject({ title: "Family car service" });
    expect(await db.auditLog.where("entityId").equals(created.id).first()).toMatchObject({ action: "created" });
  });

  it("updates, archives and lists items", async () => {
    const first = await createHouseholdAdminItem(input("MOT", "2026-07-05"));
    const second = await createHouseholdAdminItem(input("Insurance", "2026-08-10"));
    const updated = await updateHouseholdAdminItem(first.id, { providerName: "Test provider", status: "booked" });
    expect(updated.providerName).toBe("Test provider");
    await archiveHouseholdAdminItem(second.id);
    expect((await listHouseholdAdminItems()).length).toBe(2);
    expect((await listHouseholdAdminItemsByDueDateRange("2026-07-01", "2026-07-31")).map((item) => item.title)).toContain("MOT");
    expect((await getHouseholdAdminItemById(second.id))?.status).toBe("archived");
  });
});
