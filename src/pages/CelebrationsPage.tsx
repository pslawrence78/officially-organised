import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CelebrationReadinessBadge } from "../components/celebrations/CelebrationReadinessBadge";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { MemberSelector } from "../components/events/MemberSelector";
import { PageHeader } from "../components/layout/PageHeader";
import {
  CARD_STATUS_LABELS,
  CARD_STATUSES,
  CELEBRATION_OCCASION_LABELS,
  CELEBRATION_OCCASION_TYPES,
  CELEBRATION_RECURRENCE_LABELS,
  CELEBRATION_RECURRENCES,
  CELEBRATION_RELATIONSHIP_LABELS,
  CELEBRATION_RELATIONSHIP_CONTEXTS,
  CELEBRATION_STATUS_LABELS,
  CELEBRATION_STATUSES,
  GIFT_STATUS_LABELS,
  GIFT_STATUSES,
  RSVP_STATUS_LABELS,
  RSVP_STATUSES,
} from "../domain/constants";
import type {
  CelebrationOccasion,
  CelebrationOccasionInput,
  FamilyEvent,
  FamilyMember,
  GiftPlan,
  GiftPlanInput,
} from "../domain/types";
import {
  archiveCelebration,
  archiveGiftPlan,
  createCelebration,
  createGiftPlan,
  getEventById,
  getEvents,
  getFamilyMembers,
  getHousehold,
  listCelebrations,
  listGiftPlans,
  updateCelebration,
  updateGiftPlan,
} from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import {
  type CelebrationReadinessIssue,
  type CelebrationReadinessLevel,
  type CelebrationReadinessSummary,
  deriveCelebrationReadinessForRange,
} from "../services/celebrationReadinessService";
import { generateGiftPlanPrepTasks } from "../services/giftPlanPrepService";
import { addDaysToDateKey, currentDateKey, formatLongDate } from "../utils/dates";

interface CelebrationDraft {
  title: string;
  occasionType: CelebrationOccasion["occasionType"];
  date: string;
  recurrence: CelebrationOccasion["recurrence"];
  linkedEventId: string;
  linkedMemberId: string;
  recipientName: string;
  relationshipContext: CelebrationOccasion["relationshipContext"] | "";
  ownerAdultIds: string[];
  status: CelebrationOccasion["status"];
  notes: string;
}

interface GiftDraft {
  celebrationId: string;
  linkedEventId: string;
  recipientMemberId: string;
  recipientName: string;
  responsibleAdultId: GiftPlan["responsibleAdultId"] | "";
  giftSummary: string;
  giftStatus: GiftPlan["giftStatus"];
  cardStatus: GiftPlan["cardStatus"];
  rsvpStatus: GiftPlan["rsvpStatus"];
  targetDate: string;
  buyBy: string;
  wrapBy: string;
  takeBy: string;
  budgetNote: string;
  notes: string;
  draftCelebrationTitle: string;
  draftCelebrationDate: string;
  draftCelebrationType: CelebrationOccasion["occasionType"];
}

function eventOptionLabel(event: FamilyEvent) {
  return `${event.title} · ${formatLongDate(event.startAt.slice(0, 10))}`;
}

function findMemberName(members: FamilyMember[], memberId: string | undefined) {
  return members.find((member) => member.id === memberId)?.displayName;
}

function defaultCelebrationDraft(event: FamilyEvent | undefined, members: FamilyMember[]): CelebrationDraft {
  const linkedMemberId = event?.participants.find((id) => members.find((member) => member.id === id)?.memberType !== "adult") ?? "";
  return {
    title: event?.title ?? "",
    occasionType: event?.category === "birthday_party" ? "birthday_party" : event?.category === "school" ? "school" : "family_social",
    date: event?.startAt.slice(0, 10) ?? currentDateKey(),
    recurrence: "none",
    linkedEventId: event?.id ?? "",
    linkedMemberId,
    recipientName: findMemberName(members, linkedMemberId) ?? "",
    relationshipContext: "",
    ownerAdultIds: [],
    status: "planned",
    notes: "",
  };
}

