import { Link } from "react-router-dom";
import type { HubCriticalPrepItem } from "../../services/hubService";
import { Badge } from "../common/Badge";
import { HubPanel } from "./HubPanel";

export function HubCriticalPrepPanel({ items, hiddenCount }: { items: HubCriticalPrepItem[]; hiddenCount: number }) {
  return (
    <HubPanel actionLabel="Prep" actionTo="/prep" eyebrow="Critical prep" title="What needs doing first">
      {items.length ? (
        <div className="hub-prep-list">
          {items.map((item) => (
            <article className="hub-prep-card" key={item.id}>
              <div className="hub-prep-card__top">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.dueLabel}</p>
                </div>
                <div className="hub-inline-badges">
                  <Badge tone={item.stateTone}>{item.priorityLabel}</Badge>
                  <Badge>{item.source === "school" ? "School" : "Event"}</Badge>
                </div>
              </div>
              {item.eventTitle && item.eventId ? <p><Link to={`/events/${item.eventId}`}>{item.eventTitle}</Link></p> : null}
              {item.detail ? <p>{item.detail}</p> : null}
            </article>
          ))}
          {hiddenCount ? <p className="section-empty-copy">Plus {hiddenCount} more in <Link to="/prep">Prep</Link>.</p> : null}
        </div>
      ) : <p className="section-empty-copy">No critical or near-term preparation is currently visible.</p>}
    </HubPanel>
  );
}
