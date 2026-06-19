import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { PrepTaskCard } from "../components/prep/PrepTaskCard";
import { PageHeader } from "../components/layout/PageHeader";
import { getFamilyMembers, getPrepTasks, setPrepTaskStatus } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { PREP_GROUP_LABELS, PREP_GROUP_ORDER, prepSummary, prepTaskGroup, type PrepTaskGroup } from "../utils/prepTasks";

export function PrepPage() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [ownerFilter, setOwnerFilter] = useState("all");
  const state = useRepositoryQuery(async () => {
    const [items, familyMembers] = await Promise.all([getPrepTasks(), getFamilyMembers()]);
    return { items, familyMembers };
  }, [refreshVersion]);
  const data = state.data;
  const filtered = useMemo(() => data?.items.filter(({ task }) => ownerFilter === "all" || (ownerFilter === "unassigned" ? task.ownerIds.length === 0 : task.ownerIds.includes(ownerFilter))) ?? [], [data, ownerFilter]);
  const summary = prepSummary(data?.items ?? []);
  const grouped = PREP_GROUP_ORDER.map((group) => ({ group, items: filtered.filter(({ task }) => prepTaskGroup(task) === group) }));

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Operational memory" title="Prep">Things to pack, buy, charge, complete or remember—attached to the commitments they belong to.</PageHeader>
      {state.loading ? <LoadingState label="Gathering preparation tasks…" /> : null}
      {state.error ? <ErrorState /> : null}
      {data ? <><section className="prep-summary-grid"><article><strong>{summary.open}</strong><span>open</span></article><article className={summary.overdue ? "is-alert" : ""}><strong>{summary.overdue}</strong><span>overdue</span></article><article className={summary.critical ? "is-alert" : ""}><strong>{summary.critical}</strong><span>critical</span></article><article><strong>{summary.blocking}</strong><span>blocking</span></article></section><label className="prep-owner-filter"><span>Owner</span><select onChange={(event) => setOwnerFilter(event.target.value)} value={ownerFilter}><option value="all">Everyone</option>{data.familyMembers.filter((member) => member.memberType === "adult").map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}<option value="unassigned">Unassigned</option></select></label>{data.items.length === 0 ? <section className="empty-panel"><span className="empty-panel__icon"><Icon name="prep" /></span><h2>Nothing to prepare yet</h2><p>Add preparation tasks inside an event, and they will gather here automatically.</p></section> : grouped.map(({ group, items }) => items.length ? <PrepGroup familyMembers={data.familyMembers} group={group} items={items} key={group} onChanged={() => setRefreshVersion((value) => value + 1)} /> : null)}</> : null}
    </div>
  );
}

function PrepGroup({ familyMembers, group, items, onChanged }: { familyMembers: Awaited<ReturnType<typeof getFamilyMembers>>; group: PrepTaskGroup; items: Awaited<ReturnType<typeof getPrepTasks>>; onChanged: () => void }) {
  return <section className={`prep-group prep-group--${group}`}><header><h2>{PREP_GROUP_LABELS[group]}</h2><span>{items.length}</span></header><div className="prep-task-list">{items.map((item) => <PrepTaskCard familyMembers={familyMembers} item={item} key={`${item.event.id}-${item.task.id}`} onStatusChange={async (status) => { await setPrepTaskStatus(item.event.id, item.task.id, status); onChanged(); }} />)}</div></section>;
}