function defaultGiftDraft(event: FamilyEvent | undefined, members: FamilyMember[]): GiftDraft {
  const recipientMemberId = event?.participants.find((id) => members.find((member) => member.id === id)?.memberType !== "adult") ?? "";
  const defaultDate = event?.startAt.slice(0, 10) ?? currentDateKey();
  return {
    celebrationId: "",
    linkedEventId: event?.id ?? "",
    recipientMemberId,
    recipientName: findMemberName(members, recipientMemberId) ?? "",
    responsibleAdultId: "",
    giftSummary: "",
    giftStatus: "idea",
    cardStatus: event?.category === "birthday_party" ? "to_buy" : "not_needed",
    rsvpStatus: event?.category === "birthday_party" ? "to_reply" : "not_needed",
    targetDate: defaultDate,
    buyBy: "",
    wrapBy: "",
    takeBy: "",
    budgetNote: "",
    notes: "",
    draftCelebrationTitle: event?.title ?? "",
    draftCelebrationDate: defaultDate,
    draftCelebrationType: event?.category === "birthday_party" ? "birthday_party" : event?.category === "school" ? "school" : "family_social",
  };
}

function celebrationToDraft(item: CelebrationOccasion): CelebrationDraft {
  return {
    title: item.title,
    occasionType: item.occasionType,
    date: item.date,
    recurrence: item.recurrence,
    linkedEventId: item.linkedEventId ?? "",
    linkedMemberId: item.linkedMemberId ?? "",
    recipientName: item.recipientName ?? "",
    relationshipContext: item.relationshipContext ?? "",
    ownerAdultIds: item.ownerAdultIds,
    status: item.status,
    notes: item.notes ?? "",
  };
}

function giftToDraft(item: GiftPlan, celebration?: CelebrationOccasion): GiftDraft {
  return {
    celebrationId: item.celebrationId,
    linkedEventId: item.linkedEventId ?? "",
    recipientMemberId: item.recipientMemberId ?? "",
    recipientName: item.recipientName,
    responsibleAdultId: item.responsibleAdultId ?? "",
    giftSummary: item.giftSummary ?? "",
    giftStatus: item.giftStatus,
    cardStatus: item.cardStatus,
    rsvpStatus: item.rsvpStatus,
    targetDate: item.targetDate ?? celebration?.date ?? "",
    buyBy: item.buyBy ?? "",
    wrapBy: item.wrapBy ?? "",
    takeBy: item.takeBy ?? "",
    budgetNote: item.budgetNote ?? "",
    notes: item.notes ?? "",
    draftCelebrationTitle: celebration?.title ?? "",
    draftCelebrationDate: celebration?.date ?? "",
    draftCelebrationType: celebration?.occasionType ?? "family_social",
  };
}

function topIssue(item: { issues: CelebrationReadinessIssue[] }) {
  return item.issues[0];
}

function readinessCounts(summaries: CelebrationReadinessSummary[]) {
  return {
    ready: summaries.filter((summary) => summary.level === "ready").length,
    onTrack: summaries.filter((summary) => summary.level === "on_track").length,
    needsAttention: summaries.filter((summary) => summary.level === "needs_attention").length,
    atRisk: summaries.filter((summary) => summary.level === "at_risk" || summary.level === "overdue").length,
  };
}

function readinessSummaryCopy(summary: CelebrationReadinessSummary) {
  const issue = topIssue(summary);
  if (issue) return issue.message;
  if (summary.giftPlanCount === 0) return "No gift plans yet for this occasion.";
  if (summary.openPrepTaskCount) return `${summary.openPrepTaskCount} celebration prep task${summary.openPrepTaskCount === 1 ? "" : "s"} still open.`;
  if (summary.giftPlanCount && summary.readyGiftPlanCount === summary.giftPlanCount) return "Ready for the day.";
  if (summary.giftPlanCount) return `${summary.giftPlanCount} gift plan${summary.giftPlanCount === 1 ? "" : "s"} in place.`;
  return "Everything currently looks ready.";
}

function planReadinessCopy(planSummary: {
  issues: CelebrationReadinessIssue[];
  prepTaskCount: number;
  openPrepTaskCount: number;
  level: CelebrationReadinessLevel;
}) {
  const issue = topIssue(planSummary);
  if (issue) return issue.message;
  if (planSummary.prepTaskCount) return planSummary.openPrepTaskCount ? `${planSummary.openPrepTaskCount} linked prep task${planSummary.openPrepTaskCount === 1 ? "" : "s"} still open.` : "Wrapped and ready.";
  if (planSummary.level === "ready") return "Wrapped and ready.";
  return "Partly ready.";
}

