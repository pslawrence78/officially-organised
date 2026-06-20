import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FamilyEvent, FamilyEventInput } from "../domain/types";
import { EventCard } from "../components/events/EventCard";
import { createEvent, seedInitialDataIfNeeded } from "../data/repositories";
import { db } from "../data/db";
import { seedFamilyMembers } from "../data/seedData/initialData";
import { addDaysToDateKey, currentDateKey, localDateTimeToIso } from "../utils/dates";
import { TodayPage } from "./TodayPage";
import { WeekPage } from "./WeekPage";

function inputForDate(title: string, dateKey: string): FamilyEventInput {
  return {
    title,
    category: "family_social",
    status: "confirmed",
    startAt: localDateTimeToIso(`${dateKey}T10:00`),
    endAt: localDateTimeToIso(`${dateKey}T11:00`),
    allDay: false,
    participants: ["member_phil"],
    responsibleAdults: [],
    prepTasks: [],
    resourceNeeds: [],
  };
}

describe("event views", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("Today shows today’s event and excludes tomorrow", async () => {
    const today = currentDateKey();
    await createEvent(inputForDate("Today event", today));
    await createEvent(inputForDate("Tomorrow event", addDaysToDateKey(today, 1)));
    render(<MemoryRouter><TodayPage /></MemoryRouter>);

    expect(await screen.findByText("Today event")).toBeInTheDocument();
    expect(screen.queryByText("Tomorrow event")).not.toBeInTheDocument();
  });

  it("Today displays an empty state", async () => {
    render(<MemoryRouter><TodayPage /></MemoryRouter>);
    expect(await screen.findByText("Nothing planned today")).toBeInTheDocument();
  });

  it("Week groups an event under its day", async () => {
    const today = currentDateKey();
    await createEvent(inputForDate("Week event", today));
    render(<MemoryRouter><WeekPage /></MemoryRouter>);
    expect(await screen.findByText("Week event")).toBeInTheDocument();
    expect(screen.getAllByText("No events")).toHaveLength(6);
  });

  it("an event with a missing place reference renders safely", () => {
    const event: FamilyEvent = {
      ...inputForDate("Missing place event", currentDateKey()),
      id: "event_missing_place",
      placeId: "place_deleted",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    render(<MemoryRouter><EventCard event={event} familyMembers={seedFamilyMembers} /></MemoryRouter>);
    expect(screen.getByText("Place unavailable")).toBeInTheDocument();
  });

  it("event cards surface open and critical preparation", () => {
    const timestamp = new Date().toISOString();
    const event: FamilyEvent = {
      ...inputForDate("Prepared event", currentDateKey()),
      id: "event_with_prep",
      prepTasks: [{ id: "prep_critical", title: "Buy present", ownerIds: ["member_beck"], priority: "critical", status: "open", blocksEvent: true, createdAt: timestamp, updatedAt: timestamp }],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    render(<MemoryRouter><EventCard event={event} familyMembers={seedFamilyMembers} /></MemoryRouter>);
    expect(screen.getByText("1 prep task open · 1 critical")).toBeInTheDocument();
  });

  it("event cards surface the independent car window", () => {
    const timestamp = new Date().toISOString();
    const event: FamilyEvent = {
      ...inputForDate("Car event", currentDateKey()),
      id: "event_with_car",
      resourceNeeds: [{ id: "resource_need_car", resourceId: "resource_family_car", needStatus: "required", neededFrom: new Date(Date.now() + 60_000).toISOString(), neededUntil: new Date(Date.now() + 3_600_000).toISOString(), allocatedTo: "member_phil", createdAt: timestamp, updatedAt: timestamp }],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    render(<MemoryRouter><EventCard event={event} familyMembers={seedFamilyMembers} /></MemoryRouter>);
    expect(screen.getByText(/Car required/)).toBeInTheDocument();
  });
});
