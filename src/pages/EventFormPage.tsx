import { Link, useLocation, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { EventForm } from "../components/events/EventForm";
import { PageHeader } from "../components/layout/PageHeader";
import { getEventById, getFamilyMembers, getPlaces, getResources } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import type { EventFormPrefill } from "../services/quickCaptureService";

export function EventFormPage() {
  const { eventId } = useParams();
  const location = useLocation();
  const quickCapturePrefill = (location.state as { quickCapturePrefill?: EventFormPrefill } | null)?.quickCapturePrefill;
  const state = useRepositoryQuery(async () => {
    const [event, familyMembers, places, resources] = await Promise.all([
      eventId ? getEventById(eventId) : Promise.resolve(undefined),
      getFamilyMembers(),
      getPlaces(),
      getResources(),
    ]);
    return { event, familyMembers, places, resources };
  }, [eventId]);

  if (state.loading) return <LoadingState label={eventId ? "Opening the event..." : "Preparing a new event..."} />;
  if (state.error) return <ErrorState />;
  if (!state.data) return null;
  if (eventId && !state.data.event) {
    return <div className="empty-state"><h1>Event not found</h1><p>This event may have been removed.</p><Link className="button-link" to="/today">Back to Today</Link></div>;
  }

  return (
    <div className="page-stack page-stack--form">
      <PageHeader eyebrow={eventId ? "Make a change" : "A new family commitment"} title={eventId ? "Edit event" : "Add event"}>
        Start with the essentials. People, car needs, prep and notes are still here when you need them.
      </PageHeader>
      {state.data.event ? <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Optional operational add-on</p><h2>Gifts & Celebrations</h2></div><Link className="button button--secondary" to={`/celebrations?eventId=${encodeURIComponent(state.data.event.id)}`}><Icon name="gift" /> Manage linked plan</Link></div><p className="supporting-copy">Use this only when the event needs a present, card, RSVP or "remember to take it" prep trail.</p></section> : null}
      <EventForm event={state.data.event} familyMembers={state.data.familyMembers} places={state.data.places} prefill={quickCapturePrefill} resources={state.data.resources} />
    </div>
  );
}
