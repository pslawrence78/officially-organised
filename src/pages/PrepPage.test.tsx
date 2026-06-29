import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FamilyEventInput, PrepTask } from "../domain/types";
import { db } from "../data/db";
import { createEvent, getEventById, seedInitialDataIfNeeded } from "../data/repositories";
import { createCelebration } from "../data/repositories/celebrationRepository";
import { createGiftPlan } from "../data/repositories/giftPlanRepository";
import { generateGiftPlanPrepTasks } from "../services/giftPlanPrepService";
import { currentDateKey, localDateTimeToIso } from "../utils/dates";
import { PrepPage } from "./PrepPage";

function task(overrides: Partial<PrepTask>): PrepTask {
  const timestamp = new Date().toISOString();
  return { id: `prep_${crypto.randomUUID()}`, title: "Pack kit", ownerIds: ["member_phil"], priority: "normal", status: "open", blocksEvent: false, createdAt: timestamp, updatedAt: timestamp, ...overrides };
}

function eventInput(prepTasks: PrepTask[]): FamilyEventInput {
  const today = currentDateKey();
  return { title: "Swimming", category: "lesson", status: "confirmed", startAt: localDateTimeToIso(`${today}T17:30`), endAt: localDateTimeToIso(`${today}T18:00`), allDay: false, participants: ["member_seb"], responsibleAdults: ["member_phil"], prepTasks, resourceNeeds: [] };
}

describe("Prep view", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("groups overdue and unassigned open preparation", async () => {
    const overdue = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await createEvent(eventInput([
      task({ title: "Buy present", dueAt: overdue, priority: "critical", blocksEvent: true }),
      task({ title: "Check address", ownerIds: [], dueAt: undefined }),
    ]));
    render(<MemoryRouter><PrepPage /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Overdue" })).toBeInTheDocument();
    expect(screen.getByText("Buy present")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No due date" })).toBeInTheDocument();
    expect(screen.getByText("Check address")).toBeInTheDocument();
  });

  it("ticks a task done from the Prep view", async () => {
    const event = await createEvent(eventInput([task({ title: "Pack towel" })]));
    render(<MemoryRouter><PrepPage /></MemoryRouter>);
    const button = await screen.findByRole("button", { name: "Mark Pack towel done" });
    fireEvent.click(button);

    await waitFor(async () => expect((await getEventById(event.id))?.prepTasks[0].status).toBe("done"));
    expect(await screen.findByText("Done or skipped")).toBeInTheDocument();
  });

  it("shows generated gift plan prep tasks in the normal Prep flow", async () => {
    const event = await createEvent(eventInput([]));
    const celebration = await createCelebration({ householdId: "household_lawrence", title: "Party", occasionType: "birthday_party", date: currentDateKey(), recurrence: "none", linkedEventId: event.id, ownerAdultIds: ["member_phil"], status: "planned" });
    const giftPlan = await createGiftPlan({ celebrationId: celebration.id, linkedEventId: event.id, recipientName: "Jamie", responsibleAdultId: "member_phil", giftStatus: "to_buy", cardStatus: "to_buy", rsvpStatus: "to_reply", archived: false, linkedPrepTaskIds: [] });
    await generateGiftPlanPrepTasks(giftPlan.id);

    render(<MemoryRouter><PrepPage /></MemoryRouter>);

    expect(await screen.findByText("Buy present")).toBeInTheDocument();
    expect(screen.getByText("RSVP to party")).toBeInTheDocument();
    expect(screen.getAllByText("Celebrations").length).toBeGreaterThan(0);
  });

  it("filters generated gift prep tasks under celebrations", async () => {
    const event = await createEvent(eventInput([]));
    const celebration = await createCelebration({ householdId: "household_lawrence", title: "Party", occasionType: "birthday_party", date: currentDateKey(), recurrence: "none", linkedEventId: event.id, ownerAdultIds: ["member_phil"], status: "planned" });
    const giftPlan = await createGiftPlan({ celebrationId: celebration.id, linkedEventId: event.id, recipientName: "Jamie", responsibleAdultId: "member_phil", giftStatus: "to_buy", cardStatus: "to_buy", rsvpStatus: "to_reply", archived: false, linkedPrepTaskIds: [] });
    await generateGiftPlanPrepTasks(giftPlan.id);

    render(<MemoryRouter><PrepPage /></MemoryRouter>);

    fireEvent.change(await screen.findByLabelText("Source"), { target: { value: "celebrations" } });
    expect(await screen.findByText("Buy present")).toBeInTheDocument();
    expect(screen.getByText("RSVP to party")).toBeInTheDocument();
  });

  it("shows a calm empty state when celebration prep is filtered but nothing is open", async () => {
    render(<MemoryRouter><PrepPage /></MemoryRouter>);

    fireEvent.change(await screen.findByLabelText("Source"), { target: { value: "celebrations" } });
    expect(await screen.findByText("No celebration prep due right now")).toBeInTheDocument();
  });
});
