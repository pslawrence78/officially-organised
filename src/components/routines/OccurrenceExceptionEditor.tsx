import { useState } from "react";
import type { EventOccurrence, EventSeries, FamilyMember, ResourceNeedStatus } from "../../domain/types";
import { FAMILY_CAR_RESOURCE_ID, RESOURCE_NEED_STATUS_LABELS, RESOURCE_NEED_STATUSES } from "../../domain/constants";
import { cancelOccurrence, changeOccurrenceResources, changeOccurrenceResponsibility, moveOccurrence } from "../../data/repositories";
import { MemberSelector } from "../events/MemberSelector";
import { isoToDateKey } from "../../utils/dates";

export function OccurrenceExceptionEditor({ occurrence, series, members, onChanged, onClose }: { occurrence: EventOccurrence; series: EventSeries; members: FamilyMember[]; onChanged: (cancelled?: boolean) => void; onClose: () => void }) {
  const [date, setDate] = useState(isoToDateKey(occurrence.startAt));
  const [time, setTime] = useState(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(occurrence.startAt)));
  const [adults, setAdults] = useState(occurrence.responsibleAdults);
  const [carStatus, setCarStatus] = useState<ResourceNeedStatus>(occurrence.resourceNeeds.find((need) => need.resourceId === FAMILY_CAR_RESOURCE_ID)?.needStatus ?? "not_required");
  const [saving, setSaving] = useState(false);
  const saveOverrides = async () => {
    setSaving(true);
    await changeOccurrenceResponsibility(series.id, occurrence.occurrenceDate!, adults);
    const timestamp = new Date().toISOString();
    await changeOccurrenceResources(series.id, occurrence.occurrenceDate!, carStatus === "not_required" ? [] : [{ id: `need_${series.id}_${occurrence.occurrenceDate}_override`, resourceId: FAMILY_CAR_RESOURCE_ID, needStatus: carStatus, neededFrom: occurrence.startAt, neededUntil: occurrence.endAt, createdAt: timestamp, updatedAt: timestamp }]);
    setSaving(false); onChanged();
  };
  return <section className="data-form occurrence-editor" aria-label="Manage routine occurrence"><div><p className="eyebrow">This occurrence only</p><h2>Adjust {series.title}</h2><p className="section-empty-copy">The routine defaults and future occurrences stay as they are.</p></div>
    <div className="form-grid"><label className="form-field"><span>Move to date</span><input onChange={(event) => setDate(event.target.value)} type="date" value={date} /></label><label className="form-field"><span>Start time</span><input onChange={(event) => setTime(event.target.value)} type="time" value={time} /></label></div>
    <button className="button button--secondary" disabled={saving} onClick={async () => { setSaving(true); await moveOccurrence(series.id, occurrence.occurrenceDate!, date, time); setSaving(false); onChanged(); }} type="button">Move this occurrence</button>
    <MemberSelector label="Responsible adults for this occurrence" members={members.filter((item) => item.active && item.memberType === "adult")} onChange={setAdults} selectedIds={adults} />
    <fieldset className="form-field form-field--fieldset"><legend>Car for this occurrence</legend><div className="car-status-selector">{RESOURCE_NEED_STATUSES.map((status) => <label className={carStatus === status ? "is-selected" : ""} key={status}><input checked={carStatus === status} onChange={() => setCarStatus(status)} type="radio" /><span>{RESOURCE_NEED_STATUS_LABELS[status]}</span></label>)}</div></fieldset>
    <div className="form-actions form-actions--spread"><button className="button button--danger" disabled={saving} onClick={async () => { if (!confirm("Cancel this occurrence? Future occurrences will remain.")) return; setSaving(true); await cancelOccurrence(series.id, occurrence.occurrenceDate!); onChanged(true); }} type="button">Cancel this occurrence</button><div><button className="button button--secondary" onClick={onClose} type="button">Close</button><button className="button button--primary" disabled={saving} onClick={saveOverrides} type="button">Save occurrence changes</button></div></div>
  </section>;
}
