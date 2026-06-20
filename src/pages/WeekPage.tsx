import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { ConflictList } from "../components/conflicts/ConflictCard";
import { EventCard } from "../components/events/EventCard";
import { PageHeader } from "../components/layout/PageHeader";
import { SchoolDayIndicator } from "../components/school/SchoolStatus";
import { getEvents, getEventsForDateRange, getFamilyMembers, getPlaces, getSchoolCalendar } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { calculateConflicts, conflictsForEvent, conflictsForEvents } from "../services/conflictService";
import { getSchoolDayStatus } from "../services/schoolCalendarService";
import { addDaysToDateKey, dateKeyToIsoStart, formatLongDate, formatWeekRange, getWeekStartDateKey } from "../utils/dates";

export function WeekPage() {
  const [weekStart, setWeekStart] = useState(getWeekStartDateKey());
  const weekEndExclusive = addDaysToDateKey(weekStart, 7);
  const state = useRepositoryQuery(async () => {
    const [events, allEvents, familyMembers, places, schoolCalendar] = await Promise.all([
      getEventsForDateRange(new Date(dateKeyToIsoStart(weekStart)), new Date(dateKeyToIsoStart(weekEndExclusive))), getEvents(), getFamilyMembers(), getPlaces(), getSchoolCalendar(),
    ]);
    return { events, allEvents, familyMembers, places, schoolCalendar };
  }, [weekStart]);
  const data = state.data;
  const days = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(weekStart, index));
  const conflicts = calculateConflicts(data?.allEvents ?? []);
  const visibleConflicts = conflictsForEvents(conflicts, data?.events.map((event) => event.id) ?? []);

  return <div className="page-stack">
    <div className="page-title-row"><PageHeader eyebrow="Monday to Sunday" title="Week">{formatWeekRange(weekStart)}</PageHeader><Link className="compact-action" to="/events/new"><Icon name="plus" /> Add event</Link></div>
    <div className="week-navigation" aria-label="Week navigation"><button onClick={() => setWeekStart(addDaysToDateKey(weekStart, -7))} type="button">Previous</button><button onClick={() => setWeekStart(getWeekStartDateKey())} type="button">This week</button><button onClick={() => setWeekStart(addDaysToDateKey(weekStart, 7))} type="button">Next</button></div>
    {state.loading ? <LoadingState label="Laying out the week..." /> : null}{state.error ? <ErrorState /> : null}
    {data ? <>
      <section className="section-block attention-section"><div className="section-heading"><div><p className="eyebrow">Needs attention</p><h2>{visibleConflicts.length ? `${visibleConflicts.length} issue${visibleConflicts.length === 1 ? "" : "s"} this week` : "This week is clear"}</h2></div></div><ConflictList conflicts={visibleConflicts} events={data.allEvents} />{!visibleConflicts.length ? <p className="section-empty-copy">No current conflicts affect this week's events.</p> : null}</section>
      <section className="week-list" aria-label={`Week of ${formatWeekRange(weekStart)}`}>{days.map((day) => {
        const dayStart = Date.parse(dateKeyToIsoStart(day)); const dayEnd = Date.parse(dateKeyToIsoStart(addDaysToDateKey(day, 1)));
        const dayEvents = data.events.filter((event) => Date.parse(event.startAt) < dayEnd && Date.parse(event.endAt) > dayStart);
        return <section className="week-day" key={day}><header><div><h2>{formatLongDate(day)}</h2><SchoolDayIndicator status={getSchoolDayStatus(data.schoolCalendar, day)} /></div><span>{dayEvents.length || "-"}</span></header>{dayEvents.length ? <div className="event-list">{dayEvents.map((event) => <EventCard conflicts={conflictsForEvent(conflicts, event.id)} event={event} familyMembers={data.familyMembers} key={event.id} place={data.places.find((place) => place.id === event.placeId)} />)}</div> : <p className="week-day__empty">No events</p>}</section>;
      })}</section>
    </> : null}
  </div>;
}
