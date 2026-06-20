import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { EventSeriesInput, Weekday } from "../domain/types";
import { createSeries, seedInitialDataIfNeeded } from "../data/repositories";
import { db } from "../data/db";
import { currentDateKey } from "../utils/dates";
import { RoutinesPage } from "./RoutinesPage";
import { TodayPage } from "./TodayPage";
import { CarPage } from "./CarPage";
import { PrepPage } from "./PrepPage";

const weekdays: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
function todayRoutine(): EventSeriesInput { const today = currentDateKey(); return { title: "Today routine", category: "club", status: "active", recurrence: { frequency: "weekly", dayOfWeek: weekdays[new Date(`${today}T12:00:00Z`).getUTCDay()], startDate: today, startTime: "17:00", durationMinutes: 60 }, defaultParticipants: ["member_seb"], defaultResponsibleAdults: ["member_phil"], defaultResourceNeeds: [{ id: "car", resourceId: "resource_family_car", needStatus: "required", beforeStartMinutes: 15, afterEndMinutes: 15 }], defaultPrepTasks: [{ id: "kit", title: "Routine kit", ownerIds: ["member_phil"], dueOffsetMinutes: -60, priority: "normal", blocksEvent: false }], exceptions: [] }; }

describe("routine surfaces", () => {
  beforeEach(async () => { await db.delete(); await db.open(); await seedInitialDataIfNeeded(); }); afterEach(async () => { cleanup(); await db.delete(); });
  it("lists active routines with schedule and next occurrence", async () => { await createSeries(todayRoutine()); render(<MemoryRouter><RoutinesPage /></MemoryRouter>); expect(await screen.findByText("Today routine")).toBeInTheDocument(); expect(screen.getByText(/Every week/)).toBeInTheDocument(); expect(screen.getByText(/Required/)).toBeInTheDocument(); });
  it("shows a generated occurrence on Today", async () => { await createSeries(todayRoutine()); render(<MemoryRouter><TodayPage /></MemoryRouter>); expect(await screen.findByText("Today routine")).toBeInTheDocument(); expect(screen.getByText("Routine")).toBeInTheDocument(); });
  it("flows generated car and prep data into their operational views", async () => { await createSeries(todayRoutine()); const first = render(<MemoryRouter><CarPage /></MemoryRouter>); expect((await screen.findAllByText("Today routine")).length).toBeGreaterThan(0); first.unmount(); render(<MemoryRouter><PrepPage /></MemoryRouter>); expect((await screen.findAllByText("Routine kit")).length).toBeGreaterThan(0); });
});
