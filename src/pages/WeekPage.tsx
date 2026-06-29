import { useState } from "react";
import { Link } from "react-router-dom";
import { CelebrationReadinessBadge } from "../components/celebrations/CelebrationReadinessBadge";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { ConflictList } from "../components/conflicts/ConflictCard";
import { EventCard } from "../components/events/EventCard";
import { PageHeader } from "../components/layout/PageHeader";
import { SchoolPrepActionList } from "../components/prep/SchoolPrepActionCard";
import { SchoolDayIndicator } from "../components/school/SchoolStatus";
import { SchoolReadiness } from "../components/school/SchoolReadiness";
import { WeatherSuggestionCard } from "../components/weather/WeatherSuggestionCard";
import { getEvents, getEventsForDateRange, getFamilyMembers, getPlaces, getSchoolCalendar, listCelebrations, listGiftPlans, listSchoolHalfTermConfigs } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { calculateConflicts, conflictsForEvent, conflictsForEvents } from "../services/conflictService";
import { deriveCelebrationReadinessForRange } from "../services/celebrationReadinessService";
import { getSchoolDayStatus } from "../services/schoolCalendarService";
import { getSchoolReadinessForDate } from "../services/schoolReadinessService";
import { schoolPrepSummary, upsertSchoolReadinessPrepActionsForRange } from "../services/schoolReadinessPrepActionService";
import { getWeatherSchoolContexts } from "../services/weatherService";
import { addDaysToDateKey, currentDateKey, dateKeyToIsoStart, formatLongDate, formatWeekRange, getWeekStartDateKey } from "../utils/dates";

