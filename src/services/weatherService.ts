import { getLatestForecastSnapshot, getWeatherSettings, saveForecastSnapshot } from "../data/repositories/weatherRepository";
import type { SchoolReadinessForDate } from "../domain/types";
import type { WeatherCondition, WeatherForecastDay, WeatherForecastSnapshot, WeatherSchoolContext, WeatherSettings } from "../types/weather";
import { buildWeatherAwareSchoolSuggestions } from "./weatherSuggestionService";

interface OpenMeteoDaily {
  time?: unknown; weather_code?: unknown; temperature_2m_max?: unknown; temperature_2m_min?: unknown;
  precipitation_probability_max?: unknown; precipitation_sum?: unknown; wind_speed_10m_max?: unknown; uv_index_max?: unknown;
}

export function mapOpenMeteoWeatherCode(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if ([1, 2].includes(code)) return "partly_cloudy";
  if (code === 3) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 66].includes(code)) return "rain";
  if ([65, 67, 80, 81, 82].includes(code)) return "heavy_rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return "unknown";
}

function numberAt(value: unknown, index: number): number | undefined {
  const item = Array.isArray(value) ? value[index] : undefined;
  return typeof item === "number" && Number.isFinite(item) ? item : undefined;
}

export function normaliseOpenMeteoForecast(payload: unknown, settings: WeatherSettings, fetchedAt = new Date().toISOString()): WeatherForecastSnapshot {
  const daily = payload && typeof payload === "object" && "daily" in payload ? (payload as { daily?: OpenMeteoDaily }).daily : undefined;
  const dates = Array.isArray(daily?.time) ? daily.time : [];
  const expiresAt = new Date(Date.parse(fetchedAt) + settings.staleAfterHours * 3_600_000).toISOString();
  const days: WeatherForecastDay[] = dates.flatMap((rawDate, index) => {
    if (typeof rawDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return [];
    return [{ date: rawDate, condition: mapOpenMeteoWeatherCode(numberAt(daily?.weather_code, index) ?? -1), minTempC: numberAt(daily?.temperature_2m_min, index), maxTempC: numberAt(daily?.temperature_2m_max, index), precipitationProbabilityMax: numberAt(daily?.precipitation_probability_max, index), precipitationMm: numberAt(daily?.precipitation_sum, index), windSpeedKphMax: numberAt(daily?.wind_speed_10m_max, index), uvIndexMax: numberAt(daily?.uv_index_max, index), source: "open_meteo", fetchedAt, expiresAt }];
  });
  return { id: `forecast_${fetchedAt.replace(/\W/g, "")}`, locationLabel: settings.locationLabel, latitude: settings.latitude, longitude: settings.longitude, timezone: "Europe/London", provider: "open_meteo", fetchedAt, days };
}

export async function refreshForecast(settings: WeatherSettings, fetcher: typeof fetch = fetch): Promise<WeatherForecastSnapshot> {
  if (!settings.enabled) throw new Error("Weather suggestions are switched off.");
  if (settings.provider !== "open_meteo") throw new Error("Manual forecasts cannot be refreshed automatically.");
  if (settings.latitude === undefined || settings.longitude === undefined) throw new Error("Add a latitude and longitude before refreshing.");
  const params = new URLSearchParams({ latitude: String(settings.latitude), longitude: String(settings.longitude), daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max", timezone: settings.timezone, forecast_days: "7" });
  const response = await fetcher(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error("The forecast provider is unavailable right now.");
  const snapshot = normaliseOpenMeteoForecast(await response.json(), settings);
  if (!snapshot.days.length) throw new Error("The forecast provider returned no usable days.");
  await saveForecastSnapshot(snapshot);
  return snapshot;
}

export function isForecastFresh(snapshot: WeatherForecastSnapshot, settings: WeatherSettings, now = Date.now()): boolean {
  return snapshot.locationLabel === settings.locationLabel && snapshot.latitude === settings.latitude && snapshot.longitude === settings.longitude && now - Date.parse(snapshot.fetchedAt) < settings.staleAfterHours * 3_600_000;
}

export async function getWeatherSchoolContext(date: string, schoolDayPlan: SchoolReadinessForDate, options: { refresh?: boolean; fetcher?: typeof fetch } = {}): Promise<WeatherSchoolContext> {
  const settings = await getWeatherSettings();
  if (!settings.enabled) return { settings, forecast: null, snapshot: null, suggestions: [], status: "off" };
  if (settings.latitude === undefined || settings.longitude === undefined) return { settings, forecast: null, snapshot: null, suggestions: [], status: "setup_required" };
  let snapshot = await getLatestForecastSnapshot();
  let error: string | undefined;
  const shouldRefresh = options.refresh || (settings.refreshMode === "on_app_open" && (!snapshot || !isForecastFresh(snapshot, settings)));
  if (shouldRefresh) {
    try { snapshot = await refreshForecast(settings, options.fetcher); }
    catch (cause) { error = cause instanceof Error ? cause.message : "Weather is unavailable right now."; }
  }
  const usable = snapshot && snapshot.locationLabel === settings.locationLabel && snapshot.latitude === settings.latitude && snapshot.longitude === settings.longitude ? snapshot : null;
  const forecast = usable?.days.find((day) => day.date === date) ?? null;
  const status = !usable || !forecast ? "unavailable" : isForecastFresh(usable, settings) ? "fresh" : "stale";
  return { settings, snapshot: usable, forecast, status, error, suggestions: buildWeatherAwareSchoolSuggestions({ date, schoolDayPlan, forecast }) };
}

export async function getWeatherSchoolContexts(plans: SchoolReadinessForDate[], options: { refresh?: boolean; fetcher?: typeof fetch } = {}): Promise<Record<string, WeatherSchoolContext>> {
  if (!plans.length) return {};
  const first = await getWeatherSchoolContext(plans[0].date, plans[0], options);
  return Object.fromEntries(plans.map((plan) => {
    const forecast = first.snapshot?.days.find((day) => day.date === plan.date) ?? null;
    const status = first.status === "off" || first.status === "setup_required" ? first.status : !forecast ? "unavailable" : first.status;
    return [plan.date, { ...first, forecast, status, suggestions: buildWeatherAwareSchoolSuggestions({ date: plan.date, schoolDayPlan: plan, forecast }) }];
  }));
}
