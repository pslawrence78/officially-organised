import { Link } from "react-router-dom";
import { CATEGORY_LABELS, FAMILY_CAR_RESOURCE_ID, RESOURCE_NEED_STATUS_LABELS, STATUS_LABELS } from "../../domain/constants";
import type { Conflict, FamilyEvent, FamilyMember, Place } from "../../domain/types";
import { formatEventTime } from "../../utils/dates";
import { formatResourceWindow } from "../../utils/resourceNeeds";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";

interface EventCardProps {
  event: FamilyEvent;
  familyMembers: FamilyMember[];
  place?: Place;
  conflicts?: Conflict[];
}

export function EventCard({ event, familyMembers, place, conflicts = [] }: EventCardProps) {
  const namesFor = (ids: string[]) => ids.map((id) => familyMembers.find((member) => member.id === id)?.displayName ?? "Unknown");
  const participantNames = namesFor(event.participants);
  const responsibleNames = namesFor(event.responsibleAdults);
  const openPrep = event.prepTasks.filter((task) => task.status === "open");
  const criticalPrep = openPrep.filter((task) => task.priority === "critical");
  const carNeed = event.resourceNeeds.find((need) => need.resourceId === FAMILY_CAR_RESOURCE_ID && need.needStatus !== "not_required");

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
          {event.seriesId && event.occurrenceDate ? <Badge tone="neutral">Routine</Badge> : null}
          {conflicts.length ? <Badge tone={conflicts.some((conflict) => conflict.severity === "critical") ? "critical" : "warning"}>{conflicts.length} need{conflicts.length === 1 ? "" : "s"} attention</Badge> : null}
        </div>
        <h3>{event.title}</h3>
        <p><strong>With</strong> {participantNames.join(", ")}</p>
        {responsibleNames.length > 0 ? <p><strong>Responsible</strong> {responsibleNames.join(", ")}</p> : null}
        {event.placeId ? <p className="event-card__place"><Icon name="place" /> {place?.name ?? "Place unavailable"}</p> : null}
        {openPrep.length ? <p className={`event-card__prep${criticalPrep.length ? " event-card__prep--critical" : ""}`}><Icon name="prep" /> {openPrep.length} prep task{openPrep.length === 1 ? "" : "s"} open{criticalPrep.length ? ` · ${criticalPrep.length} critical` : ""}</p> : null}
        {carNeed ? <p className={`event-card__car event-card__car--${carNeed.needStatus}`}><Icon name="car" /> Car {RESOURCE_NEED_STATUS_LABELS[carNeed.needStatus].toLowerCase()} · {formatResourceWindow(carNeed)}</p> : null}
      </div>
      <Icon className="event-card__chevron" name="chevron" />
    </Link>
  );
}
