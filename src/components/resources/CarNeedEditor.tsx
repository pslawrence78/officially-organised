import { RESOURCE_NEED_STATUS_LABELS, RESOURCE_NEED_STATUSES } from "../../domain/constants";
import type { FamilyMember, Resource, ResourceNeed, ResourceNeedStatus } from "../../domain/types";
import { isoToDateTimeLocal, localDateTimeToIso } from "../../utils/dates";
import { createId } from "../../utils/ids";
import { Icon } from "../common/Icon";

interface CarNeedEditorProps {
  adults: FamilyMember[];
  defaultFrom: string;
  defaultUntil: string;
  error?: string;
  need?: ResourceNeed;
  onChange: (need?: ResourceNeed) => void;
  resource: Resource;
}

export function CarNeedEditor({ adults, defaultFrom, defaultUntil, error, need, onChange, resource }: CarNeedEditorProps) {
  const status: ResourceNeedStatus = need?.needStatus ?? "not_required";

  const update = (updates: Partial<ResourceNeed>) => {
    if (!need) return;
    onChange({ ...need, ...updates, updatedAt: new Date(Math.max(Date.now(), Date.parse(need.updatedAt) + 1)).toISOString() });
  };

  const changeStatus = (nextStatus: ResourceNeedStatus) => {
    if (nextStatus === "not_required") {
      onChange(undefined);
      return;
    }
    if (need) {
      update({ needStatus: nextStatus });
      return;
    }
    const timestamp = new Date().toISOString();
    onChange({
      id: createId("resource_need"),
      resourceId: resource.id,
      needStatus: nextStatus,
      neededFrom: localDateTimeToIso(defaultFrom),
      neededUntil: localDateTimeToIso(defaultUntil),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  };

  return (
    <section className={`car-need-editor${error ? " has-error" : ""}`}>
      <div className="car-need-editor__heading"><span className="summary-card__icon"><Icon name="car" /></span><div><p className="eyebrow">Shared resource</p><h2>{resource.name}</h2><p>The car window can begin before the event and end afterwards.</p></div></div>
      <fieldset className="car-status-selector"><legend>Is the car needed?</legend>{RESOURCE_NEED_STATUSES.map((value) => <label className={status === value ? "is-selected" : ""} key={value}><input checked={status === value} name="car-status" onChange={() => changeStatus(value)} type="radio" value={value} /><span>{RESOURCE_NEED_STATUS_LABELS[value]}</span></label>)}</fieldset>
      {error ? <span className="field-error">{error}</span> : null}
      {need ? <div className="car-need-editor__details"><div className="form-grid"><label className="form-field"><span>Needed from</span><input onChange={(event) => update({ neededFrom: event.target.value ? localDateTimeToIso(event.target.value) : undefined })} type="datetime-local" value={need.neededFrom ? isoToDateTimeLocal(need.neededFrom) : ""} /></label><label className="form-field"><span>Needed until</span><input onChange={(event) => update({ neededUntil: event.target.value ? localDateTimeToIso(event.target.value) : undefined })} type="datetime-local" value={need.neededUntil ? isoToDateTimeLocal(need.neededUntil) : ""} /></label></div><label className="form-field"><span>Allocated to (optional)</span><select onChange={(event) => update({ allocatedTo: event.target.value || undefined })} value={need.allocatedTo ?? ""}><option value="">Not allocated</option>{adults.map((adult) => <option key={adult.id} value={adult.id}>{adult.displayName}</option>)}</select></label><label className="form-field"><span>Resource notes (optional)</span><textarea onChange={(event) => update({ notes: event.target.value || undefined })} placeholder="Anything practical about collecting or returning the car" rows={3} value={need.notes ?? ""} /></label></div> : <p className="car-need-editor__empty">No car window will be attached to this event.</p>}
    </section>
  );
}
