import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FamilyEventInput, ResourceNeed } from "../domain/types";
import { db } from "../data/db";
import { createEvent, seedInitialDataIfNeeded } from "../data/repositories";
import { CarPage } from "./CarPage";

function carNeed(status: "required" | "maybe"): ResourceNeed {
  const timestamp = new Date().toISOString();
  return { id: `resource_need_${crypto.randomUUID()}`, resourceId: "resource_family_car", needStatus: status, neededFrom: new Date(Date.now() + 10 * 60 * 1000).toISOString(), neededUntil: new Date(Date.now() + 70 * 60 * 1000).toISOString(), allocatedTo: status === "required" ? "member_phil" : "member_beck", createdAt: timestamp, updatedAt: timestamp };
}

function eventInput(title: string, resourceNeeds: ResourceNeed[]): FamilyEventInput {
  return { title, category: "travel", status: "confirmed", startAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(), endAt: new Date(Date.now() + 50 * 60 * 1000).toISOString(), allDay: false, participants: ["member_phil"], responsibleAdults: ["member_phil"], prepTasks: [], resourceNeeds };
}

describe("Car view", () => {
  beforeEach(async () => { await db.delete(); await db.open(); await seedInitialDataIfNeeded(); });
  afterEach(async () => { cleanup(); await db.delete(); });

  it("groups active car needs without calculating clashes", async () => {
    await createEvent(eventInput("Required journey", [carNeed("required")]));
    await createEvent(eventInput("Possible journey", [carNeed("maybe")]));
    render(<MemoryRouter><CarPage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByText("Required journey")).toBeInTheDocument();
    expect(screen.getByText("Possible journey")).toBeInTheDocument();
    expect(screen.queryByText(/clash found/i)).not.toBeInTheDocument();
  });

  it("shows an empty state when no car needs exist", async () => {
    render(<MemoryRouter><CarPage /></MemoryRouter>);
    expect(await screen.findByText("No upcoming car needs")).toBeInTheDocument();
  });
});
