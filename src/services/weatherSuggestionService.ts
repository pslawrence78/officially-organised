import type { WeatherAwareSchoolSuggestion, WeatherSuggestionInput } from "../types/weather";

export const WEATHER_SUGGESTION_THRESHOLDS = { rainProbability: 50, heavyRainProbability: 70, coldMaxTempC: 8, veryColdMinTempC: 3, hotMaxTempC: 24, strongWindKph: 35, highUvIndex: 5 } as const;

const wetConditions = new Set(["drizzle", "rain", "heavy_rain"]);

export function buildWeatherAwareSchoolSuggestions({ date, schoolDayPlan, forecast }: WeatherSuggestionInput): WeatherAwareSchoolSuggestion[] {
  if (!schoolDayPlan || schoolDayPlan.schoolStatus !== "open" || !forecast) return [];
  const t = WEATHER_SUGGESTION_THRESHOLDS;
  const rain = wetConditions.has(forecast.condition) || (forecast.precipitationProbabilityMax ?? 0) >= t.rainProbability;
  const heavyRain = forecast.condition === "heavy_rain" || (forecast.precipitationProbabilityMax ?? 0) >= t.heavyRainProbability;
  const cold = (forecast.maxTempC ?? Infinity) <= t.coldMaxTempC || (forecast.minTempC ?? Infinity) <= t.veryColdMinTempC;
  const veryCold = (forecast.minTempC ?? Infinity) <= t.veryColdMinTempC;
  const hot = (forecast.maxTempC ?? -Infinity) >= t.hotMaxTempC;
  const highUv = (forecast.uvIndexMax ?? -Infinity) >= t.highUvIndex;
  const windy = (forecast.windSpeedKphMax ?? 0) >= t.strongWindKph;
  const forest = schoolDayPlan.forestSchool.required;
  const pe = schoolDayPlan.attire.type === "pe_kit";
  const suggestions: WeatherAwareSchoolSuggestion[] = [];
  const add = (value: Omit<WeatherAwareSchoolSuggestion, "id" | "date">) => suggestions.push({ ...value, id: `${date}-${value.category}-${value.appliesTo}`, date });

  if (forest && rain) add({ title: "Forest School may be wet or muddy", detail: "Forest School is configured and rain is possible. Consider wellington boots, waterproofs and long trousers if school guidance allows.", severity: "important", category: "forest_school", appliesTo: "forest_school", suggestedPrepTaskTitle: "Pack Forest School waterproofs", source: "weather_and_school_config" });
  if (forest && cold) add({ title: "Pack a warm Forest School layer", detail: "The forecast looks cold for time outdoors. Consider an extra warm layer for Forest School.", severity: veryCold ? "important" : "suggestion", category: "cold", appliesTo: "forest_school", suggestedPrepTaskTitle: "Pack warm Forest School layer", source: "weather_and_school_config" });
  if (pe && (cold || rain || windy)) add({ title: "PE may need a weather check", detail: "PE is configured and the forecast looks cold, wet or windy. Check whether Seb needs an outdoor layer.", severity: heavyRain || veryCold ? "important" : "suggestion", category: "pe", appliesTo: "pe", source: "weather_and_school_config" });
  if (rain && !forest) add({ title: "Take a waterproof coat", detail: "Rain is possible during the school day. Consider sending Seb with a waterproof coat.", severity: heavyRain ? "important" : "suggestion", category: "rain", appliesTo: "school_day", suggestedPrepTaskTitle: heavyRain ? "Pack waterproof coat" : undefined, source: "weather" });
  if (cold && !forest && !pe) add({ title: "Pack a warmer layer", detail: "The school-day forecast looks cold. A warmer layer may be sensible.", severity: veryCold ? "important" : "suggestion", category: "cold", appliesTo: "school_day", source: "weather" });
  if (hot) add({ title: "Hot school day check", detail: "Refill the water bottle and check whether a sun hat or sun cream is needed for school.", severity: "suggestion", category: "heat", appliesTo: "school_day", suggestedPrepTaskTitle: "Refill school water bottle", source: "weather" });
  if (highUv && !hot) add({ title: "Sun protection check", detail: "UV may be high. Check whether Seb needs a sun hat or sun cream for school.", severity: "suggestion", category: "sun", appliesTo: "school_day", source: "weather" });
  if (windy && !pe && !forest) add({ title: "Windy outdoor conditions", detail: "The forecast looks windy. Check Seb's coat or hood before outdoor school activities.", severity: "suggestion", category: "wind", appliesTo: "school_day", source: "weather" });
  if (hot && schoolDayPlan.lunch.type === "packed_lunch") add({ title: "Keep packed lunch cool", detail: "It may be warm during the school day, so consider keeping the packed lunch cool.", severity: "info", category: "lunch", appliesTo: "lunch", source: "weather_and_school_config" });
  return suggestions;
}
