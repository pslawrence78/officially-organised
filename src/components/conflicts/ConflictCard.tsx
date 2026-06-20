import { Link } from "react-router-dom";
import type { Conflict, FamilyEvent } from "../../domain/types";
import { Badge } from "../common/Badge";

export function ConflictCard({ conflict, events }: { conflict: Conflict; events: FamilyEvent[] }) {
  const event = events.find((item) => item.id === conflict.eventIds[0]);
  const content = (
    <>
      <div className="conflict-card__heading">
        <Badge tone={conflict.severity}>{conflict.severity === "critical" ? "Action needed" : "Check this"}</Badge>
        <h3>{conflict.title}</h3>
      </div>
      <p>{conflict.description}</p>
    </>
  );
  return event ? <Link className={`conflict-card conflict-card--${conflict.severity}`} to={`/events/${event.id}`}>{content}</Link> : <article className={`conflict-card conflict-card--${conflict.severity}`}>{content}</article>;
}

export function ConflictList({ conflicts, events }: { conflicts: Conflict[]; events: FamilyEvent[] }) {
  if (!conflicts.length) return null;
  return <div className="conflict-list">{conflicts.map((conflict) => <ConflictCard conflict={conflict} events={events} key={conflict.id} />)}</div>;
}
