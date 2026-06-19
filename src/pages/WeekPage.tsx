import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { EventCard } from "../components/events/EventCard";
import { PageHeader } from "../components/layout/PageHeader";
import { getEventsForDateRange, getFamilyMembers, getPlaces } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { addDaysToDateKey, dateKeyToIsoStart, formatLongDate, formatWeekRange, getWeekStartDateKey } from "../utils/dates";

export function WeekPage() {
  const [weekStart, setWeekStart] = useState(getWeekStartDateKey());
  const weekEndExclusive = addDaysToDateKey(weekStart, 7);
  const state = useRepositoryQuery(async () => {
    const [events, familyMembers, places] = await Promise.all([
      getEventsForDateRange(new Date(dateKeyToIsoStart(weekStart)), new Date(dateKeyToIsoStart(weekEndExclusive))),
      getFamilyMembers(),
      getPlaces(),
    ]);
    return { events, familyMembers, places };
  }, [weekStart]);
  const data = state.data;
  const days = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(weekStart, index));

  return (
    <div className="page-stack">
      <div className="page-title-row"><PageHeader eyebrow="Monday to Sunday" title="Week">{formatWeekRange(weekStart)}</PageHeader><Link className="compact-action" to="/events/new"><Icon name="plus" /> Add event</Link></div>
      <div className="week-navigation" aria-label="Week navigation">
        <button onClick={() => setWeekStart(addDaysToDateKey(weekStart, -7))} type="button">← Previous</button>
        <button onClick={() => setWeekStart(getWeekStartDateKey())} type="button">This week</button>
        <button onClick={() => setWeekStart(addDaysToDateKey(weekStart, 7))} type="button">Next →</button>
      </div>
      {state.loading ? <LoadingState label="Laying out the week…" /> : null}
      {state.error ? <ErrorState /> : null}
      {data ? (
        <section className="week-list" aria-label={`Week of ${formatWeekRange(weekStart)}`}>
          {days.map((day) => {
            const dayStart = Date.parse(dateKeyToIsoStart(day));
            const dayEnd = Date.parse(dateKeyToIsoStart(addDaysToDateKey(day, 1)));
            const dayEvents = data.events.filter((event) => Date.parse(event.startAt) < dayEnd && Date.parse(event.endAt) > dayStart);
            return <section className="week-day" key={day}><header><h2>{formatLongDate(day)}</h2><span>{dayEvents.length || "—"}</span></header>{dayEvents.length ? <div className="event-list">{dayEvents.map((event) => <EventCard event={event} familyMembers={data.familyMembers} key={event.id} place={data.places.find((place) => place.id === event.placeId)} />)}</div> : <p className="week-day__empty">No events</p>}</section>;
          })}
        </section>
      ) : null}
    </div>
  );
}
