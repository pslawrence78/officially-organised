import { useState } from "react";
import { PREP_TASK_PRIORITIES, PREP_TASK_PRIORITY_LABELS, PREP_TASK_STATUSES, PREP_TASK_STATUS_LABELS } from "../../domain/constants";
import { cleanPrepTask, validatePrepTask, type PrepTaskValidationErrors } from "../../domain/validation/prepTaskValidation";
import type { FamilyMember, PrepTask } from "../../domain/types";
import { formatPrepDue } from "../../utils/prepTasks";
import { createId } from "../../utils/ids";
import { isoToDateTimeLocal, localDateTimeToIso } from "../../utils/dates";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";
import { MemberSelector } from "../events/MemberSelector";

interface PrepTaskEditorProps {
  adults: FamilyMember[];
  error?: string;
  onChange: (tasks: PrepTask[]) => void;
  tasks: PrepTask[];
}

function newTask(): PrepTask {
  const timestamp = new Date().toISOString();
  return { id: createId("prep"), title: "", ownerIds: [], priority: "normal", status: "open", blocksEvent: false, createdAt: timestamp, updatedAt: timestamp };
}

export function PrepTaskEditor({ adults, error, onChange, tasks }: PrepTaskEditorProps) {
  const [draft, setDraft] = useState<PrepTask | undefined>();
  const [dueLocal, setDueLocal] = useState("");
  const [draftErrors, setDraftErrors] = useState<PrepTaskValidationErrors>({});

  const begin = (task?: PrepTask) => {
    const next = task ? { ...task, ownerIds: [...task.ownerIds] } : newTask();
    setDraft(next);
    setDueLocal(next.dueAt ? isoToDateTimeLocal(next.dueAt) : "");
    setDraftErrors({});
  };

  const save = () => {
    if (!draft) return;
    let dueAt: string | undefined;
    try {
      dueAt = dueLocal ? localDateTimeToIso(dueLocal) : undefined;
    } catch {
      setDraftErrors({ dueAt: "Choose a valid due date and time." });
      return;
    }
    const timestamp = new Date(Math.max(Date.now(), Date.parse(draft.updatedAt) + 1)).toISOString();
    const task = cleanPrepTask({ ...draft, dueAt, updatedAt: timestamp });
    const errors = validatePrepTask(task, adults);
    setDraftErrors(errors);
    if (Object.keys(errors).length) return;
    onChange(tasks.some((item) => item.id === task.id) ? tasks.map((item) => item.id === task.id ? task : item) : [...tasks, task]);
    setDraft(undefined);
  };

  const remove = (taskId: string) => {
    onChange(tasks.filter((task) => task.id !== taskId));
    if (draft?.id === taskId) setDraft(undefined);
  };

  return (
    <section className={`prep-editor${error ? " has-error" : ""}`}>
      <div className="prep-editor__heading"><div><p className="eyebrow">Operational memory</p><h2>Preparation tasks</h2><p>Add only what this event needs you to remember.</p></div><button className="button button--secondary" onClick={() => begin()} type="button"><Icon name="plus" /> Add task</button></div>
      {error ? <span className="field-error">{error}</span> : null}
      {tasks.length ? <div className="prep-editor__list">{tasks.map((task) => <article className={`prep-editor-item prep-editor-item--${task.priority}`} key={task.id}><div><div className="prep-editor-item__badges"><Badge tone={task.priority === "critical" ? "critical" : task.priority === "important" ? "warning" : "neutral"}>{PREP_TASK_PRIORITY_LABELS[task.priority]}</Badge><Badge tone={task.status === "done" ? "success" : "neutral"}>{PREP_TASK_STATUS_LABELS[task.status]}</Badge>{task.blocksEvent ? <Badge tone="critical">Blocks event</Badge> : null}</div><strong>{task.title}</strong><small>{formatPrepDue(task.dueAt)}</small></div><div className="prep-editor-item__actions"><button aria-label={`Edit ${task.title}`} onClick={() => begin(task)} type="button"><Icon name="edit" /></button><button aria-label={`Delete ${task.title}`} onClick={() => remove(task.id)} type="button"><Icon name="trash" /></button></div></article>)}</div> : <p className="prep-editor__empty">No preparation tasks attached yet.</p>}

      {draft ? <div className="prep-task-draft"><div className="prep-task-draft__header"><h3>{tasks.some((task) => task.id === draft.id) ? "Edit preparation task" : "New preparation task"}</h3><button aria-label="Close task editor" className="icon-button" onClick={() => setDraft(undefined)} type="button"><Icon name="close" /></button></div><label className={`form-field${draftErrors.title ? " has-error" : ""}`}><span>Task</span><input autoFocus onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Pack swimming kit" value={draft.title} />{draftErrors.title ? <span className="field-error">{draftErrors.title}</span> : null}</label><MemberSelector error={draftErrors.ownerIds} label="Owner (optional)" members={adults} onChange={(ownerIds) => setDraft({ ...draft, ownerIds })} selectedIds={draft.ownerIds} /><div className="form-grid"><label className="form-field"><span>Due date and time (optional)</span><input onChange={(event) => setDueLocal(event.target.value)} type="datetime-local" value={dueLocal} />{draftErrors.dueAt ? <span className="field-error">{draftErrors.dueAt}</span> : null}</label><label className="form-field"><span>Priority</span><select onChange={(event) => setDraft({ ...draft, priority: event.target.value as PrepTask["priority"] })} value={draft.priority}>{PREP_TASK_PRIORITIES.map((priority) => <option key={priority} value={priority}>{PREP_TASK_PRIORITY_LABELS[priority]}</option>)}</select></label></div><label className="form-field"><span>Status</span><select onChange={(event) => setDraft({ ...draft, status: event.target.value as PrepTask["status"] })} value={draft.status}>{PREP_TASK_STATUSES.map((status) => <option key={status} value={status}>{PREP_TASK_STATUS_LABELS[status]}</option>)}</select></label><label className="toggle-field"><input checked={draft.blocksEvent} onChange={(event) => setDraft({ ...draft, blocksEvent: event.target.checked })} type="checkbox" /><span><strong>Blocks the event</strong><small>The commitment is at risk if this stays open.</small></span></label><label className="form-field"><span>Notes (optional)</span><textarea onChange={(event) => setDraft({ ...draft, notes: event.target.value })} rows={3} value={draft.notes ?? ""} /></label><div className="form-actions"><button className="button button--secondary" onClick={() => setDraft(undefined)} type="button">Cancel</button><button className="button button--primary" onClick={save} type="button">Save task</button></div></div> : null}
    </section>
  );
}
