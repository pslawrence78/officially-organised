import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { seedInitialDataIfNeeded } from "../data/repositories";
import { createCelebration } from "../data/repositories/celebrationRepository";
import { createGiftPlan } from "../data/repositories/giftPlanRepository";
import { addDaysToDateKey, currentDateKey } from "../utils/dates";
import { TodayPage } from "./TodayPage";

describe("Today page celebration readiness", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("shows relevant celebration readiness for today and tomorrow", async () => {
    const tomorrow = addDaysToDateKey(currentDateKey(), 1);
    const celebration = await createCelebration({ householdId: "household_lawrence", title: "Tomorrow party", occasionType: "birthday_party", date: tomorrow, recurrence: "none", ownerAdultIds: ["member_phil"], status: "planned" });
    await createGiftPlan({ celebrationId: celebration.id, recipientName: "Alex", responsibleAdultId: "member_phil", giftStatus: "to_buy", cardStatus: "to_buy", rsvpStatus: "to_reply", targetDate: tomorrow, buyBy: tomorrow, archived: false, linkedPrepTaskIds: [] });

    render(<MemoryRouter><TodayPage /></MemoryRouter>);

    expect(await screen.findByText("Celebration prep")).toBeInTheDocument();
    expect(await screen.findByText("Present or card still needs packing for tomorrow.")).toBeInTheDocument();
  });
});
