import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { EventCard } from "../components/events/EventCard";
import { getEvents, getFamilyMemberById, getFamilyMembers, getPlaces } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { calculateConflicts, conflictsForEvent } from "../services/conflictService";

export function PersonDetailPage() {
  const { memberId = "" } = useParams();
  const state = useRepositoryQuery(async () => { const [member, events, members, places] = await Promise.all([getFamilyMemberById(memberId), getEvents(), getFamilyMembers(), getPlaces()]); return { member, events, members, places }; }, [memberId]);
  if (state.loading && !state.data) return <LoadingState label="Finding this family member…" />;
  if (state.error) return <ErrorState />;
  if (!state.data?.member) return <div className="empty-state"><span className="empty-state__icon"><Icon name="people" /></span><h1>Person not found</h1><p>There isn’t a family member with that address.</p><Link className="button-link" to="/people">Back to people</Link></div>;
  const { member, events, members, places } = state.data;
  const relevant = events.filter((event) => event.participants.includes(member.id) || event.responsibleAdults.includes(member.id) || event.prepTasks.some((task) => task.ownerIds.includes(member.id))).slice(0, 20);
  const conflicts = calculateConflicts(events);
  return <div className="page-stack"><Link className="back-link" to="/people">← All people</Link><section className="profile-card"><span className={`profile-card__avatar profile-card__avatar--${member.memberType}`}>{member.displayName.slice(0, 1)}</span><p className="eyebrow">Family member</p><h1>{member.displayName}</h1><div className="profile-card__badges"><Badge tone="accent"><span className="capitalize">{member.memberType}</span></Badge><Badge tone={member.active ? "success" : "neutral"}>{member.active ? "Active" : "Inactive"}</Badge></div></section><section className="routine-section"><div className="section-heading"><div><p className="eyebrow">Their family view</p><h2>Events and responsibilities</h2></div></div>{relevant.length ? <div className="event-list">{relevant.map((event) => <EventCard conflicts={conflictsForEvent(conflicts, event.id)} event={event} familyMembers={members} key={event.id} place={places.find((place) => place.id === event.placeId)} />)}</div> : <p className="section-empty-copy">Nothing is currently assigned to {member.displayName}.</p>}</section></div>;
}
