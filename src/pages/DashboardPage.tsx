import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { EventCard } from "../components/events/EventCard";
import {
  getEvents,
  getEventsForDate,
  getEventsForDateRange,
  getFamilyMembers,
  getHousehold,
  getPlaces,
  getResources,
} from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { addDaysToDateKey, currentDateKey, dateKeyToIsoStart, getWeekStartDateKey } from "../utils/dates";

export function DashboardPage() {
  const state = useRepositoryQuery(async () => {
    const today = currentDateKey();
    const weekStart = getWeekStartDateKey(today);
    const [household, familyMembers, resources, places, todayEvents, weekEvents, allEvents] = await Promise.all([
      getHousehold(),
      getFamilyMembers(),
      getResources(),
      getPlaces(),
      getEventsForDate(today),
      getEventsForDateRange(new Date(dateKeyToIsoStart(weekStart)), new Date(dateKeyToIsoStart(addDaysToDateKey(weekStart, 7)))),
      getEvents(),
    ]);
    const now = Date.now();
    const nextEvent = allEvents.find((event) => Date.parse(event.endAt) >= now && event.status !== "cancelled");
    return { household, familyMembers, resources, places, todayEvents, weekEvents, nextEvent };
  });
  const data = state.data;

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
          </section>

          {data.nextEvent ? <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Next up</p><h2>The next thing in the loop</h2></div></div><EventCard event={data.nextEvent} familyMembers={data.familyMembers} place={data.places.find((place) => place.id === data.nextEvent?.placeId)} /></section> : null}

          <section className="section-block">
            <div className="section-heading"><div><p className="eyebrow">Your household</p><h2>{data.household?.name ?? "Lawrence Family"}</h2></div><Badge tone="success">Local & private</Badge></div>
            <div className="family-row" aria-label="Family members">{data.familyMembers.map((member) => <Link className="family-chip" key={member.id} to={`/people/${member.id}`}><span className={`family-chip__avatar family-chip__avatar--${member.memberType}`} aria-hidden="true">{member.displayName.slice(0, 1)}</span><span>{member.displayName}</span></Link>)}</div>
          </section>

          <section className="dashboard-grid">
            <article className="summary-card summary-card--car"><span className="summary-card__icon"><Icon name="car" /></span><div><p className="eyebrow">Shared resource</p><h2>{data.resources.find((resource) => resource.resourceType === "car")?.name ?? "Family car"}</h2><p>Car needs and practical clashes will gather here in a later tranche.</p></div></article>
            <article className="summary-card"><span className="summary-card__icon"><Icon name="prep" /></span><div><p className="eyebrow">Coming next</p><h2>Preparation memory</h2><p>Things to pack, buy, charge and remember belong to Tranche 2.</p></div></article>
          </section>
        </>
      ) : null}
    </div>
  );
}
