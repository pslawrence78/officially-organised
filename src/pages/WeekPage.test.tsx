import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { createHouseholdAdminItem, seedInitialDataIfNeeded } from "../data/repositories";
import { createCelebration } from "../data/repositories/celebrationRepository";
import { createGiftPlan } from "../data/repositories/giftPlanRepository";
import { addDaysToDateKey, currentDateKey } from "../utils/dates";
import { WeekPage } from "./WeekPage";

describe("Week page celebration readiness", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("shows compact celebration readiness inside the relevant week day", async () => {
    const inThreeDays = addDaysToDateKey(currentDateKey(), 3);
    const celebration = await createCelebration({ householdId: "household_lawrence", title: "Weekend party", occasionType: "birthday_party", date: inThreeDays, recurrence: "none", ownerAdultIds: ["member_phil"], status: "planned" });
    await createGiftPlan({ celebrationId: celebration.id, recipientName: "Alex", responsibleAdultId: "member_phil", giftStatus: "to_buy", cardStatus: "to_buy", rsvpStatus: "to_reply", targetDate: inThreeDays, buyBy: inThreeDays, archived: false, linkedPrepTaskIds: [] });

    render(<MemoryRouter><WeekPage /></MemoryRouter>);

    expect((await screen.findAllByText("Weekend party")).length).toBeGreaterThan(0);
    expect(screen.getByText("Celebration prep")).toBeInTheDocument();
    expect(screen.getAllByText("At risk").length).toBeGreaterThan(0);
  });

  it("shows due household admin items for the visible week", async () => {
    await createHouseholdAdminItem({ title: "Car insurance", category: "insurance", adminType: "car_insurance", status: "active", dueDate: addDaysToDateKey(currentDateKey(), 2), renewalCycle: "annual", ownerMemberId: "member_phil", reminderDaysBefore: [30, 14, 7] });
    render(<MemoryRouter><WeekPage /></MemoryRouter>);
    expect(await screen.findByText("Due this week")).toBeInTheDocument();
    expect(screen.getByText("Car insurance")).toBeInTheDocument();
  });
});
