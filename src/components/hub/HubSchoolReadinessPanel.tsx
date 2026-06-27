import type { HubSchoolReadinessSummary } from "../../services/hubService";
import { Badge } from "../common/Badge";
import { HubPanel } from "./HubPanel";

export function HubSchoolReadinessPanel({ readiness }: { readiness: HubSchoolReadinessSummary }) {
  return (
    <HubPanel accent="sage" eyebrow="School readiness" title="Seb today">
      <div className="hub-school-panel">
        <div className="hub-inline-badges">
          <Badge tone={readiness.schoolStatus === "open" ? "success" : readiness.schoolStatus === "closed" ? "neutral" : "warning"}>{readiness.schoolStatusLabel}</Badge>
          {readiness.lunchLabel ? <Badge>{readiness.lunchLabel}</Badge> : null}
          {readiness.attireLabel ? <Badge>{readiness.attireLabel}</Badge> : null}
          {readiness.forestSchoolLabel ? <Badge tone="warning">{readiness.forestSchoolLabel}</Badge> : null}
        </div>
        {readiness.lunchChoice ? <p><strong>Lunch:</strong> {readiness.lunchChoice}</p> : null}
        {readiness.attireNotes ? <p><strong>Attire note:</strong> {readiness.attireNotes}</p> : null}
        {readiness.warnings.length ? (
          <ul className="hub-notice-list">
            {readiness.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        ) : readiness.schoolStatus === "closed" ? <p className="section-empty-copy">Closed day. No school-readiness actions need surfacing.</p> : <p className="section-empty-copy">Nothing looks blocked right now.</p>}
        <div className="hub-school-actions">
          {readiness.actions.length ? readiness.actions.slice(0, 5).map((action) => (
            <article className={`hub-school-action hub-school-action--${action.state}`} key={action.id}>
              <div>
                <strong>{action.title}</strong>
                <p>{action.dueLabel} · {action.ownerLabel}</p>
                {action.detail ? <p>{action.detail}</p> : null}
              </div>
              <div className="hub-inline-badges">
                <Badge tone={action.state === "open" ? (action.blocksSchoolReadiness ? "warning" : "neutral") : action.state === "stale" ? "neutral" : "success"}>{action.state}</Badge>
                <Badge>{action.priorityLabel}</Badge>
              </div>
            </article>
          )) : null}
        </div>
      </div>
    </HubPanel>
  );
}
