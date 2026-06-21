import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { EventCard } from "../components/events/EventCard";
import { PrepTaskCard } from "../components/prep/PrepTaskCard";
import { CarNeedCard } from "../components/resources/CarNeedCard";
import { ConflictList } from "../components/conflicts/ConflictCard";
import { SchoolStatus } from "../components/school/SchoolStatus";
import { SchoolReadiness } from "../components/school/SchoolReadiness";
import { CountdownCard } from "../components/countdowns/CountdownCard";
import { WeatherSuggestionCard } from "../components/weather/WeatherSuggestionCard";
import { SchoolPrepActionList } from "../components/prep/SchoolPrepActionCard";
import { FAMILY_CAR_RESOURCE_ID } from "../domain/constants";
import type { Conflict } from "../domain/types";
import {
  getEvents,
  getCountdownTargets,
  getEventsForDate,
  getEventsForDateRange,
  getFamilyMembers,
  getHousehold,
  getPlaces,
  getPrepTasks,
  getResources,
  getSchoolCalendar,
  listSchoolHalfTermConfigs,
  getResourceNeeds,
  setPrepTaskStatus,
} from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { addDaysToDateKey, currentDateKey, dateKeyToIsoStart, getWeekStartDateKey, isoToDateKey } from "../utils/dates";
import { prepSummary, prepTaskGroup } from "../utils/prepTasks";
import { carNeedGroup, carSummary } from "../utils/resourceNeeds";
import { calculateConflicts, conflictsForEvent } from "../services/conflictService";
import { getSchoolDayStatus } from "../services/schoolCalendarService";
import { getSchoolReadinessForDate } from "../services/schoolReadinessService";
import { dashboardCountdowns } from "../services/countdownService";
import { getWeatherSchoolContexts } from "../services/weatherService";
import { upsertSchoolReadinessPrepActionsForRange } from "../services/schoolReadinessPrepActionService";

const ATTENTION_TYPE_ORDER: Record<Conflict["type"], number> = {
  car_clash: 0,
  maybe_car_clash: 1,
  critical_prep_overdue: 2,
  prep_overdue: 3,
  unassigned_responsibility: 4,
};

export function orderDashboardConflicts(conflicts: Conflict[]) {
  return [...conflicts].sort((left, right) => ATTENTION_TYPE_ORDER[left.type] - ATTENTION_TYPE_ORDER[right.type] || left.id.localeCompare(right.id));
}

