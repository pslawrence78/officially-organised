import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../data/db";
import { defaultWeatherSettings, saveForecastSnapshot, saveWeatherSettings } from "../data/repositories";
import type { SchoolReadinessForDate } from "../domain/types";
import type { WeatherForecastSnapshot } from "../types/weather";
import { getWeatherSchoolContext, mapOpenMeteoWeatherCode, normaliseOpenMeteoForecast } from "./weatherService";

const date = "2026-06-22";
const ready: SchoolReadinessForDate = { date, schoolStatus: "open", schoolStatusLabel: "School open", hasConfiguration: true, lunch: { type: "school_dinner", label: "School dinner", isKnown: true }, attire: { type: "school_uniform", label: "School uniform", isKnown: true }, forestSchool: { required: false, wellingtonBoots: false, longTrousers: false }, readinessItems: [] };
const settings = { ...defaultWeatherSettings("2026-01-01T00:00:00Z"), enabled: true, latitude: 52.68, longitude: -1.83 };
function snapshot(fetchedAt: string): WeatherForecastSnapshot { return { id: `forecast_${fetchedAt}`, locationLabel: settings.locationLabel, latitude: settings.latitude, longitude: settings.longitude, timezone: "Europe/London", provider: "open_meteo", fetchedAt, days: [{ date, condition: "rain", precipitationProbabilityMax: 60, source: "open_meteo", fetchedAt }] }; }

describe("weather service", () => {
  beforeEach(async () => { await db.delete(); await db.open(); await saveWeatherSettings(settings); });
  afterEach(async () => { await db.delete(); });
  it("maps Open-Meteo codes safely", () => { expect(mapOpenMeteoWeatherCode(0)).toBe("clear"); expect(mapOpenMeteoWeatherCode(61)).toBe("rain"); expect(mapOpenMeteoWeatherCode(82)).toBe("heavy_rain"); expect(mapOpenMeteoWeatherCode(999)).toBe("unknown"); });
  it("normalises daily provider values and missing optional fields", () => {
    const value = normaliseOpenMeteoForecast({ daily: { time: [date], weather_code: [2], temperature_2m_max: [21] } }, settings, "2026-06-21T10:00:00Z");
    expect(value).toMatchObject({ timezone: "Europe/London", provider: "open_meteo", days: [{ date, condition: "partly_cloudy", maxTempC: 21 }] });
    expect(value.days[0].minTempC).toBeUndefined();
  });
  it("uses a fresh cached forecast without fetching", async () => {
    await saveForecastSnapshot(snapshot(new Date(Date.now() - 2 * 3_600_000).toISOString()));
    const fetcher = vi.fn(); const value = await getWeatherSchoolContext(date, ready, { fetcher: fetcher as unknown as typeof fetch });
    expect(value.status).toBe("fresh"); expect(value.suggestions[0].title).toBe("Take a waterproof coat"); expect(fetcher).not.toHaveBeenCalled();
  });
  it("keeps stale cache when refresh fails", async () => {
    await saveForecastSnapshot(snapshot(new Date(Date.now() - 24 * 3_600_000).toISOString()));
    const fetcher = vi.fn().mockRejectedValue(new Error("offline")); const value = await getWeatherSchoolContext(date, ready, { refresh: true, fetcher: fetcher as unknown as typeof fetch });
    expect(value.status).toBe("stale"); expect(value.forecast).not.toBeNull(); expect(value.error).toBe("offline");
  });
  it("returns a safe unavailable state when refresh fails without cache", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("offline")); const value = await getWeatherSchoolContext(date, ready, { refresh: true, fetcher: fetcher as unknown as typeof fetch });
    expect(value.status).toBe("unavailable"); expect(value.suggestions).toEqual([]);
  });
});
