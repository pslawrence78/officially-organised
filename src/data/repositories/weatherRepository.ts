import { db } from "../db";
import type { WeatherForecastSnapshot, WeatherSettings } from "../../types/weather";

const WEATHER_SETTINGS_ID = "weather_settings";

export function defaultWeatherSettings(now = new Date().toISOString()): WeatherSettings {
  return { id: WEATHER_SETTINGS_ID, enabled: false, provider: "open_meteo", locationLabel: "Lichfield", timezone: "Europe/London", temperatureUnit: "celsius", refreshMode: "manual", staleAfterHours: 6, showOnDashboard: true, showOnToday: true, showOnWeek: true, createdAt: now, updatedAt: now };
}

export async function getWeatherSettings(): Promise<WeatherSettings> {
  const record = await db.settings.get(WEATHER_SETTINGS_ID);
  return record?.value && typeof record.value === "object" ? { ...defaultWeatherSettings(), ...(record.value as WeatherSettings), id: WEATHER_SETTINGS_ID } : defaultWeatherSettings();
}

export async function saveWeatherSettings(settings: WeatherSettings): Promise<WeatherSettings> {
  const current = await getWeatherSettings();
  const saved: WeatherSettings = { ...settings, id: "weather_settings", createdAt: current.createdAt, updatedAt: new Date().toISOString() };
  await db.settings.put({ id: WEATHER_SETTINGS_ID, value: saved, description: "Weather settings for school-readiness suggestions" });
  return saved;
}

export async function getLatestForecastSnapshot(): Promise<WeatherForecastSnapshot | null> {
  return (await db.weatherForecasts.orderBy("fetchedAt").last()) ?? null;
}

export async function saveForecastSnapshot(snapshot: WeatherForecastSnapshot): Promise<void> {
  await db.transaction("rw", db.weatherForecasts, async () => {
    await db.weatherForecasts.clear();
    await db.weatherForecasts.put(snapshot);
  });
}

export async function clearForecastCache(): Promise<void> {
  await db.weatherForecasts.clear();
}
