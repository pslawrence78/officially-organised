import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { PageHeader } from "../components/layout/PageHeader";
import {
  HOUSEHOLD_ADMIN_CATEGORY_LABELS,
  HOUSEHOLD_ADMIN_CYCLE_LABELS,
  HOUSEHOLD_ADMIN_CYCLES,
  HOUSEHOLD_ADMIN_STATUS_LABELS,
  HOUSEHOLD_ADMIN_STATUSES,
  HOUSEHOLD_ADMIN_TYPE_LABELS,
  HOUSEHOLD_ADMIN_TYPES,
} from "../domain/constants";
import type {
  HouseholdAdminCategory,
  HouseholdAdminItem,
  HouseholdAdminItemInput,
} from "../domain/types";
import {
  createHouseholdAdminItem,
  getFamilyMembers,
  getResources,
  listHouseholdAdminItems,
  updateHouseholdAdminItem,
} from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { completeHouseholdAdminItem, deriveHouseholdAdminSignal, sortHouseholdAdminSignals, type HouseholdAdminDueState, type HouseholdAdminSignal } from "../services/householdAdminService";
import { currentDateKey } from "../utils/dates";

const VIEW_FILTERS = ["active", "archived", "all"] as const;
type ViewFilter = typeof VIEW_FILTERS[number];

const DUE_FILTERS: Array<"all" | HouseholdAdminDueState> = ["all", "overdue", "due_today", "due_soon", "no_date", "upcoming", "complete", "archived"];
const SECTION_ORDER = ["Vehicle", "Insurance & cover", "Home maintenance", "Warranties & subscriptions", "Other"] as const;

function defaultDraft(): HouseholdAdminItemInput {
  return {
    title: "",
    category: "vehicle",
    adminType: "car_service",
    status: "active",
    renewalCycle: "annual",
    reminderDaysBefore: [30, 14, 7],
  };
}

function reminderInputValue(value?: number[]) {
  return value?.length ? value.join(", ") : "";
}

function parseReminderInput(value: string) {
  const numbers = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 0);
  return numbers.length ? [...new Set(numbers)].sort((left, right) => right - left) : undefined;
}

function toneFor(signal: HouseholdAdminSignal) {
  return signal.severity === "critical" ? "critical" : signal.severity === "warning" ? "warning" : signal.severity === "info" ? "accent" : "neutral";
}

function belongsToSection(category: HouseholdAdminCategory) {
  switch (category) {
    case "vehicle":
      return "Vehicle";
    case "insurance":
      return "Insurance & cover";
    case "home_maintenance":
    case "utilities":
      return "Home maintenance";
    case "warranty":
    case "finance":
    case "documents":
      return "Warranties & subscriptions";
    default:
      return "Other";
  }
}

function allowsBooked(signal: HouseholdAdminSignal) {
  return ["car_service", "mot", "boiler_service", "aircon_service", "appliance_service", "home_maintenance"].includes(signal.item.adminType);
}

function allowsRenewed(signal: HouseholdAdminSignal) {
  return ["car_insurance", "home_insurance", "travel_insurance", "breakdown_cover", "warranty_expiry", "subscription_renewal", "car_tax"].includes(signal.item.adminType);
}

