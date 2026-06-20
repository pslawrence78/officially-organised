import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { PageHeader } from "../components/layout/PageHeader";
import { getSchoolCalendar, saveSchoolCalendar } from "../data/repositories";
import type { SchoolCalendarPeriod, SchoolClosureDay, SchoolClosureType, SchoolPeriodType } from "../domain/types";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { createId } from "../utils/ids";

export function SchoolCalendarPage() {
  const [version, setVersion] = useState(0);
  const [periodDraft, setPeriodDraft] = useState<SchoolCalendarPeriod | undefined>();
  const [closureDraft, setClosureDraft] = useState<SchoolClosureDay | undefined>();
  const state = useRepositoryQuery(() => getSchoolCalendar(), [version]);
  const calendar = state.data;

  const savePeriod = async (draft: SchoolCalendarPeriod) => {
    if (!calendar) return;
    await saveSchoolCalendar({ ...calendar, periods: calendar.periods.some((item) => item.id === draft.id) ? calendar.periods.map((item) => item.id === draft.id ? draft : item) : [...calendar.periods, draft] });
    setPeriodDraft(undefined); setVersion((value) => value + 1);
  };
  const saveClosure = async (draft: SchoolClosureDay) => {
    if (!calendar) return;
    await saveSchoolCalendar({ ...calendar, closureDays: calendar.closureDays.some((item) => item.id === draft.id) ? calendar.closureDays.map((item) => item.id === draft.id ? draft : item) : [...calendar.closureDays, draft] });
    setClosureDraft(undefined); setVersion((value) => value + 1);
  };

  return <div className="page-stack school-calendar-page">
    <Link className="back-link back-link--icon" to="/settings"><Icon name="arrowLeft" /> Settings</Link>
    <PageHeader eyebrow="Local school context" title="Seb’s school calendar">Illustrative local dates used only to explain whether school is open or closed.</PageHeader>
    {state.loading ? <LoadingState label="Opening the school calendar…" /> : null}{state.error ? <ErrorState /> : null}
    {calendar ? <>
      <section className="settings-card school-calendar-summary"><dl><div><dt>School</dt><dd>{calendar.schoolName}</dd></div><div><dt>Academic year</dt><dd>{calendar.academicYearLabel}</dd></div><div><dt>Child</dt><dd>Seb</dd></div><div><dt>Source</dt><dd>Illustrative local data — not official</dd></div></dl></section>
      <SchoolEntrySection title="Terms and holidays" action="Add period" onAdd={() => { setClosureDraft(undefined); setPeriodDraft({ id: createId("school_period"), label: "", type: "term", startDate: "", endDate: "" }); }}>
        {calendar.periods.map((period) => <article className={`school-entry school-entry--${period.type}`} key={period.id}><div><strong>{period.label}</strong><span>{period.type === "term" ? "Term" : "Holiday"} · {period.startDate} to {period.endDate}</span></div><button onClick={() => setPeriodDraft(period)} type="button"><Icon name="edit" /> Edit</button></article>)}
      </SchoolEntrySection>
      {periodDraft ? <PeriodForm draft={periodDraft} onCancel={() => setPeriodDraft(undefined)} onSave={savePeriod} /> : null}
      <SchoolEntrySection title="INSET and closure days" action="Add closure" onAdd={() => { setPeriodDraft(undefined); setClosureDraft({ id: createId("school_closure"), label: "", type: "inset", date: "" }); }}>
        {calendar.closureDays.map((closure) => <article className="school-entry school-entry--closure" key={closure.id}><div><strong>{closure.label}</strong><span>{closure.type.replace("_", " ")} · {closure.date}</span></div><button onClick={() => setClosureDraft(closure)} type="button"><Icon name="edit" /> Edit</button></article>)}
      </SchoolEntrySection>
      {closureDraft ? <ClosureForm draft={closureDraft} onCancel={() => setClosureDraft(undefined)} onSave={saveClosure} /> : null}
    </> : null}
  </div>;
}

function SchoolEntrySection({ title, action, onAdd, children }: { title: string; action: string; onAdd: () => void; children: React.ReactNode }) {
  return <section className="section-block"><div className="section-heading"><div><p className="eyebrow">School dates</p><h2>{title}</h2></div><button className="button button--secondary" onClick={onAdd} type="button"><Icon name="plus" /> {action}</button></div><div className="school-entry-list">{children}</div></section>;
}

function PeriodForm({ draft, onSave, onCancel }: { draft: SchoolCalendarPeriod; onSave: (draft: SchoolCalendarPeriod) => void; onCancel: () => void }) {
  const [value, setValue] = useState(draft);
  const valid = value.label.trim() && value.startDate && value.endDate && value.startDate <= value.endDate;
  return <form className="data-form school-entry-form" onSubmit={(event) => { event.preventDefault(); if (valid) onSave({ ...value, label: value.label.trim() }); }}><h2>{draft.label ? "Edit period" : "Add period"}</h2><div className="form-grid"><label className="form-field"><span>Label</span><input onChange={(event) => setValue({ ...value, label: event.target.value })} required value={value.label} /></label><label className="form-field"><span>Type</span><select onChange={(event) => setValue({ ...value, type: event.target.value as SchoolPeriodType })} value={value.type}><option value="term">Term</option><option value="holiday">Holiday</option></select></label><label className="form-field"><span>Start date</span><input onChange={(event) => setValue({ ...value, startDate: event.target.value })} required type="date" value={value.startDate} /></label><label className="form-field"><span>End date</span><input onChange={(event) => setValue({ ...value, endDate: event.target.value })} required type="date" value={value.endDate} /></label></div><div className="form-actions"><button className="button button--secondary" onClick={onCancel} type="button">Cancel</button><button className="button button--primary" disabled={!valid} type="submit">Save period</button></div></form>;
}

function ClosureForm({ draft, onSave, onCancel }: { draft: SchoolClosureDay; onSave: (draft: SchoolClosureDay) => void; onCancel: () => void }) {
  const [value, setValue] = useState(draft);
  const valid = value.label.trim() && value.date;
  return <form className="data-form school-entry-form" onSubmit={(event) => { event.preventDefault(); if (valid) onSave({ ...value, label: value.label.trim() }); }}><h2>{draft.label ? "Edit closure" : "Add closure"}</h2><div className="form-grid"><label className="form-field"><span>Label</span><input onChange={(event) => setValue({ ...value, label: event.target.value })} required value={value.label} /></label><label className="form-field"><span>Type</span><select onChange={(event) => setValue({ ...value, type: event.target.value as SchoolClosureType })} value={value.type}><option value="inset">INSET day</option><option value="bank_holiday">Bank holiday</option><option value="other_closed">Other closure</option></select></label><label className="form-field"><span>Date</span><input onChange={(event) => setValue({ ...value, date: event.target.value })} required type="date" value={value.date} /></label></div><div className="form-actions"><button className="button button--secondary" onClick={onCancel} type="button">Cancel</button><button className="button button--primary" disabled={!valid} type="submit">Save closure</button></div></form>;
}
