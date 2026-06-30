import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { ConflictList } from "../components/conflicts/ConflictCard";
import { PrepTaskCard } from "../components/prep/PrepTaskCard";
import { CarNeedCard } from "../components/resources/CarNeedCard";
import { OccurrenceExceptionEditor } from "../components/routines/OccurrenceExceptionEditor";
import {
  CARD_STATUS_LABELS,
  CATEGORY_LABELS,
  FAMILY_CAR_RESOURCE_ID,
  GIFT_STATUS_LABELS,
  RSVP_STATUS_LABELS,
  STATUS_LABELS,
} from "../domain/constants";
import type { EventOccurrence } from "../domain/types";
import {
  deleteEvent,
  getCelebrationById,
  getEventById,
  getEvents,
  getFamilyMembers,
  getPlaces,
  getResources,
  getSeriesById,
  listGiftPlansForEvent,
  setPrepTaskStatus,
} from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { calculateConflicts, conflictsForEvent } from "../services/conflictService";
import { formatEventTime, formatLongDate, isoToDateKey } from "../utils/dates";

export function EventDetailPage() {
  const { eventId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [managing, setManaging] = useState(false);

  const state = useRepositoryQuery(async () => {
    const event = await getEventById(eventId);
    const [allEvents, familyMembers, places, resources, series, giftPlans] = await Promise.all([
      getEvents(),
      getFamilyMembers(),
      getPlaces(),
      getResources(),
      event?.seriesId ? getSeriesById(event.seriesId) : Promise.resolve(undefined),
      listGiftPlansForEvent(eventId),
    ]);
    const celebrations = await Promise.all(giftPlans.map((plan) => getCelebrationById(plan.celebrationId)));
    return { event, allEvents, familyMembers, places, resources, series, giftPlans, celebrations };
  }, [eventId, refresh]);

  if (state.loading && !state.data) return <LoadingState label="Opening the event..." />;
  if (state.error) return <ErrorState />;
  if (!state.data?.event) {
    return (
      <div className="empty-state">
        <h1>Event not found</h1>
        <p>It may have been cancelled, deleted, or moved.</p>
        <Link className="button-link" to="/today">Back to Today</Link>
      </div>
    );
  }

  const { event, allEvents, familyMembers, places, resources, series, giftPlans, celebrations } = state.data;
  const generated = Boolean(event.seriesId && event.occurrenceDate && series);
  const conflicts = conflictsForEvent(calculateConflicts(allEvents), event.id);
  const celebrationById = new Map(celebrations.filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => [item.id, item]));
  const names = (ids: string[]) => ids.map((id) => familyMembers.find((member) => member.id === id)?.displayName ?? "Unknown family member");
  const place = places.find((item) => item.id === event.placeId);
  const carNeed = event.resourceNeeds.find((need) => need.resourceId === FAMILY_CAR_RESOURCE_ID && need.needStatus !== "not_required");
  const familyCar = resources.find((resource) => resource.id === FAMILY_CAR_RESOURCE_ID);

  const remove = async () => {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await deleteEvent(event.id);
    navigate("/today", { replace: true });
  };

  return (
    <div className="page-stack">
      {location.state?.saved ? (
        <div className="notice notice--success" role="status">
          <Icon name="check" /> Event saved.
        </div>
      ) : null}
      <Link className="back-link back-link--icon" to="/today">
        <Icon name="arrowLeft" /> Today
      </Link>

      <article className="event-detail">
        <div className="event-detail__badges">
          <Badge tone="accent">{CATEGORY_LABELS[event.category]}</Badge>
          <Badge tone={event.status === "confirmed" ? "success" : "neutral"}>{STATUS_LABELS[event.status]}</Badge>
          {generated ? <Badge tone="neutral">Routine occurrence</Badge> : null}
        </div>
        <h1>{event.title}</h1>
        <p className="event-detail__date">{formatLongDate(isoToDateKey(event.startAt))}</p>
        <p className="event-detail__time"><Icon name="clock" /> {formatEventTime(event)}</p>
        <dl className="detail-list">
          <div><dt>Participants</dt><dd>{names(event.participants).join(", ") || "None"}</dd></div>
          <div><dt>Responsible</dt><dd>{names(event.responsibleAdults).join(", ") || "Not assigned"}</dd></div>
          <div><dt>Place</dt><dd>{event.placeId ? place?.name ?? "This event still works, but its saved place is no longer available." : "No place selected"}</dd></div>
          {generated ? <div><dt>Routine</dt><dd>{series?.title} · occurrence changes apply only to this date</dd></div> : null}
          {event.notes ? <div><dt>Notes</dt><dd className="detail-list__notes">{event.notes}</dd></div> : null}
        </dl>
      </article>

      <section className="section-block attention-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Needs attention</p>
            <h2>{conflicts.length ? `${conflicts.length} current issue${conflicts.length === 1 ? "" : "s"}` : "No conflicts"}</h2>
          </div>
        </div>
        <ConflictList conflicts={conflicts} events={allEvents} />
        {!conflicts.length ? <p className="section-empty-copy">This event has no current conflicts.</p> : null}
      </section>

      <section className="event-prep-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Operational memory</p>
            <h2>Preparation</h2>
          </div>
          {!generated ? <Link className="button button--secondary" to={`/events/${event.id}/edit`}><Icon name="edit" /> Edit tasks</Link> : null}
        </div>
        {event.prepTasks.length ? (
          <div className="prep-task-list">
            {event.prepTasks.map((task) => (
              <PrepTaskCard
                familyMembers={familyMembers}
                item={{ task, event }}
                key={task.id}
                onStatusChange={async (status) => {
                  await setPrepTaskStatus(event.id, task.id, status);
                  setRefresh((value) => value + 1);
                }}
              />
            ))}
          </div>
        ) : <p className="section-empty-copy">No preparation tasks attached to this event.</p>}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Secondary operational module</p>
            <h2>Gifts & Celebrations</h2>
          </div>
          <Link className="button button--secondary" to={`/celebrations?eventId=${encodeURIComponent(event.id)}`}>
            <Icon name="gift" /> {giftPlans.length ? "Manage linked plan" : "Create linked plan"}
          </Link>
        </div>
        {giftPlans.length ? giftPlans.map((plan) => {
          const celebration = celebrationById.get(plan.celebrationId);
          return (
            <article className="section-block" key={plan.id}>
              <div className="event-detail__badges">
                <Badge tone="accent">Gift plan</Badge>
                <Badge tone="neutral">Gift {GIFT_STATUS_LABELS[plan.giftStatus]}</Badge>
                <Badge tone="neutral">Card {CARD_STATUS_LABELS[plan.cardStatus]}</Badge>
                <Badge tone="neutral">RSVP {RSVP_STATUS_LABELS[plan.rsvpStatus]}</Badge>
              </div>
              <h3>{celebration?.title ?? `Gift plan for ${plan.recipientName}`}</h3>
              <p className="supporting-copy">
                {celebration ? `For ${plan.recipientName}` : "The linked celebration record is unavailable, but the plan is still safe to open."}
              </p>
            </article>
          );
        }) : <p className="section-empty-copy">No linked gift or celebration plan is attached to this event. Add one only if cards, presents, RSVPs or take-it prep are actually needed.</p>}
      </section>

      <section className="event-prep-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Shared resource</p>
            <h2>Family car</h2>
          </div>
          {!generated ? <Link className="button button--secondary" to={`/events/${event.id}/edit`}><Icon name="edit" /> Edit car need</Link> : null}
        </div>
        {carNeed && familyCar ? <CarNeedCard familyMembers={familyMembers} item={{ need: carNeed, event, resource: familyCar }} /> : carNeed ? <p className="section-empty-copy">This event still has a saved car requirement, but the family car record is no longer available.</p> : <p className="section-empty-copy">The family car is not needed for this event.</p>}
      </section>

      {managing && generated && series ? (
        <OccurrenceExceptionEditor
          members={familyMembers}
          occurrence={event as EventOccurrence}
          onChanged={(cancelled) => cancelled ? navigate("/week", { replace: true }) : (setManaging(false), setRefresh((value) => value + 1))}
          onClose={() => setManaging(false)}
          series={series}
        />
      ) : null}

      <div className="detail-actions">
        {generated ? (
          <>
            <button className="button button--primary" onClick={() => setManaging(true)} type="button"><Icon name="edit" /> Manage this occurrence</button>
            <Link className="button button--secondary" to="/routines">Edit routine defaults</Link>
          </>
        ) : (
          <>
            <Link className="button button--primary" to={`/events/${event.id}/edit`}><Icon name="edit" /> Edit event</Link>
            <button className="button button--danger" disabled={deleting} onClick={remove} type="button"><Icon name="trash" /> {deleting ? "Deleting..." : "Delete"}</button>
          </>
        )}
      </div>
    </div>
  );
}
