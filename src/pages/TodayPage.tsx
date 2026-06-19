import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { EventCard } from "../components/events/EventCard";
import { PageHeader } from "../components/layout/PageHeader";
import { getEventsForDate, getFamilyMembers, getPlaces } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { currentDateKey, formatLongDate } from "../utils/dates";

export function TodayPage() {
  const today = currentDateKey();
  const state = useRepositoryQuery(async () => {
    const [events, familyMembers, places] = await Promise.all([
      getEventsForDate(today),
      getFamilyMembers(),
      getPlaces(),
    ]);
    return { events, familyMembers, places };
  }, [today]);
  const data = state.data;

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <PageHeader eyebrow={formatLongDate(today)} title="Today">What is happening today, in chronological order.</PageHeader>
        <Link className="compact-action" to="/events/new"><Icon name="plus" /> Add event</Link>
      </div>
      {state.loading ? <LoadingState label="Checking today’s plans…" /> : null}
      {state.error ? <ErrorState /> : null}
      {data?.events.length === 0 ? (
        <section className="empty-panel"><span className="empty-panel__icon"><Icon name="today" /></span><h2>Nothing planned today</h2><p>A rare blank square. Add an event when something lands.</p><Link className="button button--primary" to="/events/new"><Icon name="plus" /> Add an event</Link></section>
      ) : null}
      {data && data.events.length > 0 ? (
        <section className="event-list" aria-label="Today’s events">
          {data.events.map((event) => <EventCard event={event} familyMembers={data.familyMembers} key={event.id} place={data.places.find((place) => place.id === event.placeId)} />)}
        </section>
      ) : null}
    </div>
  );
}
