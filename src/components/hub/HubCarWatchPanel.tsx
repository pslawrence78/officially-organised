import { Link } from "react-router-dom";
import type { HubCarWatchItem } from "../../services/hubService";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";
import { HubPanel } from "./HubPanel";

export function HubCarWatchPanel({ items }: { items: HubCarWatchItem[] }) {
  return (
    <HubPanel actionLabel="Car" actionTo="/car" eyebrow="Car watch" title="Shared family car">
      {items.length ? (
        <div className="hub-car-list">
          {items.map((item) => (
            <Link className="hub-car-card" key={item.id} to={`/events/${item.eventId}`}>
              <div className="hub-car-card__icon"><Icon name="car" /></div>
              <div className="hub-car-card__body">
                <div className="hub-inline-badges">
                  <Badge tone={item.needLabel === "Required" ? "critical" : "warning"}>{item.needLabel}</Badge>
                  <Badge>{item.dayLabel}</Badge>
                  {item.conflictLabel ? <Badge tone={item.conflictTone}>{item.conflictLabel}</Badge> : null}
                </div>
                <h3>{item.eventTitle}</h3>
                <p>{item.windowLabel}</p>
                <p><strong>Allocated</strong> {item.allocatedLabel}</p>
                {item.notes ? <p>{item.notes}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      ) : <p className="section-empty-copy">No one has asked for the car today or tomorrow.</p>}
    </HubPanel>
  );
}
