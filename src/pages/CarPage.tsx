import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { CarNeedCard } from "../components/resources/CarNeedCard";
import { PageHeader } from "../components/layout/PageHeader";
import { FAMILY_CAR_RESOURCE_ID } from "../domain/constants";
import { getFamilyMembers, getResourceNeeds } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { CAR_GROUP_LABELS, CAR_GROUP_ORDER, carNeedGroup, carSummary, type CarNeedGroup } from "../utils/resourceNeeds";

export function CarPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const state = useRepositoryQuery(async () => {
    const [items, familyMembers] = await Promise.all([getResourceNeeds(FAMILY_CAR_RESOURCE_ID), getFamilyMembers()]);
    return { items, familyMembers };
  });
  const data = state.data;
  const summary = carSummary(data?.items ?? []);
  const filtered = useMemo(() => summary.active.filter(({ need }) => statusFilter === "all" || need.needStatus === statusFilter), [summary.active, statusFilter]);
  const groups = CAR_GROUP_ORDER.map((group) => ({ group, items: filtered.filter(({ need }) => carNeedGroup(need) === group) }));

  return <div className="page-stack"><PageHeader eyebrow="Shared wheels" title="Car">Who needs the family car, when they need it, and who it is allocated to. Clash detection comes next.</PageHeader>{state.loading ? <LoadingState label="Gathering car needs…" /> : null}{state.error ? <ErrorState /> : null}{data ? <><section className="car-summary-grid"><article><strong>{summary.today}</strong><span>today</span></article><article><strong>{summary.required}</strong><span>required</span></article><article><strong>{summary.maybe}</strong><span>maybe</span></article></section><label className="prep-owner-filter"><span>Show</span><select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="all">Required and maybe</option><option value="required">Required only</option><option value="maybe">Maybe only</option></select></label>{summary.active.length === 0 ? <section className="empty-panel"><span className="empty-panel__icon"><Icon name="car" /></span><h2>No upcoming car needs</h2><p>Mark the family car as required or maybe needed inside an event.</p></section> : groups.map(({ group, items }) => items.length ? <CarGroup familyMembers={data.familyMembers} group={group} items={items} key={group} /> : null)}</> : null}</div>;
}

function CarGroup({ familyMembers, group, items }: { familyMembers: Awaited<ReturnType<typeof getFamilyMembers>>; group: CarNeedGroup; items: ReturnType<typeof carSummary>["active"] }) {
  return <section className={`car-group car-group--${group}`}><header><h2>{CAR_GROUP_LABELS[group]}</h2><span>{items.length}</span></header><div className="car-need-list">{items.map((item) => <CarNeedCard familyMembers={familyMembers} item={item} key={`${item.event.id}-${item.need.id}`} />)}</div></section>;
}
