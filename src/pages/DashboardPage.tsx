import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { EventCard } from "../components/events/EventCard";
import { PrepTaskCard } from "../components/prep/PrepTaskCard";
import { CarNeedCard } from "../components/resources/CarNeedCard";
import { FAMILY_CAR_RESOURCE_ID } from "../domain/constants";
import {
  getEvents,
  getEventsForDate,
  getEventsForDateRange,
  getFamilyMembers,
  getHousehold,
  getPlaces,
  getPrepTasks,
  getResources,
  getResourceNeeds,
  setPrepTaskStatus,
} from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { addDaysToDateKey, currentDateKey, dateKeyToIsoStart, getWeekStartDateKey } from "../utils/dates";
import { prepSummary } from "../utils/prepTasks";
import { carSummary } from "../utils/resourceNeeds";

export function DashboardPage() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const state = useRepositoryQuery(async () => {
    const today = currentDateKey();
    const weekStart = getWeekStartDateKey(today);
    const [household, familyMembers, resources, places, todayEvents, weekEvents, allEvents, prepItems, carItems] = await Promise.all([
      getHousehold(),
      getFamilyMembers(),
      getResources(),
      getPlaces(),
      getEventsForDate(today),
      getEventsForDateRange(new Date(dateKeyToIsoStart(weekStart)), new Date(dateKeyToIsoStart(addDaysToDateKey(weekStart, 7)))),
      getEvents(),
      getPrepTasks(),
      getResourceNeeds(FAMILY_CAR_RESOURCE_ID),
    ]);
    const now = Date.now();
    const nextEvent = allEvents.find((event) => Date.parse(event.endAt) >= now && event.status !== "cancelled");
    return { household, familyMembers, resources, places, todayEvents, weekEvents, nextEvent, prepItems, carItems };
  }, [refreshVersion]);
  const data = state.data;
  const prep = prepSummary(data?.prepItems ?? []);
  const car = carSummary(data?.carItems ?? []);

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">Home base</p>
        <h1>Family plans,<br /><em>held together.</em></h1>
        <p>Car clashes, kit reminders and the things we forget—all in one calm family loop.</p>
        <Link className="hero-card__action" to="/events/new"><Icon name="plus" /> Add an event</Link>
      </section>

      {state.loading ? <LoadingState /> : null}
      {state.error ? <ErrorState /> : null}
      {data ? (
        <>
          <section className="quick-stats">
            <Link className="stat-card" to="/today"><strong>{data.todayEvents.length}</strong><span>event{data.todayEvents.length === 1 ? "" : "s"} today</span><Icon name="chevron" /></Link>
            <Link className="stat-card" to="/week"><strong>{data.weekEvents.length}</strong><span>this week</span><Icon name="chevron" /></Link>
            <Link className={`stat-card${prep.overdue ? " stat-card--alert" : ""}`} to="/prep"><strong>{prep.open}</strong><span>prep open{prep.overdue ? ` · ${prep.overdue} overdue` : ""}</span><Icon name="chevron" /></Link>
            <Link className="stat-card" to="/car"><strong>{car.today}</strong><span>car need{car.today === 1 ? "" : "s"} today</span><Icon name="chevron" /></Link>
          </section>

          {data.nextEvent ? <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Next up</p><h2>The next thing in the loop</h2></div></div><EventCard event={data.nextEvent} familyMembers={data.familyMembers} place={data.places.find((place) => place.id === data.nextEvent?.placeId)} /></section> : null}

          {data.prepItems.some(({ task }) => task.status === "open") ? <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Prep due</p><h2>Things not to forget</h2></div><Link className="back-link" to="/prep">See all</Link></div><div className="prep-task-list">{data.prepItems.filter(({ task }) => task.status === "open").slice(0, 3).map((item) => <PrepTaskCard familyMembers={data.familyMembers} item={item} key={`${item.event.id}-${item.task.id}`} onStatusChange={async (status) => { await setPrepTaskStatus(item.event.id, item.task.id, status); setRefreshVersion((value) => value + 1); }} />)}</div></section> : null}

          {car.active.length ? <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Car watch</p><h2>Upcoming car needs</h2></div><Link className="back-link" to="/car">See all</Link></div><div className="car-need-list">{car.active.slice(0, 3).map((item) => <CarNeedCard familyMembers={data.familyMembers} item={item} key={`${item.event.id}-${item.need.id}`} />)}</div></section> : null}

          <section className="section-block">
            <div className="section-heading"><div><p className="eyebrow">Your household</p><h2>{data.household?.name ?? "Lawrence Family"}</h2></div><Badge tone="success">Local & private</Badge></div>
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
