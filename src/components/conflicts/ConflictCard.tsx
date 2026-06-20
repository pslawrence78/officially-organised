import { Link } from "react-router-dom";
import type { Conflict, FamilyEvent } from "../../domain/types";
import { Badge } from "../common/Badge";

interface ConflictCardProps {
  conflict: Conflict;
  events: FamilyEvent[];
  onPrepComplete?: (eventId: string, taskId: string) => void;
}

export function ConflictCard({ conflict, events, onPrepComplete }: ConflictCardProps) {
  const event = events.find((item) => item.id === conflict.eventIds[0]);
  const label = conflict.type === "car_clash" ? "Car clash"
    : conflict.type === "maybe_car_clash" ? "Possible car clash"
      : conflict.type === "critical_prep_overdue" ? "Blocking prep"
        : conflict.type === "prep_overdue" ? "Overdue prep"
          : "Responsibility gap";
  const action = conflict.type === "car_clash" ? "Open the event and agree how each journey will work."
    : conflict.type === "maybe_car_clash" ? "Confirm whether the maybe journey needs the car."
      : conflict.type === "critical_prep_overdue" ? "Complete this before the event can go ahead."
        : conflict.type === "prep_overdue" ? "Complete it or update the plan."
          : "Choose a responsible adult for this event.";
  const content = (
    <>
      <div className="conflict-card__heading">
        <Badge tone={conflict.severity}>{label}</Badge>
        <h3>{conflict.title}</h3>
      </div>
      <p>{conflict.description}</p>
      <p className="conflict-card__action">{action}</p>
    </>
  );
  if (event && conflict.prepTaskId && onPrepComplete) {
    return <article className={`conflict-card conflict-card--${conflict.severity}`}>{content}<div className="conflict-card__actions"><Link to={`/events/${event.id}`}>Open {event.title}</Link><button onClick={() => onPrepComplete(event.id, conflict.prepTaskId!)} type="button">Mark complete</button></div></article>;
  }
  return event ? <Link className={`conflict-card conflict-card--${conflict.severity}`} to={`/events/${event.id}`}>{content}</Link> : <article className={`conflict-card conflict-card--${conflict.severity}`}>{content}</article>;
}

export function ConflictList({ conflicts, events, onPrepComplete }: { conflicts: Conflict[]; events: FamilyEvent[]; onPrepComplete?: ConflictCardProps["onPrepComplete"] }) {
  if (!conflicts.length) return null;
  return <div className="conflict-list">{conflicts.map((conflict) => <ConflictCard conflict={conflict} events={events} key={conflict.id} onPrepComplete={onPrepComplete} />)}</div>;
}