export function HouseholdAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [draft, setDraft] = useState<HouseholdAdminItemInput>(defaultDraft());
  const [editingId, setEditingId] = useState<string>();
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active");
  const [categoryFilter, setCategoryFilter] = useState<"all" | HouseholdAdminCategory>("all");
  const [ownerFilter, setOwnerFilter] = useState<"all" | string>("all");
  const [dueFilter, setDueFilter] = useState<"all" | HouseholdAdminDueState>("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const state = useRepositoryQuery(async () => {
    const [items, familyMembers, resources] = await Promise.all([
      listHouseholdAdminItems(),
      getFamilyMembers(),
      getResources(),
    ]);
    return { items, familyMembers, resources };
  }, [refreshVersion]);

  const data = state.data;
  const adults = data?.familyMembers.filter((member) => member.memberType === "adult") ?? [];
  const signals = useMemo(() => sortHouseholdAdminSignals((data?.items ?? []).map((item) => deriveHouseholdAdminSignal(item))), [data?.items]);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || !data) return;
    const existing = data.items.find((item) => item.id === editId);
    if (!existing) return;
    setEditingId(existing.id);
    setDraft({
      title: existing.title,
      category: existing.category,
      adminType: existing.adminType,
      status: existing.status,
      dueDate: existing.dueDate,
      startDate: existing.startDate,
      lastCompletedDate: existing.lastCompletedDate,
      renewalCycle: existing.renewalCycle,
      customCycleMonths: existing.customCycleMonths,
      ownerMemberId: existing.ownerMemberId,
      relatedResourceId: existing.relatedResourceId,
      relatedPlaceId: existing.relatedPlaceId,
      providerName: existing.providerName,
      referenceLabel: existing.referenceLabel,
      costAmount: existing.costAmount,
      costCurrency: existing.costCurrency,
      reminderDaysBefore: existing.reminderDaysBefore,
      notes: existing.notes,
    });
  }, [data, searchParams]);

  const filtered = signals.filter((signal) => {
    if (viewFilter === "active" && signal.item.status === "archived") return false;
    if (viewFilter === "archived" && signal.item.status !== "archived") return false;
    if (categoryFilter !== "all" && signal.item.category !== categoryFilter) return false;
    if (ownerFilter !== "all" && (signal.item.ownerMemberId ?? "") !== ownerFilter) return false;
    if (dueFilter !== "all" && signal.dueState !== dueFilter) return false;
    return true;
  });

  const counts = {
    overdue: signals.filter((item) => item.dueState === "overdue").length,
    today: signals.filter((item) => item.dueState === "due_today").length,
    soon: signals.filter((item) => item.dueState === "due_soon").length,
    noDate: signals.filter((item) => item.dueState === "no_date").length,
  };

  async function save() {
    setError("");
    try {
      const payload: HouseholdAdminItemInput = {
        ...draft,
        title: draft.title,
        dueDate: draft.dueDate || undefined,
        startDate: draft.startDate || undefined,
        lastCompletedDate: draft.lastCompletedDate || undefined,
        ownerMemberId: draft.ownerMemberId || undefined,
        relatedResourceId: draft.relatedResourceId || undefined,
        providerName: draft.providerName || undefined,
        referenceLabel: draft.referenceLabel || undefined,
        notes: draft.notes || undefined,
        customCycleMonths: draft.renewalCycle === "custom" ? draft.customCycleMonths : undefined,
        reminderDaysBefore: draft.reminderDaysBefore?.length ? draft.reminderDaysBefore : undefined,
        costAmount: draft.costAmount === undefined || Number.isNaN(draft.costAmount) ? undefined : draft.costAmount,
        costCurrency: draft.costAmount !== undefined ? "GBP" : undefined,
      };
      if (editingId) {
        await updateHouseholdAdminItem(editingId, payload);
        setMessage("Household admin item updated.");
      } else {
        await createHouseholdAdminItem(payload);
        setMessage("Household admin item added.");
      }
      clearDraft();
      setRefreshVersion((value) => value + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save this admin item.");
    }
  }

  function clearDraft() {
    setDraft(defaultDraft());
    setEditingId(undefined);
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      next.delete("edit");
      return next;
    });
  }

  async function runQuickAction(signal: HouseholdAdminSignal, action: "booked" | "completed" | "renewed" | "archived") {
    setError("");
    const next = completeHouseholdAdminItem(signal.item, action, currentDateKey());
    try {
      await updateHouseholdAdminItem(signal.item.id, next);
      setMessage(action === "archived" ? "Item archived." : action === "booked" ? "Item marked booked." : action === "renewed" ? "Item marked renewed." : "Item marked completed.");
      setRefreshVersion((value) => value + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not update this item.");
    }
  }

  return (
    <div className="page-stack household-admin-page">
      <div className="page-title-row">
        <PageHeader eyebrow="Practical household memory" title="Household admin">Renewals, services and practical household checks.</PageHeader>
        <button className="compact-action" onClick={() => { clearDraft(); setMessage(""); }} type="button"><Icon name="plus" /> Add item</button>
      </div>

      {message ? <div className="notice notice--success" role="status"><strong>Saved</strong><span>{message}</span></div> : null}
      {error ? <div className="notice notice--error" role="alert"><strong>Could not save</strong><span>{error}</span></div> : null}
      {state.loading ? <LoadingState label="Gathering household admin…" /> : null}
      {state.error ? <ErrorState /> : null}

      <section className="household-admin-summary-grid">
        <article className="household-admin-stat household-admin-stat--critical"><strong>{counts.overdue}</strong><span>Overdue</span></article>
        <article className="household-admin-stat household-admin-stat--warning"><strong>{counts.today}</strong><span>Due today</span></article>
        <article className="household-admin-stat household-admin-stat--warning"><strong>{counts.soon}</strong><span>Due soon</span></article>
        <article className="household-admin-stat"><strong>{counts.noDate}</strong><span>No due date</span></article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Filters</p>
            <h2>Attention first</h2>
          </div>
        </div>
        <div className="household-admin-filter-grid">
          <label className="form-field"><span>View</span><select onChange={(event) => setViewFilter(event.target.value as ViewFilter)} value={viewFilter}>{VIEW_FILTERS.map((value) => <option key={value} value={value}>{value === "all" ? "Active and archived" : value === "active" ? "Active only" : "Archived only"}</option>)}</select></label>
          <label className="form-field"><span>Category</span><select onChange={(event) => setCategoryFilter(event.target.value as "all" | HouseholdAdminCategory)} value={categoryFilter}><option value="all">All categories</option>{Object.entries(HOUSEHOLD_ADMIN_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="form-field"><span>Due state</span><select onChange={(event) => setDueFilter(event.target.value as "all" | HouseholdAdminDueState)} value={dueFilter}>{DUE_FILTERS.map((value) => <option key={value} value={value}>{value === "all" ? "All due states" : value.replaceAll("_", " ")}</option>)}</select></label>
          <label className="form-field"><span>Owner</span><select onChange={(event) => setOwnerFilter(event.target.value)} value={ownerFilter}><option value="all">Any owner</option>{adults.map((adult) => <option key={adult.id} value={adult.id}>{adult.displayName}</option>)}</select></label>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{editingId ? "Update item" : "Add item"}</p>
            <h2>{editingId ? "Edit household admin item" : "Keep only the meaningful ones"}</h2>
          </div>
        </div>
        <p className="section-empty-copy">Add the renewals and services that are easy to forget but painful to miss.</p>
        <div className="data-form household-admin-form">
          <div className="form-grid">
            <label className="form-field"><span>Title</span><input onChange={(event) => setDraft({ ...draft, title: event.target.value })} value={draft.title} /></label>
            <label className="form-field"><span>Admin type</span><select onChange={(event) => setDraft({ ...draft, adminType: event.target.value as HouseholdAdminItem["adminType"] })} value={draft.adminType}>{HOUSEHOLD_ADMIN_TYPES.map((value) => <option key={value} value={value}>{HOUSEHOLD_ADMIN_TYPE_LABELS[value]}</option>)}</select></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Category</span><select onChange={(event) => setDraft({ ...draft, category: event.target.value as HouseholdAdminCategory })} value={draft.category}>{Object.entries(HOUSEHOLD_ADMIN_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="form-field"><span>Status</span><select onChange={(event) => setDraft({ ...draft, status: event.target.value as HouseholdAdminItem["status"] })} value={draft.status}>{HOUSEHOLD_ADMIN_STATUSES.map((value) => <option key={value} value={value}>{HOUSEHOLD_ADMIN_STATUS_LABELS[value]}</option>)}</select></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Due date</span><input onChange={(event) => setDraft({ ...draft, dueDate: event.target.value || undefined })} type="date" value={draft.dueDate ?? ""} /></label>
            <label className="form-field"><span>Start date</span><input onChange={(event) => setDraft({ ...draft, startDate: event.target.value || undefined })} type="date" value={draft.startDate ?? ""} /></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Renewal cycle</span><select onChange={(event) => setDraft({ ...draft, renewalCycle: event.target.value as HouseholdAdminItem["renewalCycle"] })} value={draft.renewalCycle}>{HOUSEHOLD_ADMIN_CYCLES.map((value) => <option key={value} value={value}>{HOUSEHOLD_ADMIN_CYCLE_LABELS[value]}</option>)}</select></label>
            <label className="form-field"><span>Custom cycle months</span><input disabled={draft.renewalCycle !== "custom"} min="1" onChange={(event) => setDraft({ ...draft, customCycleMonths: event.target.value ? Number(event.target.value) : undefined })} type="number" value={draft.customCycleMonths ?? ""} /></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Owner</span><select onChange={(event) => setDraft({ ...draft, ownerMemberId: event.target.value || undefined })} value={draft.ownerMemberId ?? ""}><option value="">Unassigned</option>{adults.map((adult) => <option key={adult.id} value={adult.id}>{adult.displayName}</option>)}</select></label>
            <label className="form-field"><span>Related resource</span><select onChange={(event) => setDraft({ ...draft, relatedResourceId: event.target.value || undefined })} value={draft.relatedResourceId ?? ""}><option value="">No related resource</option>{data?.resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Provider</span><input onChange={(event) => setDraft({ ...draft, providerName: event.target.value })} value={draft.providerName ?? ""} /></label>
            <label className="form-field"><span>Reference label</span><input onChange={(event) => setDraft({ ...draft, referenceLabel: event.target.value })} value={draft.referenceLabel ?? ""} /></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Cost amount</span><input min="0" onChange={(event) => setDraft({ ...draft, costAmount: event.target.value ? Number(event.target.value) : undefined })} step="0.01" type="number" value={draft.costAmount ?? ""} /></label>
            <label className="form-field"><span>Reminder days before</span><input onChange={(event) => setDraft({ ...draft, reminderDaysBefore: parseReminderInput(event.target.value) })} placeholder="30, 14, 7" value={reminderInputValue(draft.reminderDaysBefore)} /></label>
          </div>
          <label className="form-field"><span>Notes</span><textarea onChange={(event) => setDraft({ ...draft, notes: event.target.value })} rows={4} value={draft.notes ?? ""} /></label>
          <div className="form-actions">
            <button className="button button--secondary" onClick={clearDraft} type="button">Clear</button>
            <button className="button button--primary" onClick={save} type="button">{editingId ? "Save changes" : "Save item"}</button>
          </div>
        </div>
      </section>

      {!filtered.length ? <section className="empty-panel"><span className="empty-panel__icon"><Icon name="clock" /></span><h2>No household admin items here</h2><p>Add the renewals and services that are easy to forget but painful to miss.</p></section> : null}

      {SECTION_ORDER.map((section) => {
        const items = filtered.filter((signal) => belongsToSection(signal.item.category) === section);
        if (!items.length) return null;
        return (
          <section className="section-block" key={section}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Category</p>
                <h2>{section}</h2>
              </div>
            </div>
            <div className="household-admin-card-list">
              {items.map((signal) => {
                const owner = adults.find((adult) => adult.id === signal.item.ownerMemberId)?.displayName;
                const resource = data?.resources.find((item) => item.id === signal.item.relatedResourceId)?.name;
                return (
                  <article className={`household-admin-card household-admin-card--${signal.severity}`} id={`household-admin-${signal.item.id}`} key={signal.item.id}>
                    <div className="household-admin-card__header">
                      <div>
                        <div className="event-detail__badges">
                          <Badge tone={toneFor(signal)}>{signal.label}</Badge>
                          <Badge tone="accent">{HOUSEHOLD_ADMIN_TYPE_LABELS[signal.item.adminType]}</Badge>
                          {signal.item.status !== "active" ? <Badge tone="neutral">{HOUSEHOLD_ADMIN_STATUS_LABELS[signal.item.status]}</Badge> : null}
                        </div>
                        <h3>{signal.item.title}</h3>
                      </div>
                      {signal.item.dueDate ? <small>{signal.item.dueDate}</small> : <small>No due date</small>}
                    </div>
                    <p>{signal.message}</p>
                    <div className="household-admin-card__meta">
                      <span>{HOUSEHOLD_ADMIN_CATEGORY_LABELS[signal.item.category]}</span>
                      {owner ? <span>Owner: {owner}</span> : null}
                      {signal.item.providerName ? <span>Provider: {signal.item.providerName}</span> : null}
                      {resource ? <span>Related: {resource}</span> : null}
                    </div>
                    <p className="household-admin-card__action-copy">{signal.suggestedAction}</p>
                    <div className="household-admin-card__actions">
                      <button onClick={() => { setEditingId(signal.item.id); setDraft({ title: signal.item.title, category: signal.item.category, adminType: signal.item.adminType, status: signal.item.status, dueDate: signal.item.dueDate, startDate: signal.item.startDate, lastCompletedDate: signal.item.lastCompletedDate, renewalCycle: signal.item.renewalCycle, customCycleMonths: signal.item.customCycleMonths, ownerMemberId: signal.item.ownerMemberId, relatedResourceId: signal.item.relatedResourceId, relatedPlaceId: signal.item.relatedPlaceId, providerName: signal.item.providerName, referenceLabel: signal.item.referenceLabel, costAmount: signal.item.costAmount, costCurrency: signal.item.costCurrency, reminderDaysBefore: signal.item.reminderDaysBefore, notes: signal.item.notes }); setSearchParams({ edit: signal.item.id }); }} type="button">Edit</button>
                      {signal.item.status !== "archived" && allowsBooked(signal) ? <button onClick={() => void runQuickAction(signal, "booked")} type="button">Mark booked</button> : null}
                      {signal.item.status !== "archived" ? <button onClick={() => void runQuickAction(signal, "completed")} type="button">Mark completed</button> : null}
                      {signal.item.status !== "archived" && allowsRenewed(signal) ? <button onClick={() => void runQuickAction(signal, "renewed")} type="button">Mark renewed</button> : null}
                      {signal.item.status !== "archived" ? <button onClick={() => void runQuickAction(signal, "archived")} type="button">Archive</button> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <Link className="back-link" to="/settings">Back to settings</Link>
    </div>
  );
}
