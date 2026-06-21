import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { ConflictList } from "../components/conflicts/ConflictCard";
import { EventCard } from "../components/events/EventCard";
import { PageHeader } from "../components/layout/PageHeader";
import { SchoolStatus } from "../components/school/SchoolStatus";
import { SchoolReadiness } from "../components/school/SchoolReadiness";
import { getEvents, getEventsForDate, getFamilyMembers, getPlaces, getSchoolCalendar, listSchoolHalfTermConfigs } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { calculateConflicts, conflictsForEvent, conflictsForEvents } from "../services/conflictService";
import { getSchoolDayStatus } from "../services/schoolCalendarService";
import { getSchoolReadinessForDate } from "../services/schoolReadinessService";
import { currentDateKey, formatLongDate } from "../utils/dates";

export function TodayPage() {
  const today = currentDateKey();
  const state = useRepositoryQuery(async () => {
    const [events, allEvents, familyMembers, places, schoolCalendar, halfTermConfigs] = await Promise.all([
      getEventsForDate(today), getEvents(), getFamilyMembers(), getPlaces(), getSchoolCalendar(), listSchoolHalfTermConfigs(),
    ]);
    return { events, allEvents, familyMembers, places, schoolCalendar, halfTermConfigs };
  }, [today]);
  const data = state.data;
  const conflicts = calculateConflicts(data?.allEvents ?? []);
  const visibleConflicts = conflictsForEvents(conflicts, data?.events.map((event) => event.id) ?? []);

  return (
    <div className="page-stack">
      <div className="page-title-row"><PageHeader eyebrow={formatLongDate(today)} title="Today">What is happening today, in chronological order.</PageHeader><Link className="compact-action" to="/events/new"><Icon name="plus" /> Add event</Link></div>
      {state.loading ? <LoadingState label="Checking today's plans..." /> : null}
      {state.error ? <ErrorState /> : null}
      {data ? <SchoolStatus context="today" linked status={getSchoolDayStatus(data.schoolCalendar, today)} /> : null}
      {data ? <SchoolReadiness readiness={getSchoolReadinessForDate(data.schoolCalendar, data.halfTermConfigs, today)} /> : null}
      {data?.events.length === 0 ? <section className="empty-panel"><span className="empty-panel__icon"><Icon name="today" /></span><h2>Nothing planned today</h2><p>A rare blank square. Add an event when something lands.</p><Link className="button button--primary" to="/events/new"><Icon name="plus" /> Add an event</Link></section> : null}
      {data && data.events.length > 0 ? <>
        <section className="section-block attention-section"><div className="section-heading"><div><p className="eyebrow">Needs attention</p><h2>{visibleConflicts.length ? `${visibleConflicts.length} issue${visibleConflicts.length === 1 ? "" : "s"} today` : "Today is clear"}</h2></div></div><ConflictList conflicts={visibleConflicts} events={data.allEvents} />{!visibleConflicts.length ? <p className="section-empty-copy">No current conflicts affect today's events.</p> : null}</section>
        <section className="event-list" aria-label="Today's events">{data.events.map((event) => <EventCard conflicts={conflictsForEvent(conflicts, event.id)} event={event} familyMembers={data.familyMembers} key={event.id} place={data.places.find((place) => place.id === event.placeId)} />)}</section>
      </> : null}
    </div>
  );
}
