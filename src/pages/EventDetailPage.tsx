import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { PrepTaskCard } from "../components/prep/PrepTaskCard";
import { CarNeedCard } from "../components/resources/CarNeedCard";
import { ConflictList } from "../components/conflicts/ConflictCard";
import { OccurrenceExceptionEditor } from "../components/routines/OccurrenceExceptionEditor";
import { CATEGORY_LABELS, FAMILY_CAR_RESOURCE_ID, STATUS_LABELS } from "../domain/constants";
import type { EventOccurrence } from "../domain/types";
import { deleteEvent, getEventById, getEvents, getFamilyMembers, getPlaces, getResources, getSeriesById, setPrepTaskStatus } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { formatEventTime, formatLongDate, isoToDateKey } from "../utils/dates";
import { calculateConflicts, conflictsForEvent } from "../services/conflictService";

export function EventDetailPage() {
  const { eventId = "" } = useParams(); const location = useLocation(); const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false); const [refresh, setRefresh] = useState(0); const [managing, setManaging] = useState(false);
  const state = useRepositoryQuery(async () => {
    const event = await getEventById(eventId);
    const [allEvents, familyMembers, places, resources, series] = await Promise.all([getEvents(), getFamilyMembers(), getPlaces(), getResources(), event?.seriesId ? getSeriesById(event.seriesId) : Promise.resolve(undefined)]);
    return { event, allEvents, familyMembers, places, resources, series };
  }, [eventId, refresh]);
  if (state.loading && !state.data) return <LoadingState label="Opening the event…" />;
  if (state.error) return <ErrorState />;
  if (!state.data?.event) return <div className="empty-state"><h1>Event not found</h1><p>It may have been cancelled, deleted, or moved.</p><Link className="button-link" to="/today">Back to Today</Link></div>;
  const { event, allEvents, familyMembers, places, resources, series } = state.data;
  const generated = Boolean(event.seriesId && event.occurrenceDate && series);
  const conflicts = conflictsForEvent(calculateConflicts(allEvents), event.id);
  const names = (ids: string[]) => ids.map((id) => familyMembers.find((member) => member.id === id)?.displayName ?? "Unknown");
  const place = places.find((item) => item.id === event.placeId); const carNeed = event.resourceNeeds.find((need) => need.resourceId === FAMILY_CAR_RESOURCE_ID && need.needStatus !== "not_required"); const familyCar = resources.find((resource) => resource.id === FAMILY_CAR_RESOURCE_ID);
  const remove = async () => { if (!confirm(`Delete “${event.title}”? This cannot be undone.`)) return; setDeleting(true); await deleteEvent(event.id); navigate("/today", { replace: true }); };
  return <div className="page-stack">
    {location.state?.saved ? <div className="notice notice--success" role="status"><Icon name="check" /> Event saved.</div> : null}<Link className="back-link back-link--icon" to="/today"><Icon name="arrowLeft" /> Today</Link>
    <article className="event-detail"><div className="event-detail__badges"><Badge tone="accent">{CATEGORY_LABELS[event.category]}</Badge><Badge tone={event.status === "confirmed" ? "success" : "neutral"}>{STATUS_LABELS[event.status]}</Badge>{generated ? <Badge tone="neutral">Routine occurrence</Badge> : null}</div><h1>{event.title}</h1><p className="event-detail__date">{formatLongDate(isoToDateKey(event.startAt))}</p><p className="event-detail__time"><Icon name="clock" /> {formatEventTime(event)}</p><dl className="detail-list"><div><dt>Participants</dt><dd>{names(event.participants).join(", ") || "None"}</dd></div><div><dt>Responsible</dt><dd>{names(event.responsibleAdults).join(", ") || "Not assigned"}</dd></div><div><dt>Place</dt><dd>{event.placeId ? place?.name ?? "Place unavailable" : "No place selected"}</dd></div>{generated ? <div><dt>Routine</dt><dd>{series?.title} · occurrence changes apply only to this date</dd></div> : null}{event.notes ? <div><dt>Notes</dt><dd className="detail-list__notes">{event.notes}</dd></div> : null}</dl></article>
    <section className="section-block attention-section"><div className="section-heading"><div><p className="eyebrow">Needs attention</p><h2>{conflicts.length ? `${conflicts.length} current issue${conflicts.length === 1 ? "" : "s"}` : "No conflicts"}</h2></div></div><ConflictList conflicts={conflicts} events={allEvents} />{!conflicts.length ? <p className="section-empty-copy">This event has no current conflicts.</p> : null}</section>
    <section className="event-prep-section"><div className="section-heading"><div><p className="eyebrow">Operational memory</p><h2>Preparation</h2></div>{!generated ? <Link className="button button--secondary" to={`/events/${event.id}/edit`}><Icon name="edit" /> Edit tasks</Link> : null}</div>{event.prepTasks.length ? <div className="prep-task-list">{event.prepTasks.map((task) => <PrepTaskCard familyMembers={familyMembers} item={{ task, event }} key={task.id} onStatusChange={async (status) => { await setPrepTaskStatus(event.id, task.id, status); setRefresh((value) => value + 1); }} />)}</div> : <p className="section-empty-copy">No preparation tasks attached to this event.</p>}</section>
    <section className="event-prep-section"><div className="section-heading"><div><p className="eyebrow">Shared resource</p><h2>Family car</h2></div>{!generated ? <Link className="button button--secondary" to={`/events/${event.id}/edit`}><Icon name="edit" /> Edit car need</Link> : null}</div>{carNeed && familyCar ? <CarNeedCard familyMembers={familyMembers} item={{ need: carNeed, event, resource: familyCar }} /> : <p className="section-empty-copy">The family car is not needed for this event.</p>}</section>
    {managing && generated && series ? <OccurrenceExceptionEditor members={familyMembers} occurrence={event as EventOccurrence} onChanged={(cancelled) => cancelled ? navigate("/week", { replace: true }) : (setManaging(false), setRefresh((value) => value + 1))} onClose={() => setManaging(false)} series={series} /> : null}
    <div className="detail-actions">{generated ? <><button className="button button--primary" onClick={() => setManaging(true)} type="button"><Icon name="edit" /> Manage this occurrence</button><Link className="button button--secondary" to="/routines">Edit routine defaults</Link></> : <><Link className="button button--primary" to={`/events/${event.id}/edit`}><Icon name="edit" /> Edit event</Link><button className="button button--danger" disabled={deleting} onClick={remove} type="button"><Icon name="trash" /> {deleting ? "Deleting…" : "Delete"}</button></>}</div>
  </div>;
}
