import { useState } from "react";
import { CATEGORY_LABELS, EVENT_CATEGORIES, FAMILY_CAR_RESOURCE_ID, RESOURCE_NEED_STATUSES, RESOURCE_NEED_STATUS_LABELS } from "../../domain/constants";
import type { EventSeriesInput, FamilyMember, Place, PrepTaskTemplate, Resource, ResourceNeedStatus, Weekday } from "../../domain/types";
import type { EventSeriesValidationErrors } from "../../domain/validation/eventSeriesValidation";
import { createId } from "../../utils/ids";
import { MemberSelector } from "../events/MemberSelector";

const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function SeriesForm({ value, errors, members, places, resources, saving, onChange, onCancel, onSubmit }: { value: EventSeriesInput; errors: EventSeriesValidationErrors; members: FamilyMember[]; places: Place[]; resources: Resource[]; saving: boolean; onChange: (value: EventSeriesInput) => void; onCancel: () => void; onSubmit: () => void }) {
  const [prepTitle, setPrepTitle] = useState("");
  const updateRule = (patch: Partial<EventSeriesInput["recurrence"]>) => onChange({ ...value, recurrence: { ...value.recurrence, ...patch } });
  const car = value.defaultResourceNeeds.find((need) => need.resourceId === FAMILY_CAR_RESOURCE_ID);
  const setCar = (status: ResourceNeedStatus) => onChange({ ...value, defaultResourceNeeds: status === "not_required" ? [] : [{ id: car?.id ?? createId("need_template"), resourceId: FAMILY_CAR_RESOURCE_ID, needStatus: status, beforeStartMinutes: car?.beforeStartMinutes ?? 15, afterEndMinutes: car?.afterEndMinutes ?? 15 }] });
  const addPrep = () => {
    if (!prepTitle.trim()) return;
    const task: PrepTaskTemplate = { id: createId("prep_template"), title: prepTitle.trim(), ownerIds: [], dueOffsetMinutes: -60, priority: "normal", blocksEvent: false };
    onChange({ ...value, defaultPrepTasks: [...value.defaultPrepTasks, task] });
    setPrepTitle("");
  };

  return (
    <form className="data-form routine-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <section className="form-section">
        <div className="form-section__heading">
          <div>
            <p className="eyebrow">Routine basics</p>
            <h2>{value.title || "New routine"}</h2>
          </div>
          <span className="form-section__hint">Use routines for the repeating things. One-off events still belong in Events.</span>
        </div>
        <p className="section-empty-copy">Changes affect future generated occurrences. Existing one-off events are untouched.</p>
        <label className={`form-field${errors.title ? " has-error" : ""}`}><span>Title</span><input autoFocus onChange={(event) => onChange({ ...value, title: event.target.value })} value={value.title} />{errors.title ? <span className="field-error">{errors.title}</span> : null}</label>
        <div className="form-grid"><label className="form-field"><span>Category</span><select onChange={(event) => onChange({ ...value, category: event.target.value as EventSeriesInput["category"] })} value={value.category}>{EVENT_CATEGORIES.map((item) => <option key={item} value={item}>{CATEGORY_LABELS[item]}</option>)}</select></label><label className="form-field"><span>Frequency</span><select onChange={(event) => updateRule({ frequency: event.target.value as EventSeriesInput["recurrence"]["frequency"] })} value={value.recurrence.frequency}><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option></select></label></div>
        <div className="form-grid">{value.recurrence.frequency === "monthly" ? <label className={`form-field${errors.day ? " has-error" : ""}`}><span>Day of month</span><input max="31" min="1" onChange={(event) => updateRule({ dayOfMonth: Number(event.target.value) })} type="number" value={value.recurrence.dayOfMonth ?? 1} />{errors.day ? <span className="field-error">{errors.day}</span> : null}</label> : <label className={`form-field${errors.day ? " has-error" : ""}`}><span>Weekday</span><select onChange={(event) => updateRule({ dayOfWeek: event.target.value as Weekday })} value={value.recurrence.dayOfWeek}>{WEEKDAYS.map((day) => <option key={day} value={day}>{day[0].toUpperCase() + day.slice(1)}</option>)}</select>{errors.day ? <span className="field-error">{errors.day}</span> : null}</label>}<label className="form-field"><span>Start time</span><input onChange={(event) => updateRule({ startTime: event.target.value })} required type="time" value={value.recurrence.startTime} /></label></div>
        <div className="form-grid"><label className={`form-field${errors.startDate ? " has-error" : ""}`}><span>Start date</span><input onChange={(event) => updateRule({ startDate: event.target.value })} required type="date" value={value.recurrence.startDate} />{errors.startDate ? <span className="field-error">{errors.startDate}</span> : null}</label><label className={`form-field${errors.endDate ? " has-error" : ""}`}><span>End date (optional)</span><input min={value.recurrence.startDate} onChange={(event) => updateRule({ endDate: event.target.value || undefined })} type="date" value={value.recurrence.endDate ?? ""} />{errors.endDate ? <span className="field-error">{errors.endDate}</span> : null}</label></div>
        <div className="form-grid"><label className={`form-field${errors.duration ? " has-error" : ""}`}><span>Duration in minutes</span><input min="1" onChange={(event) => updateRule({ durationMinutes: Number(event.target.value) })} type="number" value={value.recurrence.durationMinutes} />{errors.duration ? <span className="field-error">{errors.duration}</span> : null}</label><label className={`form-field${errors.placeId ? " has-error" : ""}`}><span>Place</span><select onChange={(event) => onChange({ ...value, defaultPlaceId: event.target.value || undefined })} value={value.defaultPlaceId ?? ""}><option value="">No place</option>{places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select>{errors.placeId ? <span className="field-error">{errors.placeId}</span> : null}</label></div>
        <label className="check-row"><input checked={Boolean(value.recurrence.termTimeOnly)} onChange={(event) => updateRule({ termTimeOnly: event.target.checked })} type="checkbox" /><span>Generate during school term time only</span></label>
      </section>

      <section className="form-section">
        <div className="form-section__heading">
          <div>
            <p className="eyebrow">People and responsibility</p>
            <h2>Who is this for?</h2>
          </div>
        </div>
        <MemberSelector error={errors.participants} label="Participants" members={members.filter((item) => item.active)} onChange={(ids) => onChange({ ...value, defaultParticipants: ids })} selectedIds={value.defaultParticipants} />
        <MemberSelector error={errors.responsibleAdults} label="Responsible adults" members={members.filter((item) => item.active && item.memberType === "adult")} onChange={(ids) => onChange({ ...value, defaultResponsibleAdults: ids })} selectedIds={value.defaultResponsibleAdults} />
      </section>

      <details className="form-disclosure" open={Boolean(car)}>
        <summary>Car</summary>
        <div className="form-disclosure__body">
          <fieldset className="form-field form-field--fieldset">
            <legend>Family car</legend>
            <div className="car-status-selector">{RESOURCE_NEED_STATUSES.map((status) => <label className={(car?.needStatus ?? "not_required") === status ? "is-selected" : ""} key={status}><input checked={(car?.needStatus ?? "not_required") === status} onChange={() => setCar(status)} type="radio" /><span>{RESOURCE_NEED_STATUS_LABELS[status]}</span></label>)}</div>
            {car ? <div className="form-grid"><label className="form-field"><span>Minutes before</span><input min="0" onChange={(event) => onChange({ ...value, defaultResourceNeeds: [{ ...car, beforeStartMinutes: Number(event.target.value) }] })} type="number" value={car.beforeStartMinutes} /></label><label className="form-field"><span>Minutes after</span><input min="0" onChange={(event) => onChange({ ...value, defaultResourceNeeds: [{ ...car, afterEndMinutes: Number(event.target.value) }] })} type="number" value={car.afterEndMinutes} /></label></div> : null}
          </fieldset>
        </div>
      </details>

      <details className="form-disclosure" open={value.defaultPrepTasks.length > 0}>
        <summary>Prep</summary>
        <div className="form-disclosure__body">
          <fieldset className="form-field form-field--fieldset">
            <legend>Default preparation</legend>
            <div className="routine-prep-add"><input aria-label="New preparation task" onChange={(event) => setPrepTitle(event.target.value)} placeholder="e.g. Pack swimming kit" value={prepTitle} /><button className="button button--secondary" onClick={addPrep} type="button">Add task</button></div>
            {value.defaultPrepTasks.map((task) => <div className="routine-prep-row" key={task.id}><input aria-label={`Task ${task.title}`} onChange={(event) => onChange({ ...value, defaultPrepTasks: value.defaultPrepTasks.map((item) => item.id === task.id ? { ...item, title: event.target.value } : item) })} value={task.title} /><select aria-label={`Priority for ${task.title}`} onChange={(event) => onChange({ ...value, defaultPrepTasks: value.defaultPrepTasks.map((item) => item.id === task.id ? { ...item, priority: event.target.value as PrepTaskTemplate["priority"] } : item) })} value={task.priority}><option value="normal">Normal</option><option value="important">Important</option><option value="critical">Critical</option></select><button className="button button--secondary" onClick={() => onChange({ ...value, defaultPrepTasks: value.defaultPrepTasks.filter((item) => item.id !== task.id) })} type="button">Remove</button></div>)}
          </fieldset>
        </div>
      </details>

      <details className="form-disclosure" open={Boolean(value.notes?.trim())}>
        <summary>Notes</summary>
        <div className="form-disclosure__body">
          <label className="form-field"><span>Notes (optional)</span><textarea onChange={(event) => onChange({ ...value, notes: event.target.value })} rows={3} value={value.notes ?? ""} /></label>
        </div>
      </details>

      <div className="form-actions"><button className="button button--secondary" onClick={onCancel} type="button">Cancel</button><button className="button button--primary" disabled={saving} type="submit">{saving ? "Saving..." : "Save routine"}</button></div>
    </form>
  );
}
