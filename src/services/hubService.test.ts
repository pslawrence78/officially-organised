import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import {
  bulkUpsertSchoolPrepActions,
  createEvent,
  createPlace,
  saveForecastSnapshot,
  saveSchoolCalendar,
  saveSchoolHalfTermConfig,
  saveWeatherSettings,
  seedInitialDataIfNeeded,
} from "../data/repositories";
import { FAMILY_CAR_RESOURCE_ID } from "../domain/constants";
import type {
  FamilyEventInput,
  PlaceInput,
  PrepTask,
  ResourceNeed,
  SchoolCalendar,
  SchoolHalfTermConfig,
} from "../domain/types";
import { buildHubViewModel, getHubViewModel } from "./hubService";
import { localDateTimeToIso } from "../utils/dates";
import { defaultWeatherSettings } from "../data/repositories/weatherRepository";
import type { WeatherForecastSnapshot, WeatherSettings } from "../types/weather";

const timestamp = "2026-06-01T08:00:00.000Z";

function placeInput(overrides: Partial<PlaceInput> = {}): PlaceInput {
  return {
    name: "Rose Cottage Vets",
    placeType: "vet",
    address: "12 Market Street",
    postcode: "WS13 6AA",
    travelNotes: "Use rear car park",
    parkingNotes: "Booking ref AB12CD34",
    ...overrides,
  };
}

