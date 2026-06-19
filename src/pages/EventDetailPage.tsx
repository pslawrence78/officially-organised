import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { CATEGORY_LABELS, STATUS_LABELS } from "../domain/constants";
import { deleteEvent, getEventById, getFamilyMembers, getPlaces } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { formatEventTime, formatLongDate, isoToDateKey } from "../utils/dates";

export function EventDetailPage() {
  const { eventId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const state = useRepositoryQuery(async () => {
    const [event, familyMembers, places] = await Promise.all([
      getEventById(eventId),
      getFamilyMembers(),
      getPlaces(),
    ]);
    return { event, familyMembers, places };
  }, [eventId]);

  if (state.loading) return <LoadingState label="Opening the event…" />;
  if (state.error) return <ErrorState />;
  if (!state.data?.event) {
    return <div className="empty-state"><h1>Event not found</h1><p>It may have been deleted, or this address may be out of date.</p><Link className="button-link" to="/today">Back to Today</Link></div>;
  }

  const { event, familyMembers, places } = state.data;
  const namesFor = (ids: string[]) => ids.map((id) => familyMembers.find((member) => member.id === id)?.displayName ?? "Unknown");
  const place = event.placeId ? places.find((item) => item.id === event.placeId) : undefined;

  const confirmDelete = async () => {
    if (!window.confirm(`Delete “${event.title}”? This cannot be undone.`)) return;
    setDeleting(true);
    await deleteEvent(event.id);
    navigate("/today", { replace: true });
  };

  return (
    <div className="page-stack">
      {location.state?.saved ? <div className="notice notice--success" role="status"><Icon name="check" /> Event saved.</div> : null}
      <Link className="back-link back-link--icon" to="/today"><Icon name="arrowLeft" /> Today</Link>
      <article className="event-detail">
        <div className="event-detail__badges"><Badge tone="accent">{CATEGORY_LABELS[event.category]}</Badge><Badge tone={event.status === "confirmed" ? "success" : "neutral"}>{STATUS_LABELS[event.status]}</Badge></div>
        <h1>{event.title}</h1>
        <p className="event-detail__date">{formatLongDate(isoToDateKey(event.startAt))}</p>
        <p className="event-detail__time"><Icon name="clock" /> {formatEventTime(event)}</p>
        <dl className="detail-list">
          <div><dt>Participants</dt><dd>{namesFor(event.participants).join(", ")}</dd></div>
          <div><dt>Responsible</dt><dd>{event.responsibleAdults.length ? namesFor(event.responsibleAdults).join(", ") : "Not assigned"}</dd></div>
          <div><dt>Place</dt><dd>{event.placeId ? place?.name ?? "Place unavailable" : "No place selected"}</dd></div>
          {event.notes ? <div><dt>Notes</dt><dd className="detail-list__notes">{event.notes}</dd></div> : null}
        </dl>
      </article>
      <div className="detail-actions">
        <Link className="button button--primary" to={`/events/${event.id}/edit`}><Icon name="edit" /> Edit event</Link>
        <button className="button button--danger" disabled={deleting} onClick={confirmDelete} type="button"><Icon name="trash" /> {deleting ? "Deleting…" : "Delete"}</button>
      </div>
    </div>
  );
}
