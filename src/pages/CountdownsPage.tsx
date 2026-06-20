import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { PageHeader } from "../components/layout/PageHeader";
import { getCountdownTargets, getSchoolCalendar, saveCountdownTarget } from "../data/repositories";
import type { CountdownTarget, CountdownVisibility } from "../domain/types";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { countdownTargetFromSuggestion, schoolCountdownSuggestions } from "../services/countdownService";
import { createId } from "../utils/ids";

export function CountdownsPage() {
  const [version, setVersion] = useState(0);
  const [draft, setDraft] = useState<CountdownTarget | undefined>();
  const state = useRepositoryQuery(async () => {
    const [targets, schoolCalendar] = await Promise.all([getCountdownTargets(), getSchoolCalendar()]);
    return { targets, schoolCalendar };
  }, [version]);
  const data = state.data;
  const usedSourceIds = new Set(data?.targets.map((target) => target.sourceId).filter(Boolean));
  const suggestions = schoolCountdownSuggestions(data?.schoolCalendar).filter((suggestion) => !usedSourceIds.has(suggestion.sourceId)).slice(0, 4);

  const save = async (target: CountdownTarget) => {
    if (target.visibility === "dashboard_primary" && data) {
      await Promise.all(data.targets.filter((item) => item.id !== target.id && item.visibility === "dashboard_primary").map((item) => saveCountdownTarget({ ...item, visibility: "dashboard_secondary" })));
    }
    await saveCountdownTarget(target); setDraft(undefined); setVersion((value) => value + 1);
  };

  return <div className="page-stack countdowns-page">
    <Link className="back-link back-link--icon" to="/settings"><Icon name="arrowLeft" /> Settings</Link>
    <div className="page-title-row"><PageHeader eyebrow="Something lovely ahead" title="Family countdowns">Selected dates for days, sleeps and small bits of anticipation.</PageHeader><button className="compact-action" onClick={() => setDraft(newManualCountdown())} type="button"><Icon name="plus" /> Add countdown</button></div>
    {state.loading ? <LoadingState label="Gathering countdowns…" /> : null}{state.error ? <ErrorState /> : null}
    {data ? <>
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Configured</p><h2>{data.targets.length ? `${data.targets.filter((target) => target.active).length} active countdown${data.targets.filter((target) => target.active).length === 1 ? "" : "s"}` : "No countdowns yet"}</h2></div></div><div className="countdown-management-list">{data.targets.map((target) => <article className={`countdown-management-item${target.active ? "" : " is-inactive"}`} key={target.id}><div><div><Badge tone={target.visibility === "dashboard_primary" ? "accent" : target.visibility === "hidden" ? "neutral" : "success"}>{target.visibility === "dashboard_primary" ? "Primary" : target.visibility === "dashboard_secondary" ? "Secondary" : "Hidden"}</Badge>{!target.active ? <Badge tone="neutral">Inactive</Badge> : null}</div><strong>{target.title}</strong><span>{target.targetDate} · {target.showSleeps ? "Sleeps shown" : "Days shown"}</span></div><button onClick={() => setDraft(target)} type="button"><Icon name="edit" /> Edit</button></article>)}</div></section>
      {draft ? <CountdownForm draft={draft} onCancel={() => setDraft(undefined)} onSave={save} /> : null}
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">From Seb’s school calendar</p><h2>Optional suggestions</h2></div></div>{suggestions.length ? <div className="countdown-suggestion-list">{suggestions.map((suggestion) => <article className="countdown-suggestion" key={suggestion.id}><div><strong>{suggestion.title}</strong><span>{suggestion.targetDate}</span></div><button onClick={async () => { await saveCountdownTarget(countdownTargetFromSuggestion(suggestion)); setVersion((value) => value + 1); }} type="button"><Icon name="plus" /> Add</button></article>)}</div> : <p className="section-empty-copy">No unused future school-date suggestions are available.</p>}</section>
    </> : null}
  </div>;
}

function newManualCountdown(): CountdownTarget {
  const timestamp = new Date().toISOString();
  return { id: createId("countdown"), title: "", targetDate: "", sourceType: "manual", visibility: "dashboard_secondary", showSleeps: true, active: true, createdAt: timestamp, updatedAt: timestamp };
}

function CountdownForm({ draft, onSave, onCancel }: { draft: CountdownTarget; onSave: (target: CountdownTarget) => void; onCancel: () => void }) {
  const [value, setValue] = useState(draft);
  const valid = Boolean(value.title.trim() && value.targetDate);
  return <form className="data-form countdown-form" onSubmit={(event) => { event.preventDefault(); if (valid) onSave(value); }}><h2>{draft.title ? "Edit countdown" : "Add countdown"}</h2><div className="form-grid"><label className="form-field"><span>Title</span><input onChange={(event) => setValue({ ...value, title: event.target.value })} required value={value.title} /></label><label className="form-field"><span>Target date</span><input onChange={(event) => setValue({ ...value, targetDate: event.target.value })} required type="date" value={value.targetDate} /></label><label className="form-field"><span>Dashboard visibility</span><select onChange={(event) => setValue({ ...value, visibility: event.target.value as CountdownVisibility })} value={value.visibility}><option value="dashboard_primary">Primary</option><option value="dashboard_secondary">Secondary</option><option value="hidden">Hidden</option></select></label><label className="form-field"><span>Notes</span><input onChange={(event) => setValue({ ...value, notes: event.target.value })} value={value.notes ?? ""} /></label></div><div className="countdown-toggles"><label className="toggle-field"><input aria-label="Show sleeps" checked={value.showSleeps} onChange={(event) => setValue({ ...value, showSleeps: event.target.checked })} type="checkbox" /><span><strong>Show sleeps</strong><small>Otherwise show days</small></span></label><label className="toggle-field"><input aria-label="Active" checked={value.active} onChange={(event) => setValue({ ...value, active: event.target.checked })} type="checkbox" /><span><strong>Active</strong><small>Turn off to keep it without showing it</small></span></label></div><div className="form-actions"><button className="button button--secondary" onClick={onCancel} type="button">Cancel</button><button className="button button--primary" disabled={!valid} type="submit">Save countdown</button></div></form>;
}
