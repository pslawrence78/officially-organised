import { Badge } from "../common/Badge";
import { CATEGORY_LABELS, FAMILY_CAR_RESOURCE_ID, RESOURCE_NEED_STATUS_LABELS } from "../../domain/constants";
import type { EventOccurrence, EventSeries, FamilyMember } from "../../domain/types";
import { formatEventTime, formatLongDate, isoToDateKey } from "../../utils/dates";

export function SeriesCard({ series, members, next, onEdit, onStatus }: { series: EventSeries; members: FamilyMember[]; next?: EventOccurrence; onEdit: () => void; onStatus: (status: EventSeries["status"]) => void }) {
  const names = (ids: string[]) => ids.map((id) => members.find((member) => member.id === id)?.displayName ?? "Unknown").join(", ") || "None";
  const car = series.defaultResourceNeeds.find((need) => need.resourceId === FAMILY_CAR_RESOURCE_ID);
  const frequency = series.recurrence.frequency === "fortnightly" ? "Every fortnight" : series.recurrence.frequency === "monthly" ? "Every month" : "Every week";
  const day = series.recurrence.frequency === "monthly" ? `day ${series.recurrence.dayOfMonth}` : series.recurrence.dayOfWeek;
  return <article className="routine-card">
    <div className="routine-card__badges"><Badge tone="accent">{CATEGORY_LABELS[series.category]}</Badge><Badge tone={series.status === "active" ? "success" : "neutral"}>{series.status}</Badge>{series.recurrence.termTimeOnly ? <Badge tone="neutral">Term time only</Badge> : null}</div>
    <h2>{series.title}</h2><p className="routine-card__schedule">{frequency} · {day} at {series.recurrence.startTime}</p>
    <dl className="routine-card__details"><div><dt>Participants</dt><dd>{names(series.defaultParticipants)}</dd></div><div><dt>Responsible</dt><dd>{names(series.defaultResponsibleAdults)}</dd></div><div><dt>Car</dt><dd>{car ? RESOURCE_NEED_STATUS_LABELS[car.needStatus] : "Not required"}</dd></div><div><dt>Next</dt><dd>{next ? `${formatLongDate(isoToDateKey(next.startAt))}, ${formatEventTime(next)}` : "No upcoming occurrence"}</dd></div></dl>
    <div className="form-actions"><button className="button button--secondary" onClick={onEdit} type="button">Edit routine</button>{series.status === "active" ? <button className="button button--secondary" onClick={() => onStatus("paused")} type="button">Pause</button> : <button className="button button--secondary" onClick={() => onStatus("active")} type="button">Resume</button>}<button className="button button--danger" onClick={() => onStatus("archived")} type="button">Archive</button></div>
  </article>;
}
