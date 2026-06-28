import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import {
  createEvent,
  saveSchoolCalendar,
  saveSchoolHalfTermConfig,
  saveWeatherSettings,
  seedInitialDataIfNeeded,
} from "../data/repositories";
import { localDateTimeToIso } from "../utils/dates";
import { HubWallboardPage } from "./HubWallboardPage";

describe("Hub wallboard page", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
    await saveSchoolCalendar({
      id: "school_calendar_wallboard_page",
      childMemberId: "member_seb",
      schoolName: "Illustrative Primary School",
      academicYearLabel: "2025/26",
      timezone: "Europe/London",
      periods: [{ id: "term", label: "Summer term", type: "term", startDate: "2026-06-22", endDate: "2026-07-24" }],
      closureDays: [],
      createdAt: "2026-06-01T08:00:00.000Z",
      updatedAt: "2026-06-01T08:00:00.000Z",
    });
    await saveSchoolHalfTermConfig({
      id: "half_term_wallboard_page",
      schoolCalendarId: "school_calendar_wallboard_page",
      label: "Summer half term",
      startDate: "2026-06-22",
      endDate: "2026-06-22",
      entries: [{
        id: "entry_wallboard_page",
        schoolCalendarId: "school_calendar_wallboard_page",
        halfTermConfigId: "half_term_wallboard_page",
        date: "2026-06-22",
        lunchType: "packed_lunch",
        attireType: "school_uniform",
        forestSchool: { required: false, wellingtonBoots: false, longTrousers: false },
        createdAt: "2026-06-01T08:00:00.000Z",
        updatedAt: "2026-06-01T08:00:00.000Z",
      }],
      createdAt: "2026-06-01T08:00:00.000Z",
      updatedAt: "2026-06-01T08:00:00.000Z",
    });
    await saveWeatherSettings({
      id: "weather_settings",
      enabled: false,
      provider: "open_meteo",
      locationLabel: "Lichfield",
      timezone: "Europe/London",
      temperatureUnit: "celsius",
      refreshMode: "manual",
      staleAfterHours: 6,
      showOnDashboard: true,
      showOnToday: true,
      showOnWeek: true,
      createdAt: "2026-06-01T08:00:00.000Z",
      updatedAt: "2026-06-01T08:00:00.000Z",
    });
    await createEvent({
      title: "Albert vet appointment",
      category: "vet",
      status: "confirmed",
      startAt: localDateTimeToIso("2026-06-22T09:30"),
      endAt: localDateTimeToIso("2026-06-22T10:30"),
      allDay: false,
      participants: ["member_phil", "member_albert"],
      responsibleAdults: ["member_phil"],
      prepTasks: [],
      resourceNeeds: [],
    });
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
    window.localStorage.clear();
  });

  it("renders wallboard controls and continues to use the panel registry", async () => {
    const { container } = render(
      <MemoryRouter>
        <HubWallboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Wallboard" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Starting the household wallboard...")).not.toBeInTheDocument());
    expect(container.querySelector(".hub-display-frame")).toBeInTheDocument();
    expect(container.querySelector(".hub-display-card")).toHaveAttribute("data-card", "today");
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exit wallboard" })).toHaveAttribute("href", "/hub");
    expect(screen.getByText("Today briefing")).toBeInTheDocument();
  });

  it("toggles pause and resume without exposing mutation controls", async () => {
    render(
      <MemoryRouter>
        <HubWallboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.queryByText("Starting the household wallboard...")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /delete/i })).not.toBeInTheDocument();
  });
});
