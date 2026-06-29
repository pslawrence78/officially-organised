import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { getSchoolCalendar, saveSchoolHalfTermConfig, seedInitialDataIfNeeded, setSchoolPrepActionStatus } from "../data/repositories";
import type { SchoolHalfTermConfig } from "../domain/types";
import type { WeatherSchoolContext } from "../types/weather";
import { buildSchoolHubViewModel, getSchoolHubViewModel } from "./schoolHubService";
import { getSchoolReadinessForRange } from "./schoolReadinessService";

function weather(status: WeatherSchoolContext["status"] = "off"): WeatherSchoolContext {
  return {
    settings: {
      id: "weather_settings",
      enabled: status !== "off",
      provider: "open_meteo",
      locationLabel: "Lichfield",
      timezone: "Europe/London",
      temperatureUnit: "celsius",
      refreshMode: "manual",
      staleAfterHours: 6,
      showOnDashboard: true,
      showOnToday: true,
      showOnWeek: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    forecast: null,
    snapshot: null,
    suggestions: [],
    status,
  };
}

describe("school hub service", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("builds an open school day with complete configuration", async () => {
    const calendar = (await getSchoolCalendar())!;
    const config: SchoolHalfTermConfig = {
      id: "half_term_complete",
      schoolCalendarId: calendar.id,
      label: "Summer 2",
      startDate: "2026-06-29",
      endDate: "2026-07-03",
      entries: [
        {
          id: "entry-2026-06-29",
          schoolCalendarId: calendar.id,
          halfTermConfigId: "half_term_complete",
          date: "2026-06-29",
          lunchType: "packed_lunch",
          attireType: "pe_kit",
          forestSchool: { required: true, wellingtonBoots: true, longTrousers: true, waterproofs: true },
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
        {
          id: "entry-2026-06-30",
          schoolCalendarId: calendar.id,
          halfTermConfigId: "half_term_complete",
          date: "2026-06-30",
          lunchType: "school_dinner",
          lunchChoice: "Pasta",
          attireType: "school_uniform",
          forestSchool: { required: false, wellingtonBoots: false, longTrousers: false },
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    await saveSchoolHalfTermConfig(config);

    const readiness = getSchoolReadinessForRange(calendar, [config], "2026-06-29", "2026-06-30");
    const model = buildSchoolHubViewModel({
      readiness,
      weatherByDate: {
        "2026-06-29": { ...weather("fresh"), suggestions: [{ id: "weather-1", date: "2026-06-29", title: "Take a waterproof coat", detail: "Rain possible", severity: "suggestion", category: "rain", appliesTo: "school_day", source: "weather" }] },
        "2026-06-30": weather("fresh"),
      },
      actions: [],
    });

    expect(model.today.schoolStatus).toBe("open");
    expect(model.today.lunchStatus).toBe("known");
    expect(model.today.attireStatus).toBe("known");
    expect(model.today.forestSchoolStatus).toBe("required");
    expect(model.today.setupGapCount).toBe(0);
  });

  it("suppresses missing setup warnings for a closed day", async () => {
    const calendar = (await getSchoolCalendar())!;
    const readiness = getSchoolReadinessForRange(calendar, [], "2026-06-26", "2026-06-27");
    const model = buildSchoolHubViewModel({
      readiness,
      weatherByDate: {
        "2026-06-26": weather(),
        "2026-06-27": weather(),
      },
      actions: [],
    });

    expect(model.today.schoolStatus).toBe("closed");
    expect(model.setupGaps.some((gap) => gap.id.includes("lunch-2026-06-26"))).toBe(false);
    expect(model.setupGaps.some((gap) => gap.id.includes("attire-2026-06-26"))).toBe(false);
  });

  it("flags missing lunch and attire for an open school day", async () => {
    const calendar = (await getSchoolCalendar())!;
    const config: SchoolHalfTermConfig = {
      id: "half_term_unknowns",
      schoolCalendarId: calendar.id,
      label: "Summer 2",
      startDate: "2026-06-29",
      endDate: "2026-06-29",
      entries: [{
        id: "entry-unknown",
        schoolCalendarId: calendar.id,
        halfTermConfigId: "half_term_unknowns",
        date: "2026-06-29",
        lunchType: "unknown",
        attireType: "unknown",
        forestSchool: { required: false, wellingtonBoots: false, longTrousers: false },
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      }],
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const readiness = getSchoolReadinessForRange(calendar, [config], "2026-06-29", "2026-06-30");
    const model = buildSchoolHubViewModel({
      readiness,
      weatherByDate: { "2026-06-29": weather(), "2026-06-30": weather() },
      actions: [],
    });

    expect(model.setupGaps.some((gap) => gap.id === "gap-lunch-2026-06-29")).toBe(true);
    expect(model.setupGaps.some((gap) => gap.id === "gap-attire-2026-06-29")).toBe(true);
  });

  it("keeps unknown school status calm", async () => {
    const calendar = (await getSchoolCalendar())!;
    const readiness = getSchoolReadinessForRange(calendar, [], "2026-09-01", "2026-09-02");
    const model = buildSchoolHubViewModel({
      readiness,
      weatherByDate: { "2026-09-01": weather(), "2026-09-02": weather() },
      actions: [],
    });

    expect(model.setupGaps[0]).toMatchObject({
      id: "gap-status-2026-09-01",
      severity: "info",
      title: "School status unknown",
    });
  });

  it("treats weather disabled as optional", async () => {
    const calendar = (await getSchoolCalendar())!;
    const readiness = getSchoolReadinessForRange(calendar, [], "2026-06-29", "2026-06-30");
    const model = buildSchoolHubViewModel({
      readiness,
      weatherByDate: { "2026-06-29": weather("off"), "2026-06-30": weather("off") },
      actions: [],
    });

    expect(model.weather.status).toBe("off");
    expect(model.setupGaps.some((gap) => gap.id.includes("weather"))).toBe(false);
  });

  it("includes only outstanding school actions and keeps dates ordered", async () => {
    const first = await getSchoolHubViewModel({ now: new Date("2026-06-29T08:00:00.000Z") });
    const firstAction = first.openActions[0];
    await setSchoolPrepActionStatus(firstAction.id, "done");
    const second = await getSchoolHubViewModel({ now: new Date("2026-06-29T08:00:00.000Z") });

    expect(second.openActions.some((item) => item.id === firstAction.id)).toBe(false);
    expect(second.upcomingDays.map((item) => item.date)).toEqual([...second.upcomingDays.map((item) => item.date)].sort());
  });

  it("does not create duplicate actions when the school hub loads twice", async () => {
    await getSchoolHubViewModel({ now: new Date("2026-06-29T08:00:00.000Z") });
    const once = await db.schoolReadinessPrepActions.count();
    await getSchoolHubViewModel({ now: new Date("2026-06-29T08:00:00.000Z") });
    const twice = await db.schoolReadinessPrepActions.count();

    expect(twice).toBe(once);
  });
});
