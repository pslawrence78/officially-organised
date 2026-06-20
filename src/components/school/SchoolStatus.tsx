import { Link } from "react-router-dom";
import type { SchoolDayStatus } from "../../domain/types";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";

export function SchoolStatus({ status, context = "today", linked = false }: { status: SchoolDayStatus; context?: "dashboard" | "today" | "week"; linked?: boolean }) {
  const summary = status.status === "open"
    ? context === "dashboard" ? "Seb: school open today" : "Seb is in school today"
    : status.status === "closed"
      ? context === "dashboard" ? `Seb: school closed today — ${status.label}` : `Seb is not in school — ${status.label}`
      : status.reason === "no_calendar" ? "School calendar not yet configured" : `Seb’s school status is unknown — ${status.label}`;
  const body = <><span className="school-status__icon"><Icon name="school" /></span><div><Badge tone={status.status === "open" ? "success" : status.status === "closed" ? "warning" : "neutral"}>{status.status === "open" ? "School open" : status.status === "closed" ? "School closed" : "Unknown"}</Badge><strong>{summary}</strong></div>{linked ? <Icon className="school-status__chevron" name="chevron" /> : null}</>;
  return linked ? <Link className={`school-status school-status--${status.status}`} to="/settings/school-calendar">{body}</Link> : <div className={`school-status school-status--${status.status}`}>{body}</div>;
}

export function SchoolDayIndicator({ status }: { status: SchoolDayStatus }) {
  return <span aria-label={`Seb school ${status.status}: ${status.label}`} className={`school-day-indicator school-day-indicator--${status.status}`} title={status.label}><Icon name="school" />{status.status === "open" ? "Open" : status.status === "closed" ? status.reason === "weekend" ? "Closed" : status.label : "Unknown"}</span>;
}