function prepTask(title: string, dueAt: string, overrides: Partial<PrepTask> = {}): PrepTask {
  return {
    id: `prep_${title.replace(/\W/g, "_")}`,
    title,
    ownerIds: ["member_phil"],
    dueAt,
    priority: "important",
    status: "open",
    blocksEvent: false,
    notes: "Take papers to 51.5015, -0.1419. Booking ref ZXCV1234.",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function carNeed(id: string, date: string, status: "required" | "maybe", overrides: Partial<ResourceNeed> = {}): ResourceNeed {
  return {
    id,
    resourceId: FAMILY_CAR_RESOURCE_ID,
    needStatus: status,
    neededFrom: localDateTimeToIso(`${date}T09:00`),
    neededUntil: localDateTimeToIso(`${date}T10:30`),
    notes: "Collect from 51.5015, -0.1419 with booking ref ZXCV1234",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function eventInput(title: string, date: string, placeId?: string, overrides: Partial<FamilyEventInput> = {}): FamilyEventInput {
  return {
    title,
    category: "vet",
    status: "confirmed",
    startAt: localDateTimeToIso(`${date}T09:30`),
    endAt: localDateTimeToIso(`${date}T10:30`),
    allDay: false,
    placeId,
    participants: ["member_phil", "member_albert"],
    responsibleAdults: ["member_phil"],
    prepTasks: [],
    resourceNeeds: [],
    notes: "Discuss treatment at 51.5015, -0.1419. Booking ref ZXCV1234.",
    ...overrides,
  };
}

function schoolCalendar(): SchoolCalendar {
  return {
    id: "school_calendar_hub",
    childMemberId: "member_seb",
    schoolName: "Illustrative Primary School",
    academicYearLabel: "2025/26",
    timezone: "Europe/London",
    periods: [{ id: "summer_term", label: "Summer term", type: "term", startDate: "2026-06-01", endDate: "2026-07-24" }],
    closureDays: [{ id: "inset", date: "2026-06-26", type: "inset", label: "Inset day" }],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function halfTermConfig(): SchoolHalfTermConfig {
  return {
    id: "half_term_hub",
    schoolCalendarId: "school_calendar_hub",
    label: "Summer half term",
    startDate: "2026-06-22",
    endDate: "2026-06-23",
    entries: [
      {
        id: "entry_2026_06_22",
        schoolCalendarId: "school_calendar_hub",
        halfTermConfigId: "half_term_hub",
        date: "2026-06-22",
        lunchType: "packed_lunch",
        lunchChoice: "Pasta",
        attireType: "school_uniform",
        forestSchool: { required: false, wellingtonBoots: false, longTrousers: false },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "entry_2026_06_23",
        schoolCalendarId: "school_calendar_hub",
        halfTermConfigId: "half_term_hub",
        date: "2026-06-23",
        lunchType: "school_dinner",
        lunchChoice: "Fish fingers",
        attireType: "pe_kit",
        forestSchool: { required: true, wellingtonBoots: true, longTrousers: true, waterproofs: true },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function weatherSettings(overrides: Partial<WeatherSettings> = {}): WeatherSettings {
  return {
    ...defaultWeatherSettings(timestamp),
    enabled: true,
    locationLabel: "Lichfield",
    latitude: 52.68,
    longitude: -1.83,
    staleAfterHours: 6,
    ...overrides,
  };
}

function weatherSnapshot(fetchedAt = "2026-06-22T05:30:00.000Z"): WeatherForecastSnapshot {
  return {
    id: "forecast_hub",
    locationLabel: "Lichfield",
    latitude: 52.68,
    longitude: -1.83,
    timezone: "Europe/London",
    provider: "manual",
    fetchedAt,
    days: [
      {
        date: "2026-06-22",
        condition: "rain",
        minTempC: 8,
        maxTempC: 14,
        precipitationProbabilityMax: 80,
        windSpeedKphMax: 22,
        uvIndexMax: 3,
        source: "manual",
        fetchedAt,
      },
      {
        date: "2026-06-23",
        condition: "heavy_rain",
        minTempC: 6,
        maxTempC: 12,
        precipitationProbabilityMax: 88,
        windSpeedKphMax: 30,
        uvIndexMax: 2,
        source: "manual",
        fetchedAt,
      },
    ],
  };
}

async function seedHubFixture() {
  await saveSchoolCalendar(schoolCalendar());
  await saveSchoolHalfTermConfig(halfTermConfig());
  await saveWeatherSettings(weatherSettings());
  await saveForecastSnapshot(weatherSnapshot());
  const place = await createPlace(placeInput());
  await createEvent(eventInput("Albert vet appointment", "2026-06-22", place.id, {
    prepTasks: [
      prepTask("Bring insurance papers", localDateTimeToIso("2026-06-22T08:00"), { priority: "critical", blocksEvent: true }),
      prepTask("Pack snacks", localDateTimeToIso("2026-06-22T12:00")),
    ],
    resourceNeeds: [carNeed("car_today_required", "2026-06-22", "required")],
  }));
  await createEvent(eventInput("Seb PE day", "2026-06-23", undefined, {
    category: "school",
    prepTasks: [prepTask("Find PE kit", localDateTimeToIso("2026-06-23T07:15"))],
    resourceNeeds: [carNeed("car_tomorrow_maybe", "2026-06-23", "maybe")],
  }));
}

describe("Hub service", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("builds a populated read-only hub model from local data", async () => {
    await seedHubFixture();

    const model = await getHubViewModel({ now: new Date("2026-06-22T08:30:00.000Z") });

    expect(model.today.items.map((item) => item.title)).toContain("Albert vet appointment");
    expect(model.tomorrow.items.map((item) => item.title)).toContain("Seb PE day");
    expect(model.schoolReadiness.schoolStatus).toBe("open");
    expect(model.weatherSuggestions[0].suggestions.length).toBeGreaterThan(0);
    expect(model.carWatch.map((item) => item.needLabel)).toEqual(expect.arrayContaining(["Required", "Maybe needed"]));
    expect(model.criticalPrep[0]?.priorityLabel).toBe("Critical");
  });

  it("handles an empty state safely", async () => {
    await db.schoolCalendars.clear();
    await db.schoolHalfTermConfigs.clear();
    await db.schoolReadinessPrepActions.clear();

    const model = await getHubViewModel({ now: new Date("2026-06-22T08:30:00.000Z") });

    expect(model.today.items).toHaveLength(0);
    expect(model.tomorrow.items).toHaveLength(0);
    expect(model.carWatch).toHaveLength(0);
    expect(model.criticalPrep).toHaveLength(0);
  });

  it("keeps today and tomorrow as separate date windows", async () => {
    await seedHubFixture();

    const model = await getHubViewModel({ now: new Date("2026-06-22T08:30:00.000Z") });

    expect(model.today.date).toBe("2026-06-22");
    expect(model.tomorrow.date).toBe("2026-06-23");
    expect(model.today.items.map((item) => item.title)).not.toContain("Seb PE day");
  });

  it("suppresses irrelevant school warnings on a closed school day", async () => {
    await saveSchoolCalendar(schoolCalendar());
    await saveSchoolHalfTermConfig({
      ...halfTermConfig(),
      startDate: "2026-06-26",
      endDate: "2026-06-26",
      entries: [{
        ...halfTermConfig().entries[0],
        id: "entry_closed",
        halfTermConfigId: "half_term_hub",
        date: "2026-06-26",
      }],
    });

    const model = await getHubViewModel({ now: new Date("2026-06-26T07:00:00.000Z") });

    expect(model.schoolReadiness.schoolStatus).toBe("closed");
    expect(model.schoolReadiness.warnings).toEqual([]);
    expect(model.schoolReadiness.actions).toEqual([]);
  });

  it("keeps unknown school readiness visible but calm", async () => {
    await db.schoolCalendars.clear();
    await db.schoolHalfTermConfigs.clear();

    const model = await getHubViewModel({ now: new Date("2026-06-22T08:30:00.000Z") });

    expect(model.schoolReadiness.schoolStatus).toBe("unknown");
    expect(model.schoolReadiness.warnings).toContain("School status is not yet known.");
  });

  it("falls back safely when weather is disabled", async () => {
    await saveSchoolCalendar(schoolCalendar());
    await saveSchoolHalfTermConfig(halfTermConfig());
    await saveWeatherSettings(weatherSettings({ enabled: false }));

    const model = await getHubViewModel({ now: new Date("2026-06-22T08:30:00.000Z") });

    expect(model.weatherSuggestions[0].status).toBe("off");
    expect(model.statuses.weatherConfigured).toBe(false);
  });

  it("shows stale weather clearly", async () => {
    await saveSchoolCalendar(schoolCalendar());
    await saveSchoolHalfTermConfig(halfTermConfig());
    await saveWeatherSettings(weatherSettings());
    await saveForecastSnapshot(weatherSnapshot("2026-06-21T00:00:00.000Z"));

    const model = await getHubViewModel({ now: new Date("2026-06-22T12:00:00.000Z") });

    expect(model.weatherSuggestions[0].status).toBe("stale");
    expect(model.statuses.weatherStale).toBe(true);
  });

  it("includes required and maybe car windows", async () => {
    await seedHubFixture();

    const model = await getHubViewModel({ now: new Date("2026-06-22T08:30:00.000Z") });

    expect(model.carWatch.map((item) => item.needLabel)).toEqual(expect.arrayContaining(["Required", "Maybe needed"]));
  });

  it("prioritises critical prep before normal prep", async () => {
    await seedHubFixture();

    const model = await getHubViewModel({ now: new Date("2026-06-22T08:30:00.000Z") });

    expect(model.criticalPrep[0].title).toBe("Bring insurance papers");
    expect(model.criticalPrep[0].priorityLabel).toBe("Critical");
  });

  it("sanitises addresses, notes, coordinates and references in privacy mode", async () => {
    await seedHubFixture();

    const visible = await getHubViewModel({ now: new Date("2026-06-22T08:30:00.000Z"), privacyMode: false });
    const hidden = await getHubViewModel({ now: new Date("2026-06-22T08:30:00.000Z"), privacyMode: true });

    expect(visible.today.items[0].locationDetail).toContain("12 Market Street");
    expect(hidden.today.items[0].locationDetail).toBeUndefined();
    expect(JSON.stringify(hidden)).not.toContain("51.5015");
    expect(JSON.stringify(hidden)).not.toContain("ZXCV1234");
  });

  it("preserves existing school prep action states without mutating them", async () => {
    await saveSchoolCalendar(schoolCalendar());
    await saveSchoolHalfTermConfig(halfTermConfig());
    await saveWeatherSettings(weatherSettings());
    await saveForecastSnapshot(weatherSnapshot());
    await bulkUpsertSchoolPrepActions([
      {
        id: "school_prep_2026_06_22_done",
        householdId: "household_lawrence",
        memberId: "member_seb",
        schoolDate: "2026-06-22",
        sourceType: "operational_school_readiness",
        sourceKey: "manual",
        sourceVersion: "1",
        title: "Prepare packed lunch",
        category: "lunch",
        owner: "either",
        priority: "critical",
        status: "done",
        blocksSchoolReadiness: true,
        dueAt: "2026-06-22T07:30:00.000Z",
        originLabel: "School readiness",
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: timestamp,
      },
    ]);

    const model = await getHubViewModel({ now: new Date("2026-06-22T08:30:00.000Z") });

    expect(model.schoolReadiness.actions.some((item) => item.state === "done")).toBe(true);
  });

  it("can build directly from supplied data for deterministic unit checks", async () => {
    const model = buildHubViewModel({
      todayKey: "2026-06-22",
      tomorrowKey: "2026-06-23",
      familyMembers: [],
      places: [],
      todayEvents: [],
      tomorrowEvents: [],
      allEvents: [],
      prepItems: [],
      carItems: [],
      schoolReadinessToday: {
        date: "2026-06-22",
        schoolStatus: "unknown",
        schoolStatusLabel: "Unknown",
        hasConfiguration: false,
        lunch: { type: "unknown", label: "Not yet known", isKnown: false },
        attire: { type: "unknown", label: "Not yet known", isKnown: false },
        forestSchool: { required: false, wellingtonBoots: false, longTrousers: false },
        readinessItems: [{ id: "warn", label: "School status is not yet known.", severity: "warning", category: "unknown" }],
      },
      schoolReadinessTomorrow: {
        date: "2026-06-23",
        schoolStatus: "closed",
        schoolStatusLabel: "Weekend",
        hasConfiguration: false,
        lunch: { type: "unknown", label: "Not yet known", isKnown: false },
        attire: { type: "unknown", label: "Not yet known", isKnown: false },
        forestSchool: { required: false, wellingtonBoots: false, longTrousers: false },
        readinessItems: [],
      },
      weather: {
        "2026-06-22": { settings: weatherSettings({ enabled: false }), forecast: null, snapshot: null, suggestions: [], status: "off" },
        "2026-06-23": { settings: weatherSettings({ enabled: false }), forecast: null, snapshot: null, suggestions: [], status: "off" },
      },
      schoolPrepActions: [],
    }, { isOffline: true, now: new Date("2026-06-22T08:30:00.000Z"), privacyMode: true });

    expect(model.statuses.isOffline).toBe(true);
    expect(model.schoolReadiness.schoolStatus).toBe("unknown");
  });
});