export function DashboardPage() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const state = useRepositoryQuery(async () => {
    const today = currentDateKey();
    const weekStart = getWeekStartDateKey(today);
    const [household, familyMembers, resources, places, todayEvents, weekEvents, allEvents, prepItems, carItems, schoolCalendar, countdownTargets, halfTermConfigs] = await Promise.all([
      getHousehold(),
      getFamilyMembers(),
      getResources(),
      getPlaces(),
      getEventsForDate(today),
      getEventsForDateRange(new Date(dateKeyToIsoStart(weekStart)), new Date(dateKeyToIsoStart(addDaysToDateKey(weekStart, 7)))),
      getEvents(),
      getPrepTasks(),
      getResourceNeeds(FAMILY_CAR_RESOURCE_ID),
      getSchoolCalendar(),
      getCountdownTargets(),
      listSchoolHalfTermConfigs(),
    ]);
    const schoolReadiness = getSchoolReadinessForDate(schoolCalendar, halfTermConfigs, today);
    const tomorrowReadiness = getSchoolReadinessForDate(schoolCalendar, halfTermConfigs, addDaysToDateKey(today, 1));
    const weather = await getWeatherSchoolContexts([schoolReadiness, tomorrowReadiness]);
    const schoolPrepActions = await upsertSchoolReadinessPrepActionsForRange([schoolReadiness, tomorrowReadiness], Object.fromEntries(Object.entries(weather).map(([date, context]) => [date, context.suggestions])));
    return { today, household, familyMembers, resources, places, todayEvents, weekEvents, allEvents, prepItems, carItems, schoolCalendar, countdownTargets, halfTermConfigs, schoolReadiness, tomorrowReadiness, weather, schoolPrepActions };
  }, [refreshVersion]);
  const data = state.data;
  const activeEvents = data?.allEvents.filter((event) => event.status !== "cancelled") ?? [];
  const todayEvents = data?.todayEvents.filter((event) => event.status !== "cancelled") ?? [];
  const weekEvents = data?.weekEvents.filter((event) => event.status !== "cancelled") ?? [];
  const prep = prepSummary(data?.prepItems ?? []);
  const car = carSummary(data?.carItems ?? []);
  const conflicts = orderDashboardConflicts(calculateConflicts(activeEvents));
  const criticalCount = conflicts.filter((conflict) => conflict.severity === "critical").length;
  const todayCar = car.active.filter(({ need }) => carNeedGroup(need) === "today");
  const tomorrowPrep = data?.prepItems.filter(({ task, event }) => event.status !== "cancelled" && prepTaskGroup(task) === "tomorrow") ?? [];
  const comingUp = data
    ? activeEvents.filter((event) => isoToDateKey(event.startAt) > data.today && Date.parse(event.endAt) >= Date.now()).slice(0, 3)
    : [];
  const schoolStatus = data ? getSchoolDayStatus(data.schoolCalendar, data.today) : undefined;
  const schoolReadiness = data?.schoolReadiness;
  const tomorrowReadiness = data?.tomorrowReadiness;
  const countdowns = data ? dashboardCountdowns(data.countdownTargets, data.today) : undefined;

  const updatePrep = async (eventId: string, taskId: string, status: "open" | "done" | "skipped") => {
    await setPrepTaskStatus(eventId, taskId, status);
    setRefreshVersion((value) => value + 1);
  };

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">Home base</p>
        <h1>Family plans,<br /><em>held together.</em></h1>
        <p>See what needs action first, then move through today and the days ahead.</p>
        <div className="hero-card__actions">
          <Link className="hero-card__action" to="/events/new"><Icon name="plus" /> Add an event</Link>
          <Link className="hero-card__link" to="/hub">Open household Hub</Link>
        </div>
      </section>

      {state.loading ? <LoadingState label="Putting today in order…" /> : null}
      {state.error ? <ErrorState /> : null}
      {data ? (
        <>
          <section className={`section-block attention-section${criticalCount ? " attention-section--critical" : ""}`} data-dashboard-section="attention">
            <div className="section-heading"><div><p className="eyebrow">Needs attention</p><h2>{conflicts.length ? `${conflicts.length} item${conflicts.length === 1 ? "" : "s"} to sort` : "Everything important is covered"}</h2></div>{conflicts.length ? <Badge tone={criticalCount ? "critical" : "warning"}>{criticalCount ? `${criticalCount} critical` : "Check when ready"}</Badge> : <Badge tone="success">All clear</Badge>}</div>
            <ConflictList conflicts={conflicts} events={activeEvents} onPrepComplete={(eventId, taskId) => updatePrep(eventId, taskId, "done")} />
            {!conflicts.length ? <DashboardEmpty icon="check" title="Nothing needs attention" copy="No car clashes, overdue preparation or responsibility gaps right now." /> : null}
          </section>

          <section className="section-block" data-dashboard-section="today">
            <div className="section-heading"><div><p className="eyebrow">Today’s events</p><h2>{todayEvents.length ? `${todayEvents.length} thing${todayEvents.length === 1 ? "" : "s"} on today` : "A clear day"}</h2></div><Link className="back-link" to="/today">Open Today</Link></div>
            {todayEvents.length ? <div className="event-list">{todayEvents.map((event) => <EventCard conflicts={conflictsForEvent(conflicts, event.id)} event={event} familyMembers={data.familyMembers} key={event.id} place={data.places.find((place) => place.id === event.placeId)} />)}</div> : <DashboardEmpty icon="calendar" title="No events today" copy="There’s nothing scheduled. Add an event if a plan is missing." />}
          </section>

          <section className="section-block" data-dashboard-section="car">
            <div className="section-heading"><div><p className="eyebrow">Today’s car</p><h2>{todayCar.length ? `${todayCar.length} car need${todayCar.length === 1 ? "" : "s"} today` : "The car is free"}</h2></div><Link className="back-link" to="/car">Open Car</Link></div>
            {todayCar.length ? <div className="car-need-list">{todayCar.map((item) => <CarNeedCard familyMembers={data.familyMembers} item={item} key={`${item.event.id}-${item.need.id}`} />)}</div> : <DashboardEmpty icon="car" title="No car needs today" copy="No one has marked the family car as required or maybe today." />}
          </section>

          <section className="section-block" data-dashboard-section="prep">
            <div className="section-heading"><div><p className="eyebrow">Tomorrow’s prep</p><h2>{tomorrowPrep.length ? "Get ahead without overloading today" : "Nothing due tomorrow"}</h2></div><Link className="back-link" to="/prep">Open Prep</Link></div>
            {tomorrowPrep.length ? <div className="prep-task-list">{tomorrowPrep.slice(0, 3).map((item) => <PrepTaskCard familyMembers={data.familyMembers} item={item} key={`${item.event.id}-${item.task.id}`} onStatusChange={(status) => updatePrep(item.event.id, item.task.id, status)} />)}</div> : <DashboardEmpty icon="prep" title="No prep due" copy="There are no open preparation tasks due tomorrow." />}
          </section>

          <section className="section-block" data-dashboard-section="coming-up">
            <div className="section-heading"><div><p className="eyebrow">Coming up</p><h2>{comingUp.length ? "The next few things" : "A quiet week ahead"}</h2></div><Link className="back-link" to="/week">Open Week</Link></div>
            {comingUp.length ? <div className="event-list">{comingUp.map((event) => <EventCard conflicts={conflictsForEvent(conflicts, event.id)} event={event} familyMembers={data.familyMembers} key={event.id} place={data.places.find((place) => place.id === event.placeId)} />)}</div> : <DashboardEmpty icon="calendar" title="Quiet or low-activity week" copy="There’s nothing else coming up in the current plans." />}
          </section>

          {schoolStatus ? <section className="section-block school-context-section"><div className="section-heading"><div><p className="eyebrow">School readiness</p><h2>Today and tomorrow for Seb</h2></div><Link className="back-link" to="/prep">School Prep</Link></div><SchoolStatus context="dashboard" linked status={schoolStatus} />{schoolReadiness ? <SchoolReadiness heading="Today" readiness={schoolReadiness} /> : null}{data.weather[data.today]?.settings.showOnDashboard && (data.weather[data.today].suggestions.length || data.weather[data.today].status === "unavailable") ? <WeatherSuggestionCard context={data.weather[data.today]} heading="Today’s school weather" limit={3} /> : null}<SchoolPrepActionList actions={data.schoolPrepActions.filter((item) => item.status === "open")} compact onChanged={() => setRefreshVersion((value) => value + 1)} />{tomorrowReadiness && tomorrowReadiness.schoolStatus !== "closed" ? <SchoolReadiness heading="Tomorrow" readiness={tomorrowReadiness} /> : null}{data.weather[tomorrowReadiness?.date ?? ""]?.settings.showOnDashboard && (data.weather[tomorrowReadiness?.date ?? ""].suggestions.length || data.weather[tomorrowReadiness?.date ?? ""].status === "unavailable") ? <WeatherSuggestionCard context={data.weather[tomorrowReadiness?.date ?? ""]} heading="Tomorrow’s school weather" limit={3} /> : null}</section> : null}

          {countdowns && (countdowns.primary || countdowns.secondary.length) ? <section className="section-block countdown-section" data-dashboard-section="countdowns"><div className="section-heading"><div><p className="eyebrow">Family countdown</p><h2>Something to look forward to</h2></div><Link className="back-link" to="/settings/countdowns">Manage</Link></div>{countdowns.primary ? <CountdownCard countdown={countdowns.primary} primary /> : null}{countdowns.secondary.length ? <div className="countdown-secondary-list">{countdowns.secondary.map((countdown) => <CountdownCard countdown={countdown} key={countdown.id} />)}</div> : null}</section> : null}

          <section className="quick-stats" aria-label="Routine overview" data-dashboard-section="routine">
            <Link className="stat-card" to="/today"><strong>{todayEvents.length}</strong><span>event{todayEvents.length === 1 ? "" : "s"} today</span><Icon name="chevron" /></Link>
            <Link className="stat-card" to="/week"><strong>{weekEvents.length}</strong><span>this week</span><Icon name="chevron" /></Link>
            <Link className={`stat-card${prep.overdue ? " stat-card--alert" : ""}`} to="/prep"><strong>{prep.open}</strong><span>prep open{prep.overdue ? ` · ${prep.overdue} overdue` : ""}</span><Icon name="chevron" /></Link>
            <Link className="stat-card" to="/car"><strong>{car.today}</strong><span>car need{car.today === 1 ? "" : "s"} today</span><Icon name="chevron" /></Link>
          </section>

          <section className="section-block">
            <div className="section-heading"><div><p className="eyebrow">Your household</p><h2>{data.household?.name ?? "Lawrence Family"}</h2></div><Badge tone="success">Local &amp; private</Badge></div>
            <div className="family-row" aria-label="Family members">{data.familyMembers.map((member) => <Link className="family-chip" key={member.id} to={`/people/${member.id}`}><span className={`family-chip__avatar family-chip__avatar--${member.memberType}`} aria-hidden="true">{member.displayName.slice(0, 1)}</span><span>{member.displayName}</span></Link>)}</div>
          </section>

          <section className="dashboard-grid">
            <article className="summary-card summary-card--car"><span className="summary-card__icon"><Icon name="car" /></span><div><p className="eyebrow">Shared resource</p><h2>{car.required} required · {car.maybe} maybe</h2><p>{car.active.length ? `${car.active.length} upcoming need${car.active.length === 1 ? "" : "s"} for the ${data.resources.find((resource) => resource.resourceType === "car")?.name ?? "family car"}.` : "No upcoming car needs recorded."}</p></div></article>
            <article className="summary-card"><span className="summary-card__icon"><Icon name="prep" /></span><div><p className="eyebrow">Operational memory</p><h2>{prep.open ? `${prep.open} preparation item${prep.open === 1 ? "" : "s"} open` : "Preparation is clear"}</h2><p>{prep.blocking ? `${prep.blocking} open item${prep.blocking === 1 ? "" : "s"} marked as blocking an event.` : "Nothing currently marked as blocking an event."}</p></div></article>
          </section>
        </>
      ) : null}
    </div>
  );
}

function DashboardEmpty({ icon, title, copy }: { icon: Parameters<typeof Icon>[0]["name"]; title: string; copy: string }) {
  return <div className="dashboard-empty"><span className="dashboard-empty__icon"><Icon name={icon} /></span><div><strong>{title}</strong><p>{copy}</p></div></div>;
}
