import { Link } from "react-router-dom";
import { RESOURCE_NEED_STATUS_LABELS } from "../../domain/constants";
import type { FamilyMember, ResourceNeedWithEvent } from "../../domain/types";
import { formatEventTime } from "../../utils/dates";
import { formatResourceWindow } from "../../utils/resourceNeeds";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";

export function CarNeedCard({ item, familyMembers }: { item: ResourceNeedWithEvent; familyMembers: FamilyMember[] }) {
  const { need, event } = item;
  const allocated = need.allocatedTo ? familyMembers.find((member) => member.id === need.allocatedTo)?.displayName ?? "Unknown" : "Not allocated";
  return <article className={`car-need-card car-need-card--${need.needStatus}`}><span className="car-need-card__icon"><Icon name="car" /></span><div className="car-need-card__body"><div><Badge tone={need.needStatus === "required" ? "critical" : "warning"}>{RESOURCE_NEED_STATUS_LABELS[need.needStatus]}</Badge></div><h3><Link to={`/events/${event.id}`}>{event.title}</Link></h3><p className="car-need-card__window">{formatResourceWindow(need)}</p><p><strong>Allocated</strong> {allocated}</p><p><strong>Event</strong> {formatEventTime(event)}</p>{need.notes ? <p className="car-need-card__notes">{need.notes}</p> : null}</div></article>;
}
