import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { seedInitialDataIfNeeded } from "./appRepository";
import { archiveCelebration, createCelebration, listCelebrations, listUpcomingCelebrations, updateCelebration } from "./celebrationRepository";

describe("celebration repository", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("creates, updates and archives a celebration", async () => {
    const created = await createCelebration({
      householdId: "household_lawrence",
      title: "Seb birthday",
      occasionType: "birthday",
      date: "2026-08-02",
      recurrence: "annual",
      linkedMemberId: "member_seb",
      ownerAdultIds: ["member_phil"],
      status: "planned",
    });

    const updated = await updateCelebration(created.id, { notes: "Need a calm plan", status: "active" });
    const archived = await archiveCelebration(created.id);

    expect(updated.notes).toBe("Need a calm plan");
    expect(archived.status).toBe("archived");
    expect((await listCelebrations())[0]?.id).toBe(created.id);
  });

  it("lists only upcoming non-archived celebrations in range", async () => {
    await createCelebration({ householdId: "household_lawrence", title: "Soon", occasionType: "family_social", date: "2026-07-01", recurrence: "none", ownerAdultIds: [], status: "planned" });
    const later = await createCelebration({ householdId: "household_lawrence", title: "Later", occasionType: "family_social", date: "2026-09-01", recurrence: "none", ownerAdultIds: [], status: "planned" });
    await archiveCelebration(later.id);

    expect((await listUpcomingCelebrations("2026-06-29", "2026-07-31")).map((item) => item.title)).toEqual(["Soon"]);
  });
});
