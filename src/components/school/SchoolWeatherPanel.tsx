import type { SchoolHubWeatherSummary } from "../../services/schoolHubService";
import { Link } from "react-router-dom";
import { Badge } from "../common/Badge";

export function SchoolWeatherPanel({ weather }: { weather: SchoolHubWeatherSummary }) {
  return (
    <section className="section-block school-hub-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Optional weather layer</p>
          <h2>School weather</h2>
        </div>
        <Badge tone={weather.status === "fresh" ? "success" : weather.status === "off" ? "neutral" : "warning"}>{weather.title}</Badge>
      </div>
      <p className="section-empty-copy">{weather.detail}</p>
      {weather.locationLabel ? <p className="section-empty-copy">Location: {weather.locationLabel}</p> : null}
      {weather.freshnessLabel ? <p className="section-empty-copy">{weather.freshnessLabel}</p> : null}
      <div className="school-hub-weather-grid">
        <article className="school-hub-weather-day">
          <strong>Today</strong>
          {weather.todaySuggestions.length ? <ul className="school-hub-inline-list">{weather.todaySuggestions.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="section-empty-copy">No extra weather preparation suggested.</p>}
        </article>
        <article className="school-hub-weather-day">
          <strong>Tomorrow</strong>
          {weather.tomorrowSuggestions.length ? <ul className="school-hub-inline-list">{weather.tomorrowSuggestions.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="section-empty-copy">No extra weather preparation suggested.</p>}
        </article>
      </div>
      <Link className="back-link" to={weather.link.to}>{weather.link.label}</Link>
    </section>
  );
}
