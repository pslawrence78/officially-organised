import { useState } from "react";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { PageHeader } from "../components/layout/PageHeader";
import { SeriesCard } from "../components/routines/SeriesCard";
import { SeriesForm } from "../components/routines/SeriesForm";
import type { EventSeries, EventSeriesInput } from "../domain/types";
import type { EventSeriesValidationErrors } from "../domain/validation/eventSeriesValidation";
import { validateEventSeries } from "../domain/validation/eventSeriesValidation";
import { expandSeriesForRange } from "../domain/series/seriesService";
import { archiveSeries, createSeries, getFamilyMembers, getPlaces, getResources, getSchoolCalendar, getSeries, updateSeries } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { addDaysToDateKey, currentDateKey } from "../utils/dates";

function blankSeries(): EventSeriesInput { return { title: "", category: "club", status: "active", recurrence: { frequency: "weekly", dayOfWeek: "monday", startDate: currentDateKey(), startTime: "17:00", durationMinutes: 60 }, defaultParticipants: [], defaultResponsibleAdults: [], defaultResourceNeeds: [], defaultPrepTasks: [], exceptions: [] }; }

export function RoutinesPage() {
  const [refresh, setRefresh] = useState(0); const [editing, setEditing] = useState<EventSeries | "new" | null>(null); const [draft, setDraft] = useState<EventSeriesInput>(blankSeries); const [errors, setErrors] = useState<EventSeriesValidationErrors>({}); const [saving, setSaving] = useState(false);
  const state = useRepositoryQuery(async () => { const [series, members, places, resources, schoolCalendar] = await Promise.all([getSeries(), getFamilyMembers(), getPlaces(), getResources(), getSchoolCalendar()]); return { series, members, places, resources, schoolCalendar }; }, [refresh]);
  const begin = (series?: EventSeries) => { setEditing(series ?? "new"); setDraft(series ? { ...series, recurrence: { ...series.recurrence }, defaultParticipants: [...series.defaultParticipants], defaultResponsibleAdults: [...series.defaultResponsibleAdults], defaultResourceNeeds: series.defaultResourceNeeds.map((item) => ({ ...item })), defaultPrepTasks: series.defaultPrepTasks.map((item) => ({ ...item })), exceptions: [...series.exceptions] } : blankSeries()); setErrors({}); };
  const save = async () => { if (!state.data) return; const nextErrors = validateEventSeries(draft, state.data.members, state.data.places, state.data.resources); setErrors(nextErrors); if (Object.keys(nextErrors).length) return; setSaving(true); try { if (editing === "new") await createSeries(draft); else if (editing) await updateSeries(editing.id, draft); setEditing(null); setRefresh((value) => value + 1); } finally { setSaving(false); } };
  const today = currentDateKey();
  const data = state.data;
  return <div className="page-stack routines-page"><div className="page-title-row"><PageHeader eyebrow="The regular rhythm" title="Routines">Recurring family commitments, clubs, lessons, Baby Group blocks and regular reminders.</PageHeader><button className="compact-action" onClick={() => begin()} type="button">Add routine</button></div>
    {state.loading && !data ? <LoadingState label="Gathering the family rhythm…" /> : null}{state.error ? <ErrorState /> : null}
    {editing && data ? <SeriesForm errors={errors} members={data.members} onCancel={() => setEditing(null)} onChange={setDraft} onSubmit={save} places={data.places} resources={data.resources} saving={saving} value={draft} /> : null}
    {!editing && data ? <><section className="routine-section"><div className="section-heading"><div><p className="eyebrow">In the plan</p><h2>Active routines</h2></div></div>{data.series.filter((item) => item.status === "active").length ? <div className="routine-list">{data.series.filter((item) => item.status === "active").map((series) => <SeriesCard key={series.id} members={data.members} next={expandSeriesForRange(series, today, addDaysToDateKey(today, 370), { schoolCalendar: data.schoolCalendar })[0]} onEdit={() => begin(series)} onStatus={async (status) => { status === "archived" ? await archiveSeries(series.id) : await updateSeries(series.id, { status }); setRefresh((value) => value + 1); }} series={series} />)}</div> : <section className="empty-panel"><h2>No active routines yet</h2><p>Add a regular family commitment and it will flow into the rest of OO.</p></section>}</section>
    {data.series.some((item) => item.status === "paused") ? <section className="routine-section"><div className="section-heading"><div><p className="eyebrow">On hold</p><h2>Paused routines</h2></div></div><div className="routine-list">{data.series.filter((item) => item.status === "paused").map((series) => <SeriesCard key={series.id} members={data.members} onEdit={() => begin(series)} onStatus={async (status) => { status === "archived" ? await archiveSeries(series.id) : await updateSeries(series.id, { status }); setRefresh((value) => value + 1); }} series={series} />)}</div></section> : null}</> : null}
  </div>;
}
