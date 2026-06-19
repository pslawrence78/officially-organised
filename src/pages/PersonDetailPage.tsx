import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { getFamilyMemberById } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";

export function PersonDetailPage() {
  const { memberId = "" } = useParams();
  const state = useRepositoryQuery(() => getFamilyMemberById(memberId), [memberId]);

  if (state.loading) return <LoadingState label="Finding this family member…" />;
  if (state.error) return <ErrorState />;
  if (!state.data) {
    return <div className="empty-state"><span className="empty-state__icon"><Icon name="people" /></span><h1>Person not found</h1><p>There isn’t a family member with that address. Nothing has been changed.</p><Link className="button-link" to="/people">Back to people</Link></div>;
  }

  return (
    <div className="page-stack">
      <Link className="back-link" to="/people">← All people</Link>
      <section className="profile-card">
        <span className={`profile-card__avatar profile-card__avatar--${state.data.memberType}`}>{state.data.displayName.slice(0, 1)}</span>
        <p className="eyebrow">Family member</p>
        <h1>{state.data.displayName}</h1>
        <div className="profile-card__badges"><Badge tone="accent"><span className="capitalize">{state.data.memberType}</span></Badge><Badge tone={state.data.active ? "success" : "neutral"}>{state.data.active ? "Active" : "Inactive"}</Badge></div>
      </section>
      <section className="placeholder-panel"><span className="placeholder-panel__icon"><Icon name="week" /></span><div><h2>{state.data.displayName}’s view</h2><p>Events, responsibilities, prep and car needs relevant to {state.data.displayName} will collect here in later tranches.</p></div></section>
    </div>
  );
}
