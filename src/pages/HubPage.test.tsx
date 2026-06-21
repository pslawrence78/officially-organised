import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
import { HubPage } from "./HubPage";
import { localDateTimeToIso } from "../utils/dates";

describe("Hub page", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
    await saveSchoolCalendar({
      id: "school_calendar_hub_page",
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
      id: "half_term_hub_page",
      schoolCalendarId: "school_calendar_hub_page",
      label: "Summer half term",
      startDate: "2026-06-22",
      endDate: "2026-06-22",
      entries: [{
        id: "entry_hub_page",
        schoolCalendarId: "school_calendar_hub_page",
        halfTermConfigId: "half_term_hub_page",
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

  it("renders the /hub experience without mutation controls", async () => {
    render(
      <MemoryRouter>
        <HubPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Hub" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Refreshing the household Hub...")).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /mark/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /delete/i })).not.toBeInTheDocument();
  });
});
