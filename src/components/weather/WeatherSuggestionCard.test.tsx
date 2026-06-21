import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultWeatherSettings } from "../../data/repositories";
import type { WeatherSchoolContext } from "../../types/weather";
import { WeatherSuggestionCard } from "./WeatherSuggestionCard";

const base: WeatherSchoolContext = { settings: { ...defaultWeatherSettings(), enabled: true }, forecast: { date: "2026-06-22", condition: "rain", minTempC: 10, maxTempC: 16, source: "seed", fetchedAt: "2026-06-21T10:00:00Z" }, snapshot: { id: "forecast", locationLabel: "Lichfield", timezone: "Europe/London", provider: "seed", fetchedAt: "2026-06-21T10:00:00Z", days: [] }, status: "fresh", suggestions: [{ id: "rain", date: "2026-06-22", title: "Take a waterproof coat", detail: "Rain is possible.", severity: "suggestion", category: "rain", appliesTo: "school_day", source: "weather" }] };

describe("WeatherSuggestionCard", () => {
  it("shows a forecast summary and practical suggestion", () => { render(<WeatherSuggestionCard context={base} />); expect(screen.getByText("Rain · 10–16°C")).toBeInTheDocument(); expect(screen.getByText("Take a waterproof coat")).toBeInTheDocument(); });
  it("labels stale and unavailable weather without inventing suggestions", () => { const { rerender } = render(<WeatherSuggestionCard context={{ ...base, status: "stale" }} />); expect(screen.getByText("Weather stale")).toBeInTheDocument(); rerender(<WeatherSuggestionCard context={{ ...base, status: "unavailable", forecast: null, suggestions: [] }} />); expect(screen.getByText(/Weather is unavailable/)).toBeInTheDocument(); });
  it("stays silent when weather is switched off", () => { const { container } = render(<WeatherSuggestionCard context={{ ...base, status: "off" }} />); expect(container).toBeEmptyDOMElement(); });
});
