import { useState } from "react";
import { Link } from "react-router-dom";
import { CelebrationReadinessBadge } from "../components/celebrations/CelebrationReadinessBadge";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { ConflictList } from "../components/conflicts/ConflictCard";
import { EventCard } from "../components/events/EventCard";
import { PageHeader } from "../components/layout/PageHeader";
import { SchoolStatus } from "../components/school/SchoolStatus";
import { SchoolReadiness } from "../components/school/SchoolReadiness";
import { WeatherSuggestionCard } from "../components/weather/WeatherSuggestionCard";
import { SchoolPrepActionList } from "../components/prep/SchoolPrepActionCard";
import { getEvents, getEventsForDate, getFamilyMembers, getPlaces, getSchoolCalendar, listCelebrations, listGiftPlans, listHouseholdAdminItems, listSchoolHalfTermConfigs } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { calculateConflicts, conflictsForEvent, conflictsForEvents } from "../services/conflictService";
import { deriveCelebrationReadinessForRange } from "../services/celebrationReadinessService";
import { getSchoolDayStatus } from "../services/schoolCalendarService";
import { getSchoolReadinessForDate } from "../services/schoolReadinessService";
import { addDaysToDateKey, currentDateKey, formatLongDate } from "../utils/dates";
import { getWeatherSchoolContext } from "../services/weatherService";
import { upsertSchoolReadinessPrepActionsForRange } from "../services/schoolReadinessPrepActionService";
import { deriveHouseholdAdminSignal, sortHouseholdAdminSignals } from "../services/householdAdminService";

export function TodayPage() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const today = currentDateKey();
  const state = useRepositoryQuery(async () => {
    const [events, allEvents, familyMembers, places, schoolCalendar, halfTermConfigs, celebrations, giftPlans, householdAdminItems] = await Promise.all([
      getEventsForDate(today), getEvents(), getFamilyMembers(), getPlaces(), getSchoolCalendar(), listSchoolHalfTermConfigs(), listCelebrations(), listGiftPlans(), listHouseholdAdminItems(),
    ]);
    const readiness = getSchoolReadinessForDate(schoolCalendar, halfTermConfigs, today);
    const weather = await getWeatherSchoolContext(today, readiness);
    const schoolPrepActions = await upsertSchoolReadinessPrepActionsForRange([readiness], { [today]: weather.suggestions });
    return { events, allEvents, familyMembers, places, schoolCalendar, halfTermConfigs, readiness, weather, schoolPrepActions, celebrations, giftPlans, householdAdminItems };
  }, [today, refreshVersion]);
  const data = state.data;
  const conflicts = calculateConflicts(data?.allEvents ?? []);
  const visibleConflicts = conflictsForEvents(conflicts, data?.events.map((event) => event.id) ?? []);
  const celebrationReadiness = data
    ? deriveCelebrationReadinessForRange({
      occasions: data.celebrations,
      giftPlans: data.giftPlans,
      events: data.allEvents,
      now: new Date(),
      startDate: today,
      endDate: addDaysToDateKey(today, 1),
      includeOutsideRangeWithOverdue: true,
    }).filter((summary) => ["needs_attention", "at_risk", "overdue"].includes(summary.level))
    : [];
  const householdAdminAttention = data
    ? sortHouseholdAdminSignals(data.householdAdminItems.map((item) => deriveHouseholdAdminSignal(item, today)))
      .filter((item) => item.dueState === "overdue" || item.dueState === "due_today")
    : [];

  return (
    <div className="page-stack">
      <div className="page-title-row"><PageHeader eyebrow={formatLongDate(today)} title="Today">What is happening today, in chronological order.</PageHeader><Link className="compact-action" to="/events/new"><Icon name="plus" /> Add event</Link></div>
      {state.loading ? <LoadingState label="Checking today's plans..." /> : null}
      {state.error ? <ErrorState /> : null}
      {data ? <SchoolStatus context="today" linked status={getSchoolDayStatus(data.schoolCalendar, today)} /> : null}
      {data ? <SchoolReadiness readiness={data.readiness} /> : null}
      {data?.weather.settings.showOnToday && data.readiness.schoolStatus === "open" ? <WeatherSuggestionCard context={data.weather} /> : null}
      {data && data.readiness.schoolStatus === "open" ? <section className="section-block"><div className="section-heading"><div><p className="eyebrow">School prep</p><h2>Actions for Seb</h2></div></div><SchoolPrepActionList actions={data.schoolPrepActions.filter((item) => item.status !== "stale")} onChanged={() => setRefreshVersion((value) => value + 1)} /></section> : null}
      {householdAdminAttention.length ? <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Household admin</p><h2>Due or overdue today</h2></div><Link className="back-link" to="/household-admin">Open Household Admin</Link></div><div className="celebration-issue-list">{householdAdminAttention.map((signal) => <Link className={`celebration-issue-card celebration-issue-card--${signal.severity === "critical" ? "critical" : "warning"}`} key={signal.item.id} to={`/household-admin?edit=${encodeURIComponent(signal.item.id)}`}><div className="celebration-issue-card__top"><div className="event-detail__badges"><Badge tone={signal.severity === "critical" ? "critical" : "warning"}>{signal.label}</Badge><Badge tone="accent">{signal.item.title}</Badge></div>{signal.item.dueDate ? <small>{formatLongDate(signal.item.dueDate)}</small> : null}</div><strong>{signal.message}</strong></Link>)}</div></section> : null}
      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Celebration prep</p><h2>{celebrationReadiness.length ? "Today and tomorrow only" : "Nothing urgent for celebrations"}</h2></div><Link className="back-link" to="/celebrations">Open Gifts &amp; Celebrations</Link></div>
        {celebrationReadiness.length ? <div className="celebration-issue-list">{celebrationReadiness.map((summary) => <article className={`celebration-issue-card celebration-issue-card--${summary.level === "overdue" ? "critical" : "warning"}`} key={summary.occasionId}><div className="celebration-issue-card__top"><div className="event-detail__badges"><CelebrationReadinessBadge level={summary.level} /><Badge tone="accent">{summary.occasionTitle}</Badge></div>{summary.occasionDate ? <small>{formatLongDate(summary.occasionDate)}</small> : null}</div><strong>{summary.issues[0]?.message ?? "Gift or celebration work needs attention."}</strong></article>)}</div> : <p className="section-empty-copy">Nothing urgent for celebrations today.</p>}
      </section>
      {data?.events.length === 0 ? <section className="empty-panel"><span className="empty-panel__icon"><Icon name="today" /></span><h2>Nothing planned today</h2><p>A rare blank square. Add an event when something lands.</p><Link className="button button--primary" to="/events/new"><Icon name="plus" /> Add an event</Link></section> : null}
      {data && data.events.length > 0 ? <>
        <section className="section-block attention-section"><div className="section-heading"><div><p className="eyebrow">Needs attention</p><h2>{visibleConflicts.length ? `${visibleConflicts.length} issue${visibleConflicts.length === 1 ? "" : "s"} today` : "Today is clear"}</h2></div></div><ConflictList conflicts={visibleConflicts} events={data.allEvents} />{!visibleConflicts.length ? <p className="section-empty-copy">No current conflicts affect today's events.</p> : null}</section>
        <section className="event-list" aria-label="Today's events">{data.events.map((event) => <EventCard conflicts={conflictsForEvent(conflicts, event.id)} event={event} familyMembers={data.familyMembers} key={event.id} place={data.places.find((place) => place.id === event.placeId)} />)}</section>
      </> : null}
    </div>
  );
}