export function WeekPage() {
  const [weekStart, setWeekStart] = useState(getWeekStartDateKey());
  const [refreshVersion, setRefreshVersion] = useState(0);
  const weekEndExclusive = addDaysToDateKey(weekStart, 7);
  const state = useRepositoryQuery(async () => {
    const [events, allEvents, familyMembers, places, schoolCalendar, halfTermConfigs, celebrations, giftPlans] = await Promise.all([
      getEventsForDateRange(new Date(dateKeyToIsoStart(weekStart)), new Date(dateKeyToIsoStart(weekEndExclusive))),
      getEvents(),
      getFamilyMembers(),
      getPlaces(),
      getSchoolCalendar(),
      listSchoolHalfTermConfigs(),
      listCelebrations(),
      listGiftPlans(),
    ]);
    const readiness = Array.from({ length: 7 }, (_, index) => getSchoolReadinessForDate(schoolCalendar, halfTermConfigs, addDaysToDateKey(weekStart, index)));
    const weather = await getWeatherSchoolContexts(readiness);
    const schoolPrepActions = await upsertSchoolReadinessPrepActionsForRange(readiness, Object.fromEntries(Object.entries(weather).map(([date, context]) => [date, context.suggestions])));
    return { events, allEvents, familyMembers, places, schoolCalendar, readiness, weather, schoolPrepActions, celebrations, giftPlans };
  }, [weekStart, refreshVersion]);

  const data = state.data;
  const days = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(weekStart, index));
  const conflicts = calculateConflicts(data?.allEvents ?? []);
  const visibleConflicts = conflictsForEvents(conflicts, data?.events.map((event) => event.id) ?? []);
  const today = currentDateKey();
  const celebrationReadiness = data
    ? deriveCelebrationReadinessForRange({
      occasions: data.celebrations,
      giftPlans: data.giftPlans,
      events: data.allEvents,
      now: new Date(),
      startDate: weekStart,
      endDate: addDaysToDateKey(weekStart, 6),
      includeOutsideRangeWithOverdue: true,
    })
    : [];
  const weekCelebrationReadiness = celebrationReadiness
    .filter((summary) => ["needs_attention", "at_risk", "overdue"].includes(summary.level))
    .slice(0, 3);

  return <div className="page-stack">
    <div className="page-title-row"><PageHeader eyebrow="Monday to Sunday" title="Week">{formatWeekRange(weekStart)}</PageHeader><Link className="compact-action" to="/events/new"><Icon name="plus" /> Add event</Link></div>
    <div className="week-navigation" aria-label="Week navigation"><button onClick={() => setWeekStart(addDaysToDateKey(weekStart, -7))} type="button">Previous</button><button onClick={() => setWeekStart(getWeekStartDateKey())} type="button">This week</button><button onClick={() => setWeekStart(addDaysToDateKey(weekStart, 7))} type="button">Next</button></div>
    {state.loading ? <LoadingState label="Laying out the week..." /> : null}
    {state.error ? <ErrorState /> : null}
    {data ? <>
      <section className="section-block attention-section"><div className="section-heading"><div><p className="eyebrow">Needs attention</p><h2>{visibleConflicts.length ? `${visibleConflicts.length} issue${visibleConflicts.length === 1 ? "" : "s"} this week` : "This week is clear"}</h2></div></div><ConflictList conflicts={visibleConflicts} events={data.allEvents} />{!visibleConflicts.length ? <p className="section-empty-copy">No current conflicts affect this week's events.</p> : null}</section>
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Celebration prep</p><h2>{weekCelebrationReadiness.length ? "Only the celebration risks for this week" : "No celebration prep due this week"}</h2></div><Link className="back-link" to="/celebrations">Open Gifts &amp; Celebrations</Link></div>{weekCelebrationReadiness.length ? <div className="celebration-issue-list">{weekCelebrationReadiness.map((summary) => <article className={`celebration-issue-card celebration-issue-card--${summary.level === "overdue" ? "critical" : "warning"}`} key={summary.occasionId}><div className="celebration-issue-card__top"><div className="event-detail__badges"><CelebrationReadinessBadge level={summary.level} /><Badge tone="accent">{summary.occasionTitle}</Badge></div>{summary.occasionDate ? <small>{formatLongDate(summary.occasionDate)}</small> : null}</div><strong>{summary.issues[0]?.message ?? "Celebration work needs attention."}</strong></article>)}</div> : <p className="section-empty-copy">No celebration prep due this week.</p>}</section>
      <section className="week-list" aria-label={`Week of ${formatWeekRange(weekStart)}`}>{days.map((day) => {
        const dayStart = Date.parse(dateKeyToIsoStart(day));
        const dayEnd = Date.parse(dateKeyToIsoStart(addDaysToDateKey(day, 1)));
        const dayEvents = data.events.filter((event) => Date.parse(event.startAt) < dayEnd && Date.parse(event.endAt) > dayStart);
        const schoolActions = data.schoolPrepActions.filter((item) => item.schoolDate === day && item.status !== "stale");
        const schoolSummary = schoolPrepSummary(schoolActions);
        const dayCelebrations = celebrationReadiness.filter((summary) => {
          if (summary.occasionDate === day) return true;
          if (summary.issues.some((issue) => issue.dueAt?.slice(0, 10) === day)) return true;
          return summary.level === "overdue" && day === today;
        }).slice(0, 2);

        return <section className="week-day" key={day}>
          <header><div><h2>{formatLongDate(day)}</h2><SchoolDayIndicator status={getSchoolDayStatus(data.schoolCalendar, day)} />{schoolActions.length ? <small>{schoolSummary.blocking} blocking · {schoolSummary.weather} weather</small> : null}</div><span>{dayEvents.length || "-"}</span></header>
          <SchoolReadiness compact readiness={data.readiness.find((item) => item.date === day)!} />
          {dayCelebrations.length ? <div className="week-celebration-list">{dayCelebrations.map((summary) => <article className="week-celebration-card" key={`${day}-${summary.occasionId}`}><div className="event-detail__badges"><CelebrationReadinessBadge level={summary.level} /><Badge tone="accent">{summary.occasionTitle}</Badge></div><p>{summary.issues[0]?.message ?? "Celebration work needs attention."}</p></article>)}</div> : null}
          {data.weather[day]?.settings.showOnWeek ? <WeatherSuggestionCard compact context={data.weather[day]} /> : null}
          <SchoolPrepActionList actions={schoolActions.filter((item) => item.status === "open")} compact onChanged={() => setRefreshVersion((value) => value + 1)} />
          {dayEvents.length ? <div className="event-list">{dayEvents.map((event) => <EventCard conflicts={conflictsForEvent(conflicts, event.id)} event={event} familyMembers={data.familyMembers} key={event.id} place={data.places.find((place) => place.id === event.placeId)} />)}</div> : <p className="week-day__empty">No events</p>}
        </section>;
      })}</section>
    </> : null}
  </div>;
}
