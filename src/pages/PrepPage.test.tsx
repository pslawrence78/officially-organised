import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FamilyEventInput, PrepTask } from "../domain/types";
import { db } from "../data/db";
import { createEvent, getEventById, seedInitialDataIfNeeded } from "../data/repositories";
import { currentDateKey, localDateTimeToIso } from "../utils/dates";
import { PrepPage } from "./PrepPage";

function task(overrides: Partial<PrepTask>): PrepTask {
  const timestamp = new Date().toISOString();
  return { id: `prep_${crypto.randomUUID()}`, title: "Pack kit", ownerIds: ["member_phil"], priority: "normal", status: "open", blocksEvent: false, createdAt: timestamp, updatedAt: timestamp, ...overrides };
}

function eventInput(prepTasks: PrepTask[]): FamilyEventInput {
  const today = currentDateKey();
  return { title: "Swimming", category: "lesson", status: "confirmed", startAt: localDateTimeToIso(`${today}T17:30`), endAt: localDateTimeToIso(`${today}T18:00`), allDay: false, participants: ["member_seb"], responsibleAdults: ["member_phil"], prepTasks };
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
});
