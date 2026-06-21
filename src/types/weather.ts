import type { SchoolReadinessForDate } from "../domain/types";

export type WeatherCondition = "clear" | "partly_cloudy" | "cloudy" | "fog" | "drizzle" | "rain" | "heavy_rain" | "snow" | "thunderstorm" | "windy" | "unknown";
export type WeatherProvider = "open_meteo" | "manual";

export interface WeatherSettings {
  id: "weather_settings";
  enabled: boolean;
  provider: WeatherProvider;
  locationLabel: string;
  latitude?: number;
  longitude?: number;
  timezone: "Europe/London";
  temperatureUnit: "celsius";
  refreshMode: "manual" | "on_app_open";
  staleAfterHours: number;
  showOnDashboard: boolean;
  showOnToday: boolean;
  showOnWeek: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherForecastDay {
  date: string;
  condition: WeatherCondition;
  minTempC?: number;
  maxTempC?: number;
  precipitationProbabilityMax?: number;
  precipitationMm?: number;
  windSpeedKphMax?: number;
  uvIndexMax?: number;
  source: "open_meteo" | "manual" | "seed";
  fetchedAt: string;
  expiresAt?: string;
}

export interface WeatherForecastSnapshot {
  id: string;
  locationLabel: string;
  latitude?: number;
  longitude?: number;
  timezone: "Europe/London";
  provider: "open_meteo" | "manual" | "seed";
  fetchedAt: string;
  days: WeatherForecastDay[];
}

export type WeatherSuggestionSeverity = "info" | "suggestion" | "important";
export type WeatherSuggestionCategory = "rain" | "cold" | "heat" | "sun" | "wind" | "forest_school" | "pe" | "lunch" | "general";

export interface WeatherAwareSchoolSuggestion {
  id: string;
  date: string;
  title: string;
  detail: string;
  severity: WeatherSuggestionSeverity;
  category: WeatherSuggestionCategory;
  appliesTo: "school_day" | "pe" | "forest_school" | "lunch" | "general";
  suggestedPrepTaskTitle?: string;
  source: "weather" | "weather_and_school_config";
}

export interface WeatherSchoolContext {
  settings: WeatherSettings;
  forecast: WeatherForecastDay | null;
  snapshot: WeatherForecastSnapshot | null;
  suggestions: WeatherAwareSchoolSuggestion[];
  status: "off" | "setup_required" | "fresh" | "stale" | "unavailable";
  error?: string;
}

export interface WeatherSuggestionInput {
  date: string;
  schoolDayPlan?: SchoolReadinessForDate | null;
  forecast?: WeatherForecastDay | null;
}
