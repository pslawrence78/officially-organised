import type { HubDaySummary } from "../../services/hubService";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";
import { HubPanel } from "./HubPanel";

export function HubDayPanel({ eyebrow, title, day }: {
  eyebrow: string;
  title: string;
  day: HubDaySummary;
}) {
  return (
    <HubPanel eyebrow={eyebrow} title={title}>
      <div className="hub-day-panel">
        <div className="hub-day-panel__summary">
          <strong>{day.label}</strong>
          <div className="hub-inline-list">
            {day.schoolPreview ? <span>{day.schoolPreview}</span> : null}
            {day.prepPreview ? <span>{day.prepPreview}</span> : null}
            {day.carPreview ? <span>{day.carPreview}</span> : null}
            {day.weatherPreview ? <span>{day.weatherPreview}</span> : null}
          </div>
        </div>
        {day.items.length ? (
          <div className="hub-event-list">
            {day.items.map((item) => (
              <article className="hub-event-card" key={item.id}>
                <div className="hub-event-card__meta">
                  <span className="hub-event-card__time">{item.timeLabel}</span>
                  <div className="hub-event-card__badges">
                    <Badge tone="accent">{item.eventCategoryLabel}</Badge>
                    {item.isRoutine ? <Badge tone="neutral">Routine</Badge> : null}
                    {item.attentionTone ? <Badge tone={item.attentionTone}>{item.attentionTone === "critical" ? "Needs attention" : "Check"}</Badge> : null}
                  </div>
                </div>
                <div className="hub-event-card__body">
                  <h3>{item.title}</h3>
                  <p><strong>With</strong> {item.participantsLabel}</p>
                  <p><strong>Responsible</strong> {item.responsibleLabel}</p>
                  {item.placeLabel ? <p><Icon name="place" /> {item.placeLabel}</p> : null}
                  {item.locationDetail ? <p>{item.locationDetail}</p> : null}
                  {item.notes ? <p>{item.notes}</p> : null}
                </div>
                <div className="hub-event-card__flags">
                  {item.carBadge ? <span>{item.carBadge}</span> : null}
                  {item.prepBadge ? <span>{item.prepBadge}</span> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="hub-empty-state">
            <span className="hub-empty-state__icon"><Icon name="today" /></span>
            <div>
              <strong>Nothing scheduled</strong>
              <p>This part of the day is calm for now.</p>
            </div>
          </div>
        )}
      </div>
    </HubPanel>
  );
}
