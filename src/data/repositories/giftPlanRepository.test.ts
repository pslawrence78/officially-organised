import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { seedInitialDataIfNeeded } from "./appRepository";
import { createCelebration } from "./celebrationRepository";
import { archiveGiftPlan, createGiftPlan, listGiftPlansForCelebration, updateGiftPlan } from "./giftPlanRepository";

describe("gift plan repository", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("creates, updates and archives a gift plan", async () => {
    const celebration = await createCelebration({ householdId: "household_lawrence", title: "Party", occasionType: "birthday_party", date: "2026-07-10", recurrence: "none", ownerAdultIds: ["member_beck"], status: "planned" });
    const created = await createGiftPlan({
      celebrationId: celebration.id,
      recipientName: "Jamie",
      responsibleAdultId: "member_beck",
      giftStatus: "to_buy",
      cardStatus: "to_buy",
      rsvpStatus: "to_reply",
      archived: false,
      linkedPrepTaskIds: [],
    });

    const updated = await updateGiftPlan(created.id, { giftStatus: "bought", wrapBy: "2026-07-08" });
    const archived = await archiveGiftPlan(created.id);

    expect(updated.giftStatus).toBe("bought");
    expect(updated.wrapBy).toBe("2026-07-08");
    expect(archived.archived).toBe(true);
    expect((await listGiftPlansForCelebration(celebration.id))[0]?.id).toBe(created.id);
  });
});
