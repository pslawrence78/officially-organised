import type { SchoolHubDaySummary } from "../../services/schoolHubService";
import { Badge } from "../common/Badge";

function toneForStatus(status: SchoolHubDaySummary["schoolStatus"]) {
  if (status === "open") return "success";
  if (status === "closed") return "warning";
  return "neutral";
}

export function SchoolDaySummaryCard({ summary, emphasis = false }: { summary: SchoolHubDaySummary; emphasis?: boolean }) {
  return (
    <article className={`school-hub-card school-hub-card--day${emphasis ? " school-hub-card--day-emphasis" : ""}`}>
      <div className="school-hub-card__header">
        <div>
          <p className="eyebrow">{summary.date}</p>
          <h2>{summary.label}</h2>
        </div>
        <Badge tone={toneForStatus(summary.schoolStatus)}>{summary.schoolStatusLabel}</Badge>
      </div>
      <dl className="school-hub-facts">
        <div><dt>Lunch</dt><dd>{summary.lunchLabel}</dd></div>
        <div><dt>Attire</dt><dd>{summary.attireLabel}</dd></div>
        <div><dt>Forest School</dt><dd>{summary.forestSchoolLabel}</dd></div>
        <div><dt>Prep actions</dt><dd>{summary.openActionCount ? `${summary.openActionCount} open` : "Nothing open"}</dd></div>
      </dl>
      <div className="school-hub-card__footer">
        <Badge tone={summary.setupGapCount ? "warning" : "success"}>
          {summary.setupGapCount ? `${summary.setupGapCount} setup gap${summary.setupGapCount === 1 ? "" : "s"}` : "Configured"}
        </Badge>
        {summary.weatherSuggestionCount ? <Badge tone="accent">{summary.weatherSuggestionCount} weather note{summary.weatherSuggestionCount === 1 ? "" : "s"}</Badge> : null}
      </div>
      {summary.weatherSuggestionLabels.length ? (
        <ul className="school-hub-inline-list">
          {summary.weatherSuggestionLabels.slice(0, 2).map((label) => <li key={label}>{label}</li>)}
        </ul>
      ) : null}
    </article>
  );
}
