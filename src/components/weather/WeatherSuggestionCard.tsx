import type { WeatherSchoolContext } from "../../types/weather";
import { Badge } from "../common/Badge";

const conditionLabels: Record<string, string> = { clear: "Clear", partly_cloudy: "Partly cloudy", cloudy: "Cloudy", fog: "Fog", drizzle: "Drizzle", rain: "Rain", heavy_rain: "Heavy rain", snow: "Snow", thunderstorm: "Thunderstorms", windy: "Windy", unknown: "Forecast" };

export function WeatherSuggestionCard({ context, heading, compact = false, limit }: { context: WeatherSchoolContext; heading?: string; compact?: boolean; limit?: number }) {
  if (context.status === "off") return null;
  if (context.status === "setup_required") return compact ? null : <article className="weather-card weather-card--muted"><strong>Weather setup needed</strong><p>Add coarse coordinates in Settings to use school weather suggestions.</p></article>;
  if (context.status === "unavailable") return compact ? null : <article className="weather-card weather-card--muted"><div className="weather-card__heading"><strong>{heading ?? "School weather"}</strong><Badge tone="neutral">Unavailable</Badge></div><p>Weather is unavailable right now. School readiness still works as normal.</p></article>;
  const suggestions = context.suggestions.slice(0, limit ?? (compact ? 2 : 3));
  if (!suggestions.length && compact) return null;
  const forecast = context.forecast;
  return <article className={`weather-card${suggestions.some((item) => item.severity === "important") ? " weather-card--important" : ""}${compact ? " weather-card--compact" : ""}`}><div className="weather-card__heading"><div><strong>{heading ?? "School weather suggestions"}</strong>{forecast ? <small>{conditionLabels[forecast.condition]}{forecast.minTempC !== undefined && forecast.maxTempC !== undefined ? ` · ${Math.round(forecast.minTempC)}–${Math.round(forecast.maxTempC)}°C` : ""}</small> : null}</div>{context.status === "stale" ? <Badge tone="warning">Weather stale</Badge> : <Badge tone="neutral">Forecast</Badge>}</div>{suggestions.length ? <ul className="weather-suggestion-list">{suggestions.map((item) => <li key={item.id}><Badge tone={item.severity === "important" ? "warning" : "neutral"}>{item.category.replace("_", " ")}</Badge><div><strong>{item.title}</strong>{compact ? null : <p>{item.detail}</p>}</div></li>)}</ul> : <p className="weather-card__quiet">No extra weather preparation suggested.</p>}{!compact && context.snapshot ? <small className="weather-card__updated">Last updated {new Date(context.snapshot.fetchedAt).toLocaleString("en-GB")}</small> : null}</article>;
}