export function CelebrationsPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [celebrationError, setCelebrationError] = useState("");
  const [giftError, setGiftError] = useState("");
  const [editingCelebrationId, setEditingCelebrationId] = useState<string | null>(null);
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [savingCelebration, setSavingCelebration] = useState(false);
  const [savingGift, setSavingGift] = useState(false);
  const state = useRepositoryQuery(async () => {
    const [celebrations, giftPlans, familyMembers, household, events, linkedEvent] = await Promise.all([
      listCelebrations(),
      listGiftPlans(),
      getFamilyMembers(),
      getHousehold(),
      getEvents(),
      eventId ? getEventById(eventId) : Promise.resolve(undefined),
    ]);
    const mergedEvents = [...events];
    if (linkedEvent && !mergedEvents.some((item) => item.id === linkedEvent.id)) mergedEvents.unshift(linkedEvent);
    return { celebrations, giftPlans, familyMembers, household, events: mergedEvents, linkedEvent };
  }, [eventId, refreshVersion]);

  const [celebrationDraft, setCelebrationDraft] = useState<CelebrationDraft | null>(null);
  const [giftDraft, setGiftDraft] = useState<GiftDraft | null>(null);

  useEffect(() => {
    if (!state.data || celebrationDraft || giftDraft) return;
    setCelebrationDraft(defaultCelebrationDraft(state.data.linkedEvent, state.data.familyMembers));
    setGiftDraft(defaultGiftDraft(state.data.linkedEvent, state.data.familyMembers));
  }, [state.data, celebrationDraft, giftDraft]);

  const celebrationById = useMemo(() => new Map((state.data?.celebrations ?? []).map((item) => [item.id, item])), [state.data?.celebrations]);
  const eventById = useMemo(() => new Map((state.data?.events ?? []).map((item) => [item.id, item])), [state.data?.events]);
  const adults = state.data?.familyMembers.filter((member) => member.memberType === "adult") ?? [];
  const today = currentDateKey();
  const upcomingTo = addDaysToDateKey(today, 90);
  const readiness = useMemo(() => state.data
    ? deriveCelebrationReadinessForRange({
      occasions: state.data.celebrations,
      giftPlans: state.data.giftPlans,
      events: state.data.events,
      now: new Date(),
      startDate: today,
      endDate: upcomingTo,
      includeOutsideRangeWithOverdue: true,
    })
    : [], [state.data, today, upcomingTo]);
  const overview = readinessCounts(readiness.filter((summary) => summary.level !== "not_applicable"));
  const attentionItems = useMemo(() => readiness
    .filter((summary) => ["needs_attention", "at_risk", "overdue"].includes(summary.level))
    .map((summary) => ({ summary, issue: topIssue(summary) }))
    .filter((item): item is { summary: CelebrationReadinessSummary; issue: CelebrationReadinessIssue } => Boolean(item.issue))
    .sort((left, right) => {
      const severity = (left.issue.severity === "critical" ? 0 : left.issue.severity === "warning" ? 1 : 2)
        - (right.issue.severity === "critical" ? 0 : right.issue.severity === "warning" ? 1 : 2);
      if (severity !== 0) return severity;
      return (left.issue.dueAt ?? "9999-12-31T23:59:59.999Z").localeCompare(right.issue.dueAt ?? "9999-12-31T23:59:59.999Z");
    })
    .slice(0, 5), [readiness]);
  const upcoming = readiness.filter((summary) => summary.level !== "not_applicable");
  const visibleGiftPlans = useMemo(() => upcoming
    .flatMap((summary) => summary.giftPlans.map((planSummary) => ({
      planSummary,
      celebrationSummary: summary,
      plan: state.data?.giftPlans.find((item) => item.id === planSummary.giftPlanId),
    })))
    .filter((item): item is {
      planSummary: CelebrationReadinessSummary["giftPlans"][number];
      celebrationSummary: CelebrationReadinessSummary;
      plan: GiftPlan;
    } => Boolean(item.plan) && item.planSummary.level !== "ready" && item.planSummary.level !== "not_applicable")
    .sort((left, right) =>
      (left.planSummary.level === right.planSummary.level ? 0 : ["overdue", "at_risk", "needs_attention", "on_track", "ready", "not_applicable"].indexOf(left.planSummary.level) - ["overdue", "at_risk", "needs_attention", "on_track", "ready", "not_applicable"].indexOf(right.planSummary.level))
      || (left.planSummary.daysUntil ?? 9999) - (right.planSummary.daysUntil ?? 9999)
      || left.plan.recipientName.localeCompare(right.plan.recipientName),
    ), [state.data?.giftPlans, upcoming]);
  const archivedCelebrations = (state.data?.celebrations ?? []).filter((item) => item.status === "archived");
  const archivedGiftPlans = (state.data?.giftPlans ?? []).filter((item) => item.archived);

  const resetDrafts = () => {
    if (!state.data) return;
    setEditingCelebrationId(null);
    setEditingGiftId(null);
    setCelebrationDraft(defaultCelebrationDraft(state.data.linkedEvent, state.data.familyMembers));
    setGiftDraft(defaultGiftDraft(state.data.linkedEvent, state.data.familyMembers));
    setCelebrationError("");
    setGiftError("");
  };

  const saveCelebration = async () => {
    if (!state.data || !celebrationDraft) return;
    setSavingCelebration(true);
    setCelebrationError("");
    try {
      const input: CelebrationOccasionInput = {
        householdId: state.data.household?.id ?? "household_lawrence",
        title: celebrationDraft.title,
        occasionType: celebrationDraft.occasionType,
        date: celebrationDraft.date,
        recurrence: celebrationDraft.recurrence,
        linkedEventId: celebrationDraft.linkedEventId || undefined,
        linkedMemberId: celebrationDraft.linkedMemberId || undefined,
        recipientName: celebrationDraft.recipientName || undefined,
        relationshipContext: celebrationDraft.relationshipContext || undefined,
        ownerAdultIds: celebrationDraft.ownerAdultIds,
        status: celebrationDraft.status,
        notes: celebrationDraft.notes || undefined,
      };
      const saved = editingCelebrationId ? await updateCelebration(editingCelebrationId, input) : await createCelebration(input);
      setMessage(editingCelebrationId ? "Celebration updated." : "Celebration created.");
      setEditingCelebrationId(saved.id);
      setRefreshVersion((value) => value + 1);
    } catch (error) {
      setCelebrationError(error instanceof Error ? error.message : "Celebration could not be saved.");
    } finally {
      setSavingCelebration(false);
    }
  };

  const saveGiftPlan = async () => {
    if (!state.data || !giftDraft) return;
    setSavingGift(true);
    setGiftError("");
    try {
      let celebrationId = giftDraft.celebrationId;
      if (!celebrationId) {
        const createdCelebration = await createCelebration({
          householdId: state.data.household?.id ?? "household_lawrence",
          title: giftDraft.draftCelebrationTitle,
          occasionType: giftDraft.draftCelebrationType,
          date: giftDraft.draftCelebrationDate,
          recurrence: "none",
          linkedEventId: giftDraft.linkedEventId || undefined,
          linkedMemberId: giftDraft.recipientMemberId || undefined,
          recipientName: giftDraft.recipientName || undefined,
          relationshipContext: undefined,
          ownerAdultIds: giftDraft.responsibleAdultId ? [giftDraft.responsibleAdultId] : [],
          status: "planned",
          notes: undefined,
        });
        celebrationId = createdCelebration.id;
      }
      const existingPlan = state.data.giftPlans.find((item) => item.id === editingGiftId);
      const input: GiftPlanInput = {
        celebrationId,
        linkedEventId: giftDraft.linkedEventId || undefined,
        recipientMemberId: giftDraft.recipientMemberId || undefined,
        recipientName: giftDraft.recipientName,
        responsibleAdultId: giftDraft.responsibleAdultId || undefined,
        giftSummary: giftDraft.giftSummary || undefined,
        giftStatus: giftDraft.giftStatus,
        cardStatus: giftDraft.cardStatus,
        rsvpStatus: giftDraft.rsvpStatus,
        targetDate: giftDraft.targetDate || undefined,
        buyBy: giftDraft.buyBy || undefined,
        wrapBy: giftDraft.wrapBy || undefined,
        takeBy: giftDraft.takeBy || undefined,
        budgetNote: giftDraft.budgetNote || undefined,
        linkedPrepTaskIds: existingPlan?.linkedPrepTaskIds ?? [],
        notes: giftDraft.notes || undefined,
        archived: existingPlan?.archived ?? false,
      };
      const saved = editingGiftId ? await updateGiftPlan(editingGiftId, input) : await createGiftPlan(input);
      setMessage(editingGiftId ? "Gift plan updated." : "Gift plan created.");
      setEditingGiftId(saved.id);
      setRefreshVersion((value) => value + 1);
    } catch (error) {
      setGiftError(error instanceof Error ? error.message : "Gift plan could not be saved.");
    } finally {
      setSavingGift(false);
    }
  };

  const generateTasks = async (giftPlanId: string) => {
    setGiftError("");
    try {
      await generateGiftPlanPrepTasks(giftPlanId);
      setMessage("Prep tasks generated or refreshed.");
      setRefreshVersion((value) => value + 1);
    } catch (error) {
      setGiftError(error instanceof Error ? error.message : "Prep tasks could not be generated.");
    }
  };

  if (state.loading && !state.data) return <LoadingState label="Opening gifts and celebrations..." />;
  if (state.error) return <ErrorState />;
  if (!state.data || !celebrationDraft || !giftDraft) return null;

  return (
    <div className="page-stack page-stack--form">
      <PageHeader eyebrow="Secondary operational module" title="Gifts & Celebrations">
        Keep birthdays, Christmas plans and family gift prep in one calm place, then let the practical tasks flow into the rest of the app.
      </PageHeader>

      {state.data.linkedEvent ? (
        <div className="notice notice--success">
          <strong>Linked from event</strong>
          <span>{state.data.linkedEvent.title} is already linked so you can add the practical gift prep without retyping.</span>
        </div>
      ) : null}
      {message ? <div className="notice notice--success" role="status"><strong>Saved</strong><span>{message}</span></div> : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Readiness overview</p>
            <h2>{upcoming.length ? `${upcoming.length} celebration${upcoming.length === 1 ? "" : "s"} in the next 90 days` : "No upcoming celebrations yet"}</h2>
          </div>
        </div>
        {upcoming.length ? <div className="celebration-readiness-grid" aria-label="Celebration readiness overview">
          <article className="celebration-readiness-stat"><strong>{overview.ready}</strong><span>Ready</span></article>
          <article className="celebration-readiness-stat"><strong>{overview.onTrack}</strong><span>Partly ready</span></article>
          <article className="celebration-readiness-stat celebration-readiness-stat--warning"><strong>{overview.needsAttention}</strong><span>Needs attention</span></article>
          <article className="celebration-readiness-stat celebration-readiness-stat--critical"><strong>{overview.atRisk}</strong><span>At risk or overdue</span></article>
        </div> : <p className="section-empty-copy">Add birthdays, Christmas plans or family occasions when you are ready.</p>}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Needs attention</p>
            <h2>{attentionItems.length ? "Start with the most urgent celebration prep" : "Nothing urgent for celebrations"}</h2>
          </div>
        </div>
        {attentionItems.length ? <div className="celebration-issue-list">{attentionItems.map(({ summary, issue }) => (
          <article className={`celebration-issue-card celebration-issue-card--${issue.severity}`} key={issue.id}>
            <div className="celebration-issue-card__top">
              <div className="event-detail__badges">
                <CelebrationReadinessBadge level={summary.level} />
                <Badge tone="accent">{summary.occasionTitle}</Badge>
              </div>
              {summary.occasionDate ? <small>{formatLongDate(summary.occasionDate)}</small> : null}
            </div>
            <strong>{issue.message}</strong>
            {issue.suggestedAction ? <p>{issue.suggestedAction}</p> : null}
          </article>
        ))}</div> : <p className="section-empty-copy">Everything currently looks ready.</p>}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Upcoming celebrations</p>
            <h2>{upcoming.length ? `${upcoming.length} active occasion${upcoming.length === 1 ? "" : "s"}` : "No celebrations added yet"}</h2>
          </div>
        </div>
        {upcoming.length ? upcoming.map((summary) => {
          const item = celebrationById.get(summary.occasionId);
          if (!item) return null;
          return (
            <article className="section-block celebration-card" key={item.id}>
              <div className="celebration-card__header">
                <div>
                  <div className="event-detail__badges">
                    <Badge tone="accent">{CELEBRATION_OCCASION_LABELS[item.occasionType]}</Badge>
                    <CelebrationReadinessBadge level={summary.level} />
                    <Badge tone="neutral">{CELEBRATION_STATUS_LABELS[item.status]}</Badge>
                    <Badge tone="neutral">{CELEBRATION_RECURRENCE_LABELS[item.recurrence]}</Badge>
                  </div>
                  <h3>{item.title}</h3>
                </div>
                <small>{summary.occasionDate ? formatLongDate(summary.occasionDate) : "Date still needed"}</small>
              </div>
              <p className="supporting-copy">{item.linkedEventId ? `Linked event: ${eventById.get(item.linkedEventId)?.title ?? "Unavailable"}` : "No linked event yet"}</p>
              <p className="celebration-readiness-copy">{readinessSummaryCopy(summary)}</p>
              <div className="detail-actions">
                <button className="button button--secondary" onClick={() => { setEditingCelebrationId(item.id); setCelebrationDraft(celebrationToDraft(item)); }} type="button"><Icon name="edit" /> Edit</button>
                <button className="button button--secondary" onClick={() => { setEditingGiftId(null); setGiftDraft((current) => current ? { ...current, celebrationId: item.id, draftCelebrationTitle: item.title, draftCelebrationDate: item.date, draftCelebrationType: item.occasionType } : current); }} type="button"><Icon name="plus" /> Add gift plan</button>
                <button className="button button--secondary" onClick={() => void archiveCelebration(item.id).then(() => setRefreshVersion((value) => value + 1))} type="button"><Icon name="trash" /> Archive</button>
              </div>
            </article>
          );
        }) : <p className="section-empty-copy">Add birthdays, Christmas plans or family occasions when you are ready.</p>}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gift plans</p>
            <h2>{visibleGiftPlans.length ? `${visibleGiftPlans.length} open plan${visibleGiftPlans.length === 1 ? "" : "s"}` : "No gift plans needing attention"}</h2>
          </div>
        </div>
        {visibleGiftPlans.length ? visibleGiftPlans.map(({ plan, planSummary, celebrationSummary }) => {
          const celebration = celebrationById.get(plan.celebrationId);
          const linkedEvent = plan.linkedEventId ? eventById.get(plan.linkedEventId) : undefined;
          return (
            <article className="section-block gift-plan-card" key={plan.id}>
              <div className="gift-plan-card__header">
                <div>
                  <div className="event-detail__badges">
                    <CelebrationReadinessBadge level={planSummary.level} />
                    <Badge tone="accent">{celebrationSummary.occasionTitle}</Badge>
                    <Badge tone="neutral">Present {GIFT_STATUS_LABELS[plan.giftStatus]}</Badge>
                    <Badge tone="neutral">Card {CARD_STATUS_LABELS[plan.cardStatus]}</Badge>
                    <Badge tone="neutral">RSVP {RSVP_STATUS_LABELS[plan.rsvpStatus]}</Badge>
                  </div>
                  <h3>{plan.recipientName}</h3>
                </div>
                {plan.targetDate ? <small>{formatLongDate(plan.targetDate)}</small> : null}
              </div>
              <p className="supporting-copy">{linkedEvent ? `Linked event: ${linkedEvent.title}` : plan.linkedEventId ? "Linked event unavailable" : "No event linked yet"}</p>
              <p className="celebration-readiness-copy">{planReadinessCopy(planSummary)}</p>
              <div className="detail-actions">
                <button className="button button--secondary" onClick={() => { setEditingGiftId(plan.id); setGiftDraft(giftToDraft(plan, celebration)); }} type="button"><Icon name="edit" /> Edit</button>
                <button className="button button--secondary" onClick={() => void generateTasks(plan.id)} type="button"><Icon name="prep" /> Refresh prep tasks</button>
                <button className="button button--secondary" onClick={() => void archiveGiftPlan(plan.id).then(() => setRefreshVersion((value) => value + 1))} type="button"><Icon name="trash" /> Archive</button>
              </div>
            </article>
          );
        }) : <p className="section-empty-copy">Everything currently looks ready.</p>}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Completed and archived</p>
            <h2>{archivedCelebrations.length + archivedGiftPlans.length}</h2>
          </div>
        </div>
        {archivedCelebrations.length || archivedGiftPlans.length ? (
          <>
            {archivedCelebrations.map((item) => <p className="supporting-copy" key={item.id}>{item.title} · archived celebration</p>)}
            {archivedGiftPlans.map((item) => <p className="supporting-copy" key={item.id}>{item.recipientName} · archived gift plan</p>)}
          </>
        ) : <p className="section-empty-copy">Completed or archived items will appear here when you need to look back.</p>}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{editingCelebrationId ? "Edit occasion" : "New occasion"}</p>
            <h2>{editingCelebrationId ? "Celebration occasion" : "Add celebration occasion"}</h2>
          </div>
        </div>
        {celebrationError ? <div className="notice notice--error" role="alert"><strong>Could not save</strong><span>{celebrationError}</span></div> : null}
        <form className="data-form" onSubmit={(event) => { event.preventDefault(); void saveCelebration(); }}>
          <label className="form-field"><span>Occasion title</span><input onChange={(event) => setCelebrationDraft({ ...celebrationDraft, title: event.target.value })} value={celebrationDraft.title} /></label>
          <div className="form-grid">
            <label className="form-field"><span>Occasion type</span><select onChange={(event) => setCelebrationDraft({ ...celebrationDraft, occasionType: event.target.value as CelebrationOccasion["occasionType"] })} value={celebrationDraft.occasionType}>{CELEBRATION_OCCASION_TYPES.map((value) => <option key={value} value={value}>{CELEBRATION_OCCASION_LABELS[value]}</option>)}</select></label>
            <label className="form-field"><span>Date</span><input onChange={(event) => setCelebrationDraft({ ...celebrationDraft, date: event.target.value })} type="date" value={celebrationDraft.date} /></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Recurrence</span><select onChange={(event) => setCelebrationDraft({ ...celebrationDraft, recurrence: event.target.value as CelebrationOccasion["recurrence"] })} value={celebrationDraft.recurrence}>{CELEBRATION_RECURRENCES.map((value) => <option key={value} value={value}>{CELEBRATION_RECURRENCE_LABELS[value]}</option>)}</select></label>
            <label className="form-field"><span>Status</span><select onChange={(event) => setCelebrationDraft({ ...celebrationDraft, status: event.target.value as CelebrationOccasion["status"] })} value={celebrationDraft.status}>{CELEBRATION_STATUSES.map((value) => <option key={value} value={value}>{CELEBRATION_STATUS_LABELS[value]}</option>)}</select></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Linked event</span><select onChange={(event) => setCelebrationDraft({ ...celebrationDraft, linkedEventId: event.target.value })} value={celebrationDraft.linkedEventId}><option value="">No event linked</option>{state.data.events.map((event) => <option key={event.id} value={event.id}>{eventOptionLabel(event)}</option>)}</select></label>
            <label className="form-field"><span>Recipient family member</span><select onChange={(event) => setCelebrationDraft({ ...celebrationDraft, linkedMemberId: event.target.value })} value={celebrationDraft.linkedMemberId}><option value="">Not a family member</option>{state.data.familyMembers.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}</select></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Recipient name</span><input onChange={(event) => setCelebrationDraft({ ...celebrationDraft, recipientName: event.target.value })} value={celebrationDraft.recipientName} /></label>
            <label className="form-field"><span>Relationship</span><select onChange={(event) => setCelebrationDraft({ ...celebrationDraft, relationshipContext: event.target.value as CelebrationDraft["relationshipContext"] })} value={celebrationDraft.relationshipContext}><option value="">No context</option>{CELEBRATION_RELATIONSHIP_CONTEXTS.map((value) => <option key={value} value={value}>{CELEBRATION_RELATIONSHIP_LABELS[value]}</option>)}</select></label>
          </div>
          <MemberSelector label="Responsible adult" members={adults} onChange={(ownerAdultIds) => setCelebrationDraft({ ...celebrationDraft, ownerAdultIds })} selectedIds={celebrationDraft.ownerAdultIds} />
          <label className="form-field"><span>Practical notes</span><textarea onChange={(event) => setCelebrationDraft({ ...celebrationDraft, notes: event.target.value })} rows={3} value={celebrationDraft.notes} /></label>
          <div className="form-actions">
            <button className="button button--secondary" onClick={resetDrafts} type="button">Clear</button>
            <button className="button button--primary" disabled={savingCelebration} type="submit">{savingCelebration ? "Saving..." : editingCelebrationId ? "Save celebration" : "Create celebration"}</button>
          </div>
        </form>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{editingGiftId ? "Edit gift plan" : "New gift plan"}</p>
            <h2>{editingGiftId ? "Gift plan" : "Add gift plan"}</h2>
          </div>
        </div>
        {giftError ? <div className="notice notice--error" role="alert"><strong>Could not save</strong><span>{giftError}</span></div> : null}
        <form className="data-form" onSubmit={(event) => { event.preventDefault(); void saveGiftPlan(); }}>
          <label className="form-field"><span>Occasion</span><select onChange={(event) => setGiftDraft({ ...giftDraft, celebrationId: event.target.value })} value={giftDraft.celebrationId}><option value="">Create a new occasion with this plan</option>{state.data.celebrations.filter((item) => item.status !== "archived").map((item) => <option key={item.id} value={item.id}>{item.title} · {formatLongDate(item.date)}</option>)}</select></label>
          {!giftDraft.celebrationId ? (
            <div className="form-grid">
              <label className="form-field"><span>New occasion title</span><input onChange={(event) => setGiftDraft({ ...giftDraft, draftCelebrationTitle: event.target.value })} value={giftDraft.draftCelebrationTitle} /></label>
              <label className="form-field"><span>Occasion date</span><input onChange={(event) => setGiftDraft({ ...giftDraft, draftCelebrationDate: event.target.value })} type="date" value={giftDraft.draftCelebrationDate} /></label>
              <label className="form-field"><span>Occasion type</span><select onChange={(event) => setGiftDraft({ ...giftDraft, draftCelebrationType: event.target.value as CelebrationOccasion["occasionType"] })} value={giftDraft.draftCelebrationType}>{CELEBRATION_OCCASION_TYPES.map((value) => <option key={value} value={value}>{CELEBRATION_OCCASION_LABELS[value]}</option>)}</select></label>
            </div>
          ) : null}
          <div className="form-grid">
            <label className="form-field"><span>Recipient family member</span><select onChange={(event) => { const recipientMemberId = event.target.value; setGiftDraft({ ...giftDraft, recipientMemberId, recipientName: recipientMemberId ? (findMemberName(state.data!.familyMembers, recipientMemberId) ?? giftDraft.recipientName) : giftDraft.recipientName }); }} value={giftDraft.recipientMemberId}><option value="">Not a family member</option>{state.data.familyMembers.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}</select></label>
            <label className="form-field"><span>Recipient name</span><input onChange={(event) => setGiftDraft({ ...giftDraft, recipientName: event.target.value })} value={giftDraft.recipientName} /></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Linked event</span><select onChange={(event) => setGiftDraft({ ...giftDraft, linkedEventId: event.target.value })} value={giftDraft.linkedEventId}><option value="">No event linked</option>{state.data.events.map((event) => <option key={event.id} value={event.id}>{eventOptionLabel(event)}</option>)}</select></label>
            <label className="form-field"><span>Responsible adult</span><select onChange={(event) => setGiftDraft({ ...giftDraft, responsibleAdultId: event.target.value as GiftDraft["responsibleAdultId"] })} value={giftDraft.responsibleAdultId}><option value="">Unassigned</option>{adults.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}</select></label>
          </div>
          <label className="form-field"><span>Gift summary</span><input onChange={(event) => setGiftDraft({ ...giftDraft, giftSummary: event.target.value })} placeholder="e.g. Lego set, book, voucher" value={giftDraft.giftSummary} /></label>
          <div className="form-grid">
            <label className="form-field"><span>Gift status</span><select onChange={(event) => setGiftDraft({ ...giftDraft, giftStatus: event.target.value as GiftPlan["giftStatus"] })} value={giftDraft.giftStatus}>{GIFT_STATUSES.map((value) => <option key={value} value={value}>{GIFT_STATUS_LABELS[value]}</option>)}</select></label>
            <label className="form-field"><span>Card status</span><select onChange={(event) => setGiftDraft({ ...giftDraft, cardStatus: event.target.value as GiftPlan["cardStatus"] })} value={giftDraft.cardStatus}>{CARD_STATUSES.map((value) => <option key={value} value={value}>{CARD_STATUS_LABELS[value]}</option>)}</select></label>
            <label className="form-field"><span>RSVP status</span><select onChange={(event) => setGiftDraft({ ...giftDraft, rsvpStatus: event.target.value as GiftPlan["rsvpStatus"] })} value={giftDraft.rsvpStatus}>{RSVP_STATUSES.map((value) => <option key={value} value={value}>{RSVP_STATUS_LABELS[value]}</option>)}</select></label>
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Occasion date</span><input onChange={(event) => setGiftDraft({ ...giftDraft, targetDate: event.target.value })} type="date" value={giftDraft.targetDate} /></label>
            <label className="form-field"><span>Buy by</span><input onChange={(event) => setGiftDraft({ ...giftDraft, buyBy: event.target.value })} type="date" value={giftDraft.buyBy} /></label>
            <label className="form-field"><span>Wrap by</span><input onChange={(event) => setGiftDraft({ ...giftDraft, wrapBy: event.target.value })} type="date" value={giftDraft.wrapBy} /></label>
            <label className="form-field"><span>Take by</span><input onChange={(event) => setGiftDraft({ ...giftDraft, takeBy: event.target.value })} type="date" value={giftDraft.takeBy} /></label>
          </div>
          <label className="form-field"><span>Budget note</span><input onChange={(event) => setGiftDraft({ ...giftDraft, budgetNote: event.target.value })} placeholder="Short note only" value={giftDraft.budgetNote} /></label>
          <label className="form-field"><span>Practical notes</span><textarea onChange={(event) => setGiftDraft({ ...giftDraft, notes: event.target.value })} rows={3} value={giftDraft.notes} /></label>
          <div className="form-actions">
            <button className="button button--secondary" onClick={resetDrafts} type="button">Clear</button>
            {editingGiftId ? <button className="button button--secondary" onClick={() => void generateTasks(editingGiftId)} type="button"><Icon name="prep" /> Refresh prep tasks</button> : null}
            <button className="button button--primary" disabled={savingGift} type="submit">{savingGift ? "Saving..." : editingGiftId ? "Save gift plan" : "Create gift plan"}</button>
          </div>
        </form>
      </section>

      <Link className="back-link" to="/settings">Back to settings</Link>
    </div>
  );
}
