import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { PersonCard } from "../components/cards/PersonCard";
import { PageHeader } from "../components/layout/PageHeader";
import { getFamilyMembers } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";

export function PeoplePage() {
  const state = useRepositoryQuery(getFamilyMembers);
  return (
    <div className="page-stack">
      <PageHeader eyebrow="The household" title="People">Plans make more sense when it is clear who is involved and who is responsible.</PageHeader>
      {state.loading ? <LoadingState label="Gathering the family…" /> : null}
      {state.error ? <ErrorState /> : null}
      {state.data ? <section className="card-list" aria-label="Family members">{state.data.map((member) => <PersonCard key={member.id} member={member} />)}</section> : null}
    </div>
  );
}
