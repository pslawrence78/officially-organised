import { Link } from "react-router-dom";
import { CATEGORY_LABELS, STATUS_LABELS } from "../../domain/constants";
import type { FamilyEvent, FamilyMember, Place } from "../../domain/types";
import { formatEventTime } from "../../utils/dates";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";

interface EventCardProps {
  event: FamilyEvent;
  familyMembers: FamilyMember[];
  place?: Place;
}

export function EventCard({ event, familyMembers, place }: EventCardProps) {
  const namesFor = (ids: string[]) => ids.map((id) => familyMembers.find((member) => member.id === id)?.displayName ?? "Unknown");
  const participantNames = namesFor(event.participants);
  const responsibleNames = namesFor(event.responsibleAdults);

  return (
    <Link className={`event-card event-card--${event.status}`} to={`/events/${event.id}`}>
      <div className="event-card__time">
        <Icon name="clock" />
        <span>{formatEventTime(event)}</span>
      </div>
      <div className="event-card__body">
        <div className="event-card__badges">
          <Badge tone="accent">{CATEGORY_LABELS[event.category]}</Badge>
          <Badge tone={event.status === "confirmed" ? "success" : "neutral"}>{STATUS_LABELS[event.status]}</Badge>
        </div>
        <h3>{event.title}</h3>
        <p><strong>With</strong> {participantNames.join(", ")}</p>
        {responsibleNames.length > 0 ? <p><strong>Responsible</strong> {responsibleNames.join(", ")}</p> : null}
        {event.placeId ? <p className="event-card__place"><Icon name="place" /> {place?.name ?? "Place unavailable"}</p> : null}
      </div>
      <Icon className="event-card__chevron" name="chevron" />
    </Link>
  );
}
