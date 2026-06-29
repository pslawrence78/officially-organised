import type { CelebrationOccasion, FamilyEvent, GiftPlan, PrepTask } from "../domain/types";
import { addDaysToDateKey, currentDateKey, isoToDateKey } from "../utils/dates";
import { validDateKey } from "../utils/celebrations";
import { isPrepTaskOverdue } from "../utils/prepTasks";

export type CelebrationReadinessLevel =
  | "ready"
  | "on_track"
  | "needs_attention"
  | "at_risk"
  | "overdue"
  | "not_applicable";

export type CelebrationReadinessSeverity = "info" | "warning" | "critical";

export type CelebrationReadinessIssueCode =
  | "occasion_date_missing"
  | "gift_plan_missing"
  | "gift_not_chosen"
  | "gift_not_purchased"
  | "gift_not_wrapped"
  | "gift_not_delivered"
  | "card_not_written"
  | "prep_task_overdue"
  | "prep_task_due_soon"
  | "deadline_today"
  | "deadline_tomorrow"
  | "occasion_imminent";

export interface CelebrationReadinessIssue {
  id: string;
  severity: CelebrationReadinessSeverity;
  code: CelebrationReadinessIssueCode;
  message: string;
  suggestedAction?: string;
  dueAt?: string;
  relatedOccasionId?: string;
  relatedGiftPlanId?: string;
  relatedPrepTaskId?: string;
}

export interface GiftPlanReadinessSummary {
  giftPlanId: string;
  celebrationId: string;
  recipientName: string;
  targetDate?: string;
  daysUntil?: number;
  level: CelebrationReadinessLevel;
  score: number;
  issues: CelebrationReadinessIssue[];
  prepTaskCount: number;
  openPrepTaskCount: number;
  overduePrepTaskCount: number;
  dueSoonPrepTaskCount: number;
}

export interface CelebrationReadinessSummary {
  occasionId: string;
  occasionTitle: string;
  occasionDate?: string;
  daysUntil?: number;
  level: CelebrationReadinessLevel;
  score: number;
  issues: CelebrationReadinessIssue[];
  openPrepTaskCount: number;
  overduePrepTaskCount: number;
  criticalPrepTaskCount: number;
  giftPlanCount: number;
  readyGiftPlanCount: number;
  giftPlans: GiftPlanReadinessSummary[];
}

export interface CelebrationReadinessInput {
  occasion: CelebrationOccasion;
  giftPlans: GiftPlan[];
  events: FamilyEvent[];
  now?: Date;
}

export interface CelebrationReadinessRangeInput {
  occasions: CelebrationOccasion[];
  giftPlans: GiftPlan[];
  events: FamilyEvent[];
  now?: Date;
  startDate?: string;
  endDate?: string;
  includeOutsideRangeWithOverdue?: boolean;
}

export const CELEBRATION_READYNESS_LEVEL_LABELS: Record<CelebrationReadinessLevel, string> = {
  ready: "Ready",
  on_track: "Partly ready",
  needs_attention: "Needs attention",
  at_risk: "At risk",
  overdue: "Overdue",
  not_applicable: "Not applicable",
};

const GIFT_EXPECTED_OCCASION_TYPES = new Set<CelebrationOccasion["occasionType"]>([
  "birthday",
  "birthday_party",
  "thank_you",
]);

const GENERATED_GIFT_TASK_NOTE = "Generated from Gifts & Celebrations.";

type LevelSignal = "none" | "info" | "warning" | "critical" | "overdue";
type GeneratedTaskKind =
  | "buy_present"
  | "buy_card"
  | "write_card"
  | "wrap_present"
  | "take_items"
  | "rsvp";

