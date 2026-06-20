import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { EventForm } from "../components/events/EventForm";
import { PageHeader } from "../components/layout/PageHeader";
import { getEventById, getFamilyMembers, getPlaces, getResources } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";

export function EventFormPage() {
  const { eventId } = useParams();
  const state = useRepositoryQuery(async () => {
    const [event, familyMembers, places, resources] = await Promise.all([
      eventId ? getEventById(eventId) : Promise.resolve(undefined),
      getFamilyMembers(),
      getPlaces(),
      getResources(),
    ]);
    return { event, familyMembers, places, resources };
  }, [eventId]);

  if (state.loading) return <LoadingState label={eventId ? "Opening the event…" : "Preparing a new event…"} />;
  if (state.error) return <ErrorState />;
  if (!state.data) return null;
  if (eventId && !state.data.event) {
    return <div className="empty-state"><h1>Event not found</h1><p>This event may have been removed.</p><Link className="button-link" to="/today">Back to Today</Link></div>;
  }

  return (
    <div className="page-stack page-stack--form">
      <PageHeader eyebrow={eventId ? "Make a change" : "A new family commitment"} title={eventId ? "Edit event" : "Add event"}>
        Keep the essentials clear now; car needs and preparation arrive in later tranches.
      </PageHeader>
      <EventForm event={state.data.event} familyMembers={state.data.familyMembers} places={state.data.places} resources={state.data.resources} />
    </div>
  );
}
