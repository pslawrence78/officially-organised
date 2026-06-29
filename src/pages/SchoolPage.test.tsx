import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../app/AppShell";
import { SchoolPage } from "./SchoolPage";

const mockedGetSchoolHubViewModel = vi.fn();

vi.mock("../services/schoolHubService", async () => {
  const actual = await vi.importActual<typeof import("../services/schoolHubService")>("../services/schoolHubService");
  return {
    ...actual,
    getSchoolHubViewModel: () => mockedGetSchoolHubViewModel(),
  };
});

describe("School page", () => {
  afterEach(() => {
    cleanup();
    mockedGetSchoolHubViewModel.mockReset();
  });

  it("renders today and tomorrow cards with setup links", async () => {
    mockedGetSchoolHubViewModel.mockResolvedValue({
      generatedAt: "2026-06-29T08:00:00.000Z",
      today: {
        date: "2026-06-29",
        label: "Monday 29 June",
        schoolStatus: "open",
        schoolStatusLabel: "School open",
        lunchStatus: "missing",
        lunchLabel: "Not configured",
        attireStatus: "missing",
        attireLabel: "Not configured",
        forestSchoolStatus: "missing",
        forestSchoolLabel: "Not configured",
        weatherSuggestionCount: 0,
        weatherSuggestionLabels: [],
        weatherStatus: "off",
        openActionCount: 1,
        criticalActionCount: 1,
        setupGapCount: 1,
      },
      tomorrow: {
        date: "2026-06-30",
        label: "Tuesday 30 June",
        schoolStatus: "open",
        schoolStatusLabel: "School open",
        lunchStatus: "missing",
        lunchLabel: "Not configured",
        attireStatus: "missing",
        attireLabel: "Not configured",
        forestSchoolStatus: "missing",
        forestSchoolLabel: "Not configured",
        weatherSuggestionCount: 0,
        weatherSuggestionLabels: [],
        weatherStatus: "off",
        openActionCount: 0,
        criticalActionCount: 0,
        setupGapCount: 1,
      },
      upcomingDays: [],
      openActions: [{
        id: "school-action-1",
        householdId: "household_lawrence",
        memberId: "member_seb",
        schoolDate: "2026-06-29",
        sourceType: "operational_school_readiness",
        sourceKey: "school:2026-06-29:lunch:unknown",
        sourceVersion: "1",
        title: "Check Seb's lunch arrangement",
        category: "check_required",
        owner: "either",
        priority: "important",
        status: "open",
        blocksSchoolReadiness: true,
        dueAt: "2026-06-29T07:30:00.000Z",
        createdAt: "2026-06-29T06:00:00.000Z",
        updatedAt: "2026-06-29T06:00:00.000Z",
        originLabel: "School readiness",
      }],
      setupGaps: [{
        id: "gap-config-2026-06-29",
        date: "2026-06-29",
        title: "School requirements missing",
        detail: "Monday 29 June has no half-term requirements loaded yet.",
        severity: "warning",
        link: { id: "school-half-terms", label: "Half-term requirements", to: "/settings/school-half-terms", description: "Lunch, PE, uniform and Forest School by date." },
      }],
      weather: {
        enabled: false,
        status: "off",
        title: "Weather-aware school suggestions are off",
        detail: "School readiness still works normally without weather.",
        todaySuggestions: [],
        tomorrowSuggestions: [],
        link: { id: "school-weather", label: "Weather settings", to: "/settings", description: "Optional weather-aware school suggestions." },
      },
      links: [
        { id: "school-calendar", label: "School calendar", to: "/settings/school-calendar", description: "Term dates, holidays and closure days." },
        { id: "school-half-terms", label: "Half-term requirements", to: "/settings/school-half-terms", description: "Lunch, PE, uniform and Forest School by date." },
      ],
    });

    render(<MemoryRouter><SchoolPage /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "School Hub" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Monday 29 June" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tuesday 30 June" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Half-term requirements" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows the missing setup panel content", async () => {
    mockedGetSchoolHubViewModel.mockResolvedValue({
      generatedAt: "2026-06-29T08:00:00.000Z",
      today: { date: "2026-06-29", label: "Monday 29 June", schoolStatus: "open", schoolStatusLabel: "School open", lunchStatus: "missing", lunchLabel: "Not configured", attireStatus: "missing", attireLabel: "Not configured", forestSchoolStatus: "missing", forestSchoolLabel: "Not configured", weatherSuggestionCount: 0, weatherSuggestionLabels: [], weatherStatus: "off", openActionCount: 0, criticalActionCount: 0, setupGapCount: 1 },
      tomorrow: { date: "2026-06-30", label: "Tuesday 30 June", schoolStatus: "open", schoolStatusLabel: "School open", lunchStatus: "missing", lunchLabel: "Not configured", attireStatus: "missing", attireLabel: "Not configured", forestSchoolStatus: "missing", forestSchoolLabel: "Not configured", weatherSuggestionCount: 0, weatherSuggestionLabels: [], weatherStatus: "off", openActionCount: 0, criticalActionCount: 0, setupGapCount: 1 },
      upcomingDays: [],
      openActions: [],
      setupGaps: [{
        id: "gap-config-2026-06-29",
        date: "2026-06-29",
        title: "School requirements missing",
        detail: "Monday 29 June has no half-term requirements loaded yet.",
        severity: "warning",
        link: { id: "school-half-terms", label: "Half-term requirements", to: "/settings/school-half-terms", description: "Lunch, PE, uniform and Forest School by date." },
      }],
      weather: { enabled: false, status: "off", title: "Weather-aware school suggestions are off", detail: "School readiness still works normally without weather.", todaySuggestions: [], tomorrowSuggestions: [], link: { id: "school-weather", label: "Weather settings", to: "/settings", description: "Optional weather-aware school suggestions." } },
      links: [],
    });

    render(<MemoryRouter><SchoolPage /></MemoryRouter>);

    expect(await screen.findByText("School requirements missing")).toBeInTheDocument();
    expect(screen.getByText("Upcoming school readiness")).toBeInTheDocument();
  });

  it("renders school actions from the hub model", async () => {
    mockedGetSchoolHubViewModel.mockResolvedValue({
      generatedAt: "2026-06-29T08:00:00.000Z",
      today: { date: "2026-06-29", label: "Monday 29 June", schoolStatus: "open", schoolStatusLabel: "School open", lunchStatus: "missing", lunchLabel: "Not configured", attireStatus: "missing", attireLabel: "Not configured", forestSchoolStatus: "missing", forestSchoolLabel: "Not configured", weatherSuggestionCount: 0, weatherSuggestionLabels: [], weatherStatus: "off", openActionCount: 1, criticalActionCount: 1, setupGapCount: 1 },
      tomorrow: { date: "2026-06-30", label: "Tuesday 30 June", schoolStatus: "open", schoolStatusLabel: "School open", lunchStatus: "missing", lunchLabel: "Not configured", attireStatus: "missing", attireLabel: "Not configured", forestSchoolStatus: "missing", forestSchoolLabel: "Not configured", weatherSuggestionCount: 0, weatherSuggestionLabels: [], weatherStatus: "off", openActionCount: 0, criticalActionCount: 0, setupGapCount: 1 },
      upcomingDays: [],
      openActions: [{
        id: "school-action-1",
        householdId: "household_lawrence",
        memberId: "member_seb",
        schoolDate: "2026-06-29",
        sourceType: "operational_school_readiness",
        sourceKey: "school:2026-06-29:lunch:unknown",
        sourceVersion: "1",
        title: "Check Seb's lunch arrangement",
        category: "check_required",
        owner: "either",
        priority: "important",
        status: "open",
        blocksSchoolReadiness: true,
        dueAt: "2026-06-29T07:30:00.000Z",
        createdAt: "2026-06-29T06:00:00.000Z",
        updatedAt: "2026-06-29T06:00:00.000Z",
        originLabel: "School readiness",
      }],
      setupGaps: [],
      weather: { enabled: false, status: "off", title: "Weather-aware school suggestions are off", detail: "School readiness still works normally without weather.", todaySuggestions: [], tomorrowSuggestions: [], link: { id: "school-weather", label: "Weather settings", to: "/settings", description: "Optional weather-aware school suggestions." } },
      links: [],
    });

    render(<MemoryRouter><SchoolPage /></MemoryRouter>);

    expect(await screen.findByText("Check Seb's lunch arrangement")).toBeInTheDocument();
  });

  it("adds School to the secondary navigation", async () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "More" }));
    const secondary = await screen.findByRole("navigation", { name: "Secondary" });
    expect(within(secondary).getByRole("link", { name: /School/ })).toHaveAttribute("href", "/school");
  });
});
