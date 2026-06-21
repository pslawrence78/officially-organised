import { describe, expect, it } from "vitest";
import type { SchoolReadinessForDate } from "../domain/types";
import type { WeatherForecastDay } from "../types/weather";
import { buildWeatherAwareSchoolSuggestions } from "./weatherSuggestionService";

const date = "2026-06-22";
function readiness(overrides: Partial<SchoolReadinessForDate> = {}): SchoolReadinessForDate {
  return { date, schoolStatus: "open", schoolStatusLabel: "School open", hasConfiguration: true, lunch: { type: "school_dinner", label: "School dinner", isKnown: true }, attire: { type: "school_uniform", label: "School uniform", isKnown: true }, forestSchool: { required: false, wellingtonBoots: false, longTrousers: false }, readinessItems: [], ...overrides };
}
function forecast(overrides: Partial<WeatherForecastDay> = {}): WeatherForecastDay {
  return { date, condition: "clear", source: "seed", fetchedAt: "2026-06-21T12:00:00Z", ...overrides };
}

describe("weather-aware school suggestions", () => {
  it("suggests a waterproof coat for rain and raises heavy rain severity", () => {
    expect(buildWeatherAwareSchoolSuggestions({ date, schoolDayPlan: readiness(), forecast: forecast({ condition: "rain", precipitationProbabilityMax: 55 }) })[0].title).toBe("Take a waterproof coat");
    expect(buildWeatherAwareSchoolSuggestions({ date, schoolDayPlan: readiness(), forecast: forecast({ condition: "heavy_rain" }) })[0]).toMatchObject({ severity: "important", suggestedPrepTaskTitle: "Pack waterproof coat" });
  });
  it("prefers a specific Forest School rain suggestion and does not duplicate generic rain", () => {
    const values = buildWeatherAwareSchoolSuggestions({ date, schoolDayPlan: readiness({ forestSchool: { required: true, wellingtonBoots: true, longTrousers: true } }), forecast: forecast({ condition: "rain" }) });
    expect(values.map((item) => item.title)).toContain("Forest School may be wet or muddy");
    expect(values.map((item) => item.title)).not.toContain("Take a waterproof coat");
  });
  it("covers cold Forest School and adverse-weather PE", () => {
    const forest = buildWeatherAwareSchoolSuggestions({ date, schoolDayPlan: readiness({ forestSchool: { required: true, wellingtonBoots: true, longTrousers: true } }), forecast: forecast({ maxTempC: 8 }) });
    const pe = buildWeatherAwareSchoolSuggestions({ date, schoolDayPlan: readiness({ attire: { type: "pe_kit", label: "PE kit", isKnown: true } }), forecast: forecast({ windSpeedKphMax: 35 }) });
    expect(forest.some((item) => item.title.includes("warm Forest School"))).toBe(true);
    expect(pe.some((item) => item.title === "PE may need a weather check")).toBe(true);
  });
  it("covers heat, UV, wind and a hot packed lunch", () => {
    const values = buildWeatherAwareSchoolSuggestions({ date, schoolDayPlan: readiness({ lunch: { type: "packed_lunch", label: "Packed lunch", isKnown: true } }), forecast: forecast({ maxTempC: 25, uvIndexMax: 6, windSpeedKphMax: 36 }) });
    expect(values.map((item) => item.category)).toEqual(expect.arrayContaining(["heat", "wind", "lunch"]));
  });
  it("returns no school suggestions when school is closed or forecast is unavailable", () => {
    expect(buildWeatherAwareSchoolSuggestions({ date, schoolDayPlan: readiness({ schoolStatus: "closed" }), forecast: forecast({ condition: "rain" }) })).toEqual([]);
    expect(buildWeatherAwareSchoolSuggestions({ date, schoolDayPlan: readiness(), forecast: null })).toEqual([]);
  });
});
