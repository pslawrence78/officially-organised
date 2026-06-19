import { Link } from "react-router-dom";
import { PREP_TASK_PRIORITY_LABELS, PREP_TASK_STATUS_LABELS } from "../../domain/constants";
import type { FamilyMember, PrepTaskWithEvent } from "../../domain/types";
import { formatPrepDue, isPrepTaskOverdue } from "../../utils/prepTasks";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";

interface PrepTaskCardProps {
  familyMembers: FamilyMember[];
  item: PrepTaskWithEvent;
  onStatusChange?: (status: "open" | "done" | "skipped") => void;
}

export function PrepTaskCard({ familyMembers, item, onStatusChange }: PrepTaskCardProps) {
  const { task, event } = item;
  const overdue = isPrepTaskOverdue(task);
  const owners = task.ownerIds.map((id) => familyMembers.find((member) => member.id === id)?.displayName ?? "Unknown");

  return (
    <article className={`prep-task-card prep-task-card--${task.priority}${overdue ? " is-overdue" : ""}${task.status !== "open" ? " is-cleared" : ""}`}>
      <button aria-label={task.status === "done" ? `Reopen ${task.title}` : `Mark ${task.title} done`} className="prep-task-card__tick" onClick={() => onStatusChange?.(task.status === "done" ? "open" : "done")} type="button"><Icon name={task.status === "done" ? "check" : "prep"} /></button>
      <div className="prep-task-card__body"><div className="prep-task-card__badges"><Badge tone={task.priority === "critical" ? "critical" : task.priority === "important" ? "warning" : "neutral"}>{PREP_TASK_PRIORITY_LABELS[task.priority]}</Badge><Badge tone={task.status === "done" ? "success" : "neutral"}>{PREP_TASK_STATUS_LABELS[task.status]}</Badge>{overdue ? <Badge tone="critical">Overdue</Badge> : null}{task.blocksEvent ? <Badge tone="critical">Blocks event</Badge> : null}</div><h3>{task.title}</h3><Link to={`/events/${event.id}`}>{event.title}</Link><p><strong>Due</strong> {formatPrepDue(task.dueAt)}</p><p><strong>Owner</strong> {owners.length ? owners.join(" & ") : "Unassigned"}</p>{task.notes ? <p className="prep-task-card__notes">{task.notes}</p> : null}</div>
      {task.status === "open" && onStatusChange ? <button className="prep-task-card__skip" onClick={() => onStatusChange("skipped")} type="button">Skip</button> : null}
    </article>
  );
}
