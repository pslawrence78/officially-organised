import type { HubWeatherSuggestionSummary } from "../../services/hubService";
import { Badge } from "../common/Badge";
import { HubPanel } from "./HubPanel";

export function HubWeatherSuggestionsPanel({ items }: { items: HubWeatherSuggestionSummary[] }) {
  return (
    <HubPanel accent="sky" eyebrow="Weather suggestions" title="Today and tomorrow">
      <div className="hub-weather-list">
        {items.map((item) => (
          <article className="hub-weather-card" key={item.date}>
            <div className="hub-weather-card__header">
              <div>
                <strong>{item.heading}</strong>
                {item.forecastLabel ? <p>{item.forecastLabel}</p> : null}
              </div>
              <Badge tone={item.status === "stale" ? "warning" : item.status === "unavailable" ? "neutral" : "accent"}>{item.statusLabel}</Badge>
            </div>
            {item.suggestions.length ? (
              <ul className="hub-plain-list">
                {item.suggestions.slice(0, 3).map((suggestion) => (
                  <li key={suggestion.id}>
                    <strong>{suggestion.title}</strong>
                    {suggestion.detail ? <p>{suggestion.detail}</p> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="section-empty-copy">No extra weather prep suggested.</p>}
            {item.lastUpdatedLabel ? <small>Updated {item.lastUpdatedLabel}</small> : null}
          </article>
        ))}
      </div>
    </HubPanel>
  );
}