function dateKeyAsUtc(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysUntilDate(targetDate: string, today: string) {
  return Math.round((dateKeyAsUtc(targetDate) - dateKeyAsUtc(today)) / 86_400_000);
}

function levelScore(level: CelebrationReadinessLevel) {
  if (level === "ready") return 100;
  if (level === "on_track") return 85;
  if (level === "needs_attention") return 65;
  if (level === "at_risk") return 35;
  if (level === "overdue") return 0;
  return 100;
}

function levelPriority(level: CelebrationReadinessLevel) {
  if (level === "overdue") return 0;
  if (level === "at_risk") return 1;
  if (level === "needs_attention") return 2;
  if (level === "on_track") return 3;
  if (level === "ready") return 4;
  return 5;
}

function signalPriority(signal: LevelSignal) {
  if (signal === "overdue") return 0;
  if (signal === "critical") return 1;
  if (signal === "warning") return 2;
  if (signal === "info") return 3;
  return 4;
}

function maxSignal(left: LevelSignal, right: LevelSignal): LevelSignal {
  return signalPriority(left) <= signalPriority(right) ? left : right;
}

function severityPriority(severity: CelebrationReadinessSeverity) {
  return severity === "critical" ? 0 : severity === "warning" ? 1 : 2;
}

function activeOccasion(occasion: CelebrationOccasion) {
  return occasion.status === "planned" || occasion.status === "active";
}

function generatedTaskKindForPlan(plan: GiftPlan, task: PrepTask): GeneratedTaskKind | undefined {
  const prefix = `prep_${plan.id}_`;
  return task.id.startsWith(prefix) ? task.id.slice(prefix.length) as GeneratedTaskKind : undefined;
}

function isRelatedGiftTask(plan: GiftPlan, task: PrepTask) {
  return Boolean(generatedTaskKindForPlan(plan, task))
    || Boolean(plan.linkedPrepTaskIds?.includes(task.id));
}

export function isCelebrationGeneratedPrepTask(task: PrepTask) {
  return task.notes === GENERATED_GIFT_TASK_NOTE || /^prep_gift_/.test(task.id);
}

function dedupeTasks(tasks: Array<{ eventId: string; task: PrepTask }>) {
  const seen = new Set<string>();
  return tasks.filter(({ eventId, task }) => {
    const key = `${eventId}:${task.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectGiftPlanTasks(plan: GiftPlan, occasion: CelebrationOccasion, eventById: Map<string, FamilyEvent>) {
  const event = eventById.get(plan.linkedEventId ?? occasion.linkedEventId ?? "");
  if (!event) return [];
  return dedupeTasks(
    event.prepTasks
      .filter((task) => isRelatedGiftTask(plan, task))
      .map((task) => ({ eventId: event.id, task })),
  );
}

function collectCelebrationTasks(occasion: CelebrationOccasion, plans: GiftPlan[], eventById: Map<string, FamilyEvent>) {
  const tasks: Array<{ eventId: string; task: PrepTask }> = [];
  const linkedEvent = eventById.get(occasion.linkedEventId ?? "");
  if (linkedEvent) tasks.push(...linkedEvent.prepTasks.map((task) => ({ eventId: linkedEvent.id, task })));
  for (const plan of plans) tasks.push(...collectGiftPlanTasks(plan, occasion, eventById));
  return dedupeTasks(tasks);
}

function issueSort(left: CelebrationReadinessIssue, right: CelebrationReadinessIssue) {
  return severityPriority(left.severity) - severityPriority(right.severity)
    || (left.dueAt ?? "9999-12-31T23:59:59.999Z").localeCompare(right.dueAt ?? "9999-12-31T23:59:59.999Z")
    || left.message.localeCompare(right.message);
}

function unresolvedGiftWork(plan: GiftPlan) {
  return plan.giftStatus !== "not_needed" && plan.giftStatus !== "given";
}

function unresolvedCardWork(plan: GiftPlan) {
  return plan.cardStatus !== "not_needed" && plan.cardStatus !== "given";
}

function giftPurchased(plan: GiftPlan) {
  return ["bought", "wrapped", "packed", "given"].includes(plan.giftStatus);
}

function giftChosen(plan: GiftPlan) {
  return Boolean(plan.giftSummary?.trim()) || !["idea", "to_buy"].includes(plan.giftStatus);
}

function wrapStillNeeded(plan: GiftPlan) {
  return ["bought"].includes(plan.giftStatus);
}

function cardWritten(plan: GiftPlan) {
  return ["written", "packed", "given"].includes(plan.cardStatus);
}

function deliveryStillNeeded(plan: GiftPlan) {
  return (plan.giftStatus !== "not_needed" && !["packed", "given"].includes(plan.giftStatus))
    || (plan.cardStatus !== "not_needed" && !["packed", "given"].includes(plan.cardStatus));
}

function taskIsDoneOrSkipped(task: PrepTask | undefined) {
  return task?.status !== undefined && task.status !== "open";
}

function deadlineSignal(daysUntil: number | undefined, dueDate: string | undefined, todayKey: string): LevelSignal {
  if (dueDate && validDateKey(dueDate)) {
    const daysUntilDue = daysUntilDate(dueDate, todayKey);
    if (daysUntilDue < 0) return "overdue";
    if (daysUntilDue <= 1) return "critical";
    if (daysUntilDue <= 6) return "critical";
    if (daysUntilDue <= 14) return "warning";
    return "info";
  }
  if (daysUntil === undefined) return "warning";
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 1) return "critical";
  if (daysUntil <= 6) return "critical";
  if (daysUntil <= 14) return "warning";
  return "info";
}

function issueSeverity(signal: LevelSignal): CelebrationReadinessSeverity {
  return signal === "overdue" || signal === "critical" ? "critical" : signal === "warning" ? "warning" : "info";
}

function deadlineCode(dueDate: string | undefined, todayKey: string): CelebrationReadinessIssueCode | undefined {
  if (!dueDate || !validDateKey(dueDate)) return undefined;
  const daysUntilDue = daysUntilDate(dueDate, todayKey);
  if (daysUntilDue === 0) return "deadline_today";
  if (daysUntilDue === 1) return "deadline_tomorrow";
  return undefined;
}

function readinessLevelFromSignal(signal: LevelSignal, hasWork: boolean) {
  if (signal === "overdue") return "overdue" as const;
  if (signal === "critical") return "at_risk" as const;
  if (signal === "warning") return "needs_attention" as const;
  if (signal === "info" || hasWork) return "on_track" as const;
  return "ready" as const;
}

function giftExpected(occasion: CelebrationOccasion, giftPlans: GiftPlan[], eventById: Map<string, FamilyEvent>) {
  if (giftPlans.some((plan) => !plan.archived)) return true;
  if (GIFT_EXPECTED_OCCASION_TYPES.has(occasion.occasionType)) return true;
  return eventById.get(occasion.linkedEventId ?? "")?.category === "birthday_party";
}

export function deriveGiftPlanReadiness({ occasion, giftPlans, events, now = new Date() }: CelebrationReadinessInput) {
  const plan = giftPlans[0];
  if (!plan) throw new Error("deriveGiftPlanReadiness requires a single gift plan.");

  const eventById = new Map(events.map((event) => [event.id, event]));
  const todayKey = currentDateKey(now);
  const occasionDate = validDateKey(occasion.date) ? occasion.date : undefined;
  const daysUntil = occasionDate ? daysUntilDate(occasionDate, todayKey) : undefined;
  const relatedTasks = collectGiftPlanTasks(plan, occasion, eventById);
  const generatedTaskByKind = new Map<GeneratedTaskKind, PrepTask>();
  for (const { task } of relatedTasks) {
    const kind = generatedTaskKindForPlan(plan, task);
    if (kind) generatedTaskByKind.set(kind, task);
  }

  if (plan.archived || !activeOccasion(occasion)) {
    return {
      giftPlanId: plan.id,
      celebrationId: plan.celebrationId,
      recipientName: plan.recipientName,
      targetDate: plan.targetDate ?? occasionDate,
      daysUntil,
      level: "not_applicable",
      score: levelScore("not_applicable"),
      issues: [],
      prepTaskCount: relatedTasks.length,
      openPrepTaskCount: 0,
      overduePrepTaskCount: 0,
      dueSoonPrepTaskCount: 0,
    } satisfies GiftPlanReadinessSummary;
  }

  const issues: CelebrationReadinessIssue[] = [];
  let signal: LevelSignal = "none";

  const addIssue = (issue: CelebrationReadinessIssue, nextSignal: LevelSignal) => {
    issues.push(issue);
    signal = maxSignal(signal, nextSignal);
  };

  const buyDate = plan.buyBy ?? plan.targetDate ?? occasionDate;
  const wrapDate = plan.wrapBy ?? plan.takeBy ?? plan.targetDate ?? occasionDate;
  const takeDate = plan.takeBy ?? plan.targetDate ?? occasionDate;
  const writeCardTask = generatedTaskByKind.get("write_card");
  const wrapTask = generatedTaskByKind.get("wrap_present");
  const buyTask = generatedTaskByKind.get("buy_present");
  const takeTask = generatedTaskByKind.get("take_items");

  if (unresolvedGiftWork(plan) && !giftChosen(plan) && !taskIsDoneOrSkipped(buyTask)) {
    const choiceSignal = deadlineSignal(daysUntil, buyDate, todayKey);
    addIssue({
      id: `${plan.id}:gift_not_chosen`,
      severity: issueSeverity(choiceSignal === "info" ? "info" : choiceSignal),
      code: "gift_not_chosen",
      message: "No present chosen yet.",
      suggestedAction: "Add the gift idea or update the present status.",
      dueAt: buyDate ? `${buyDate}T18:00:00.000Z` : undefined,
      relatedOccasionId: occasion.id,
      relatedGiftPlanId: plan.id,
    }, choiceSignal === "overdue" ? "critical" : choiceSignal);
  }

  if (unresolvedGiftWork(plan) && !giftPurchased(plan) && !taskIsDoneOrSkipped(buyTask)) {
    const purchaseSignal = deadlineSignal(daysUntil, buyDate, todayKey);
    addIssue({
      id: `${plan.id}:gift_not_purchased`,
      severity: issueSeverity(purchaseSignal),
      code: deadlineCode(buyDate, todayKey) ?? "gift_not_purchased",
      message: buyDate && validDateKey(buyDate)
        ? `Present not marked as bought, and the deadline is ${daysUntilDate(buyDate, todayKey) === 0 ? "today" : daysUntilDate(buyDate, todayKey) === 1 ? "tomorrow" : "coming up"}.`
        : "Present not marked as bought.",
      suggestedAction: "Buy the present or update the plan once it is bought.",
      dueAt: buyDate ? `${buyDate}T18:00:00.000Z` : undefined,
      relatedOccasionId: occasion.id,
      relatedGiftPlanId: plan.id,
    }, purchaseSignal);
  }

  if (unresolvedCardWork(plan) && !cardWritten(plan) && !taskIsDoneOrSkipped(writeCardTask)) {
    const cardSignal = deadlineSignal(daysUntil, wrapDate, todayKey);
    addIssue({
      id: `${plan.id}:card_not_written`,
      severity: issueSeverity(cardSignal),
      code: cardSignal === "overdue" ? "prep_task_overdue" : "card_not_written",
      message: "Card not marked as written.",
      suggestedAction: "Write the card or mark it as not needed.",
      dueAt: wrapDate ? `${wrapDate}T19:00:00.000Z` : undefined,
      relatedOccasionId: occasion.id,
      relatedGiftPlanId: plan.id,
      relatedPrepTaskId: writeCardTask?.id,
    }, cardSignal);
  }

  if (wrapStillNeeded(plan) && !taskIsDoneOrSkipped(wrapTask)) {
    const wrapSignal = deadlineSignal(daysUntil, wrapDate, todayKey);
    addIssue({
      id: `${plan.id}:gift_not_wrapped`,
      severity: issueSeverity(wrapSignal),
      code: wrapSignal === "overdue" ? "prep_task_overdue" : "gift_not_wrapped",
      message: "Present still needs wrapping.",
      suggestedAction: "Wrap the present or update the status once it is packed.",
      dueAt: wrapDate ? `${wrapDate}T19:00:00.000Z` : undefined,
      relatedOccasionId: occasion.id,
      relatedGiftPlanId: plan.id,
      relatedPrepTaskId: wrapTask?.id,
    }, wrapSignal);
  }

  if (deliveryStillNeeded(plan) && !taskIsDoneOrSkipped(takeTask) && daysUntil !== undefined && daysUntil <= 1) {
    const deliverySignal = daysUntil < 0 ? "overdue" : "critical";
    addIssue({
      id: `${plan.id}:gift_not_delivered`,
      severity: issueSeverity(deliverySignal),
      code: "gift_not_delivered",
      message: daysUntil === 0 ? "Present or card still needs packing for today." : "Present or card still needs packing for tomorrow.",
      suggestedAction: "Pack the items or update the statuses once they are ready to take.",
      dueAt: takeDate ? `${takeDate}T08:00:00.000Z` : undefined,
      relatedOccasionId: occasion.id,
      relatedGiftPlanId: plan.id,
      relatedPrepTaskId: takeTask?.id,
    }, deliverySignal);
  }

  let dueSoonPrepTaskCount = 0;
  for (const { task } of relatedTasks) {
    if (task.status !== "open" || !task.dueAt) continue;
    if (isPrepTaskOverdue(task, now)) {
      addIssue({
        id: `${plan.id}:${task.id}:overdue`,
        severity: task.blocksEvent || task.priority === "critical" ? "critical" : "warning",
        code: "prep_task_overdue",
        message: `${task.title} is overdue.`,
        suggestedAction: "Complete it, skip it, or update the deadline.",
        dueAt: task.dueAt,
        relatedOccasionId: occasion.id,
        relatedGiftPlanId: plan.id,
        relatedPrepTaskId: task.id,
      }, "overdue");
      continue;
    }
    const dueDate = isoToDateKey(task.dueAt);
    if (dueDate <= addDaysToDateKey(todayKey, 1)) {
      dueSoonPrepTaskCount += 1;
      addIssue({
        id: `${plan.id}:${task.id}:due_soon`,
        severity: daysUntil !== undefined && daysUntil <= 1 && (task.blocksEvent || task.priority === "critical") ? "critical" : "warning",
        code: "prep_task_due_soon",
        message: `${task.title} is due ${dueDate === todayKey ? "today" : "tomorrow"}.`,
        suggestedAction: "Finish the task while there is still time.",
        dueAt: task.dueAt,
        relatedOccasionId: occasion.id,
        relatedGiftPlanId: plan.id,
        relatedPrepTaskId: task.id,
      }, daysUntil !== undefined && daysUntil <= 1 && task.blocksEvent ? "critical" : "warning");
    }
  }

  if (daysUntil !== undefined && daysUntil <= 1 && issues.some((issue) => issue.severity !== "info")) {
    addIssue({
      id: `${plan.id}:occasion_imminent`,
      severity: "critical",
      code: "occasion_imminent",
      message: daysUntil < 0 ? "The occasion has passed but gift work is still open." : daysUntil === 0 ? "The occasion is today and gift work is still open." : "The occasion is tomorrow and gift work is still open.",
      suggestedAction: "Check the remaining present, card and prep items now.",
      dueAt: occasionDate ? `${occasionDate}T08:00:00.000Z` : undefined,
      relatedOccasionId: occasion.id,
      relatedGiftPlanId: plan.id,
    }, daysUntil < 0 ? "overdue" : "critical");
  }

  const openPrepTaskCount = relatedTasks.filter(({ task }) => task.status === "open").length;
  const overduePrepTaskCount = relatedTasks.filter(({ task }) => isPrepTaskOverdue(task, now)).length;
  const level = readinessLevelFromSignal(signal, openPrepTaskCount > 0);

  return {
    giftPlanId: plan.id,
    celebrationId: plan.celebrationId,
    recipientName: plan.recipientName,
    targetDate: plan.targetDate ?? occasionDate,
    daysUntil,
    level,
    score: levelScore(level),
    issues: issues.sort(issueSort),
    prepTaskCount: relatedTasks.length,
    openPrepTaskCount,
    overduePrepTaskCount,
    dueSoonPrepTaskCount,
  } satisfies GiftPlanReadinessSummary;
}

export function deriveCelebrationReadiness({ occasion, giftPlans, events, now = new Date() }: CelebrationReadinessInput): CelebrationReadinessSummary {
  const eventById = new Map(events.map((event) => [event.id, event]));
  const activePlans = giftPlans.filter((plan) => plan.celebrationId === occasion.id && !plan.archived);
  const planSummaries = activePlans.map((plan) =>
    deriveGiftPlanReadiness({ occasion, giftPlans: [plan], events, now }),
  );
  const todayKey = currentDateKey(now);
  const occasionDate = validDateKey(occasion.date) ? occasion.date : undefined;
  const daysUntil = occasionDate ? daysUntilDate(occasionDate, todayKey) : undefined;
  const relatedTasks = collectCelebrationTasks(occasion, activePlans, eventById);

  if (!activeOccasion(occasion)) {
    return {
      occasionId: occasion.id,
      occasionTitle: occasion.title,
      occasionDate,
      daysUntil,
      level: "not_applicable",
      score: levelScore("not_applicable"),
      issues: [],
      openPrepTaskCount: 0,
      overduePrepTaskCount: 0,
      criticalPrepTaskCount: 0,
      giftPlanCount: activePlans.length,
      readyGiftPlanCount: 0,
      giftPlans: planSummaries,
    };
  }

  const issues: CelebrationReadinessIssue[] = [];
  let signal: LevelSignal = "none";

  const addIssue = (issue: CelebrationReadinessIssue, nextSignal: LevelSignal) => {
    issues.push(issue);
    signal = maxSignal(signal, nextSignal);
  };

  if (!occasionDate) {
    addIssue({
      id: `${occasion.id}:occasion_date_missing`,
      severity: "warning",
      code: "occasion_date_missing",
      message: "Add a date so this celebration can be planned.",
      suggestedAction: "Choose the occasion date.",
      relatedOccasionId: occasion.id,
    }, "warning");
  }

  if (giftExpected(occasion, activePlans, eventById) && activePlans.length === 0) {
    const missingPlanSignal = deadlineSignal(daysUntil, occasionDate, todayKey);
    addIssue({
      id: `${occasion.id}:gift_plan_missing`,
      severity: issueSeverity(missingPlanSignal === "info" ? "info" : missingPlanSignal),
      code: "gift_plan_missing",
      message: "No gift plan has been added for this occasion.",
      suggestedAction: "Add a gift plan for this occasion.",
      dueAt: occasionDate ? `${occasionDate}T08:00:00.000Z` : undefined,
      relatedOccasionId: occasion.id,
    }, missingPlanSignal === "overdue" ? "critical" : missingPlanSignal);
  }

  for (const summary of planSummaries) {
    signal = maxSignal(
      signal,
      summary.level === "overdue" ? "overdue"
        : summary.level === "at_risk" ? "critical"
          : summary.level === "needs_attention" ? "warning"
            : summary.level === "on_track" ? "info"
              : "none",
    );
    issues.push(...summary.issues);
  }

  for (const { task } of relatedTasks) {
    if (task.status !== "open" || !task.dueAt) continue;
    if (isPrepTaskOverdue(task, now)) {
      addIssue({
        id: `${occasion.id}:${task.id}:overdue`,
        severity: task.blocksEvent || task.priority === "critical" ? "critical" : "warning",
        code: "prep_task_overdue",
        message: `${task.title} is overdue.`,
        suggestedAction: "Complete it, skip it, or update the deadline.",
        dueAt: task.dueAt,
        relatedOccasionId: occasion.id,
        relatedPrepTaskId: task.id,
      }, "overdue");
      continue;
    }
    const dueDate = isoToDateKey(task.dueAt);
    if (dueDate <= addDaysToDateKey(todayKey, 1)) {
      addIssue({
        id: `${occasion.id}:${task.id}:due_soon`,
        severity: task.blocksEvent || task.priority === "critical" ? "critical" : "warning",
        code: "prep_task_due_soon",
        message: `${task.title} is due ${dueDate === todayKey ? "today" : "tomorrow"}.`,
        suggestedAction: "Finish the task while there is still time.",
        dueAt: task.dueAt,
        relatedOccasionId: occasion.id,
        relatedPrepTaskId: task.id,
      }, task.blocksEvent || task.priority === "critical" ? "critical" : "warning");
    }
  }

  if (daysUntil !== undefined && daysUntil <= 1 && issues.some((issue) => issue.severity !== "info")) {
    addIssue({
      id: `${occasion.id}:occasion_imminent`,
      severity: "critical",
      code: "occasion_imminent",
      message: daysUntil < 0 ? "This celebration has passed but related work is still open." : daysUntil === 0 ? "This celebration is today and still needs attention." : "This celebration is tomorrow and still needs attention.",
      suggestedAction: "Check the remaining present, card and prep items now.",
      dueAt: occasionDate ? `${occasionDate}T08:00:00.000Z` : undefined,
      relatedOccasionId: occasion.id,
    }, daysUntil < 0 ? "overdue" : "critical");
  }

  const openPrepTaskCount = relatedTasks.filter(({ task }) => task.status === "open").length;
  const overduePrepTaskCount = relatedTasks.filter(({ task }) => isPrepTaskOverdue(task, now)).length;
  const criticalPrepTaskCount = relatedTasks.filter(({ task }) =>
    task.status === "open" && (task.blocksEvent || task.priority === "critical"),
  ).length;
  const readyGiftPlanCount = planSummaries.filter((summary) => summary.level === "ready").length;
  const level = readinessLevelFromSignal(signal, openPrepTaskCount > 0 || planSummaries.some((summary) => summary.level === "on_track"));

  return {
    occasionId: occasion.id,
    occasionTitle: occasion.title,
    occasionDate,
    daysUntil,
    level,
    score: levelScore(level),
    issues: issues.sort(issueSort),
    openPrepTaskCount,
    overduePrepTaskCount,
    criticalPrepTaskCount,
    giftPlanCount: activePlans.length,
    readyGiftPlanCount,
    giftPlans: planSummaries.sort((left, right) => levelPriority(left.level) - levelPriority(right.level) || left.recipientName.localeCompare(right.recipientName)),
  };
}

export function getCelebrationReadinessIssues(input: CelebrationReadinessInput) {
  return deriveCelebrationReadiness(input).issues;
}

export function sortCelebrationReadinessByPriority(summaries: CelebrationReadinessSummary[]) {
  return [...summaries].sort((left, right) =>
    levelPriority(left.level) - levelPriority(right.level)
    || (left.daysUntil ?? 9999) - (right.daysUntil ?? 9999)
    || left.occasionTitle.localeCompare(right.occasionTitle),
  );
}

export function deriveCelebrationReadinessForRange({
  occasions,
  giftPlans,
  events,
  now = new Date(),
  startDate,
  endDate,
  includeOutsideRangeWithOverdue = false,
}: CelebrationReadinessRangeInput) {
  const summaries = occasions.map((occasion) =>
    deriveCelebrationReadiness({
      occasion,
      giftPlans: giftPlans.filter((plan) => plan.celebrationId === occasion.id),
      events,
      now,
    }),
  );

  const filtered = summaries.filter((summary) => {
    if (!startDate && !endDate) return true;
    if (summary.occasionDate && (!startDate || summary.occasionDate >= startDate) && (!endDate || summary.occasionDate <= endDate)) return true;
    if (!summary.occasionDate && summary.level !== "not_applicable") return true;
    return includeOutsideRangeWithOverdue && summary.level === "overdue";
  });

  return sortCelebrationReadinessByPriority(filtered);
}
