import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";
import type { SchoolPrepStatus, SchoolReadinessPrepAction } from "../../domain/types";
import { formatLongDate } from "../../utils/dates";
import { setSchoolPrepActionStatus } from "../../data/repositories";

export function SchoolPrepActionCard({ action, compact = false, onStatusChange }: { action: SchoolReadinessPrepAction; compact?: boolean; onStatusChange: (status: Exclude<SchoolPrepStatus, "stale">) => Promise<void> }) {
  const cleared = action.status === "done" || action.status === "skipped";
  return <article className={`school-prep-card school-prep-card--${action.priority}${cleared ? " is-cleared" : ""}${compact ? " school-prep-card--compact" : ""}`}>
    <button aria-label={action.status === "done" ? `Reopen ${action.title}` : `Mark ${action.title} done`} className="prep-task-card__tick" onClick={() => onStatusChange(action.status === "done" ? "open" : "done")} type="button"><Icon name="check" /></button>
    <div className="prep-task-card__body"><div className="prep-task-card__badges"><Badge tone={action.sourceType === "weather_school_suggestion" ? "accent" : "success"}>{action.originLabel}</Badge><Badge tone={action.priority === "critical" ? "critical" : action.blocksSchoolReadiness ? "warning" : "neutral"}>{action.category.replaceAll("_", " ")}</Badge></div><h3>{action.title}</h3>{!compact ? <p>{formatLongDate(action.schoolDate)} · {action.owner === "either" ? "Phil or Beck" : action.owner.replace("member_", "")}</p> : null}{action.detail && !compact ? <p className="prep-task-card__notes">{action.detail}</p> : null}{cleared ? <p>{action.status === "done" ? "Done" : "Skipped"}</p> : null}</div>
    <button className="prep-task-card__skip" onClick={() => onStatusChange(action.status === "skipped" ? "open" : "skipped")} type="button">{action.status === "skipped" ? "Reopen" : "Skip"}</button>
  </article>;
}

export function SchoolPrepActionList({ actions, compact, onChanged }: { actions: SchoolReadinessPrepAction[]; compact?: boolean; onChanged: () => void }) {
  if (!actions.length) return <p className="section-empty-copy">No school preparation actions need attention.</p>;
  return <div className="school-prep-list">{actions.map((action) => <SchoolPrepActionCard action={action} compact={compact} key={action.id} onStatusChange={async (status) => { await setSchoolPrepActionStatus(action.id, status); onChanged(); }} />)}</div>;
}
