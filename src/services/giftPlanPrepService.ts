import { allDayEndIso, dateKeyToIsoStart, localDateTimeToIso } from "../utils/dates";
import type {
  CelebrationOccasion,
  FamilyEvent,
  GiftPlan,
  PrepTask,
  PrepTaskPriority,
  PrepTaskStatus,
} from "../domain/types";
import { db } from "../data/db";
import { createEvent, getEventById, updateEvent } from "../data/repositories/eventRepository";
import { changeOccurrencePrep } from "../data/repositories/eventSeriesRepository";
import { updateCelebration } from "../data/repositories/celebrationRepository";
import { updateGiftPlan } from "../data/repositories/giftPlanRepository";

type GeneratedTaskKind = "rsvp" | "buy_present" | "buy_card" | "write_card" | "wrap_present" | "take_items";

interface GeneratedTaskSpec {
  id: string;
  title: string;
  dueAt?: string;
  priority: PrepTaskPriority;
  status: PrepTaskStatus;
  blocksEvent: boolean;
}

function generatedTaskId(giftPlanId: string, kind: GeneratedTaskKind) {
  return `prep_${giftPlanId}_${kind}`;
}

function dueAtForDate(date: string, time: string) {
  return localDateTimeToIso(`${date}T${time}`);
}

function celebrationCategory(occasion: CelebrationOccasion): FamilyEvent["category"] {
  if (occasion.occasionType === "birthday_party") return "birthday_party";
  if (occasion.occasionType === "school") return "school";
  if (occasion.occasionType === "family_social") return "family_social";
  return "reminder_only";
}

function withExistingStatus(existing: PrepTask | undefined, desired: PrepTaskStatus) {
  if (!existing) return desired;
  if (existing.status !== "open" && desired === "open") return existing.status;
  return desired;
}

function buildGeneratedTasks(giftPlan: GiftPlan, celebration: CelebrationOccasion): GeneratedTaskSpec[] {
  const targetDate = giftPlan.takeBy ?? giftPlan.targetDate ?? celebration.date;
  const buyDate = giftPlan.buyBy ?? giftPlan.targetDate ?? celebration.date;
  const wrapDate = giftPlan.wrapBy ?? giftPlan.takeBy ?? giftPlan.targetDate ?? celebration.date;
  const writeDate = giftPlan.wrapBy ?? giftPlan.takeBy ?? giftPlan.targetDate ?? celebration.date;
  const specs: GeneratedTaskSpec[] = [];

  if (giftPlan.rsvpStatus !== "not_needed") {
    specs.push({
      id: generatedTaskId(giftPlan.id, "rsvp"),
      title: "RSVP to party",
      dueAt: giftPlan.targetDate ? dueAtForDate(giftPlan.targetDate, "17:00") : undefined,
      priority: "important",
      status: giftPlan.rsvpStatus === "to_reply" || giftPlan.rsvpStatus === "maybe" ? "open" : "done",
      blocksEvent: true,
    });
  }

  if (giftPlan.giftStatus !== "not_needed") {
    specs.push({
      id: generatedTaskId(giftPlan.id, "buy_present"),
      title: "Buy present",
      dueAt: buyDate ? dueAtForDate(buyDate, "18:00") : undefined,
      priority: "important",
      status: ["idea", "to_buy", "ordered"].includes(giftPlan.giftStatus) ? "open" : "done",
      blocksEvent: true,
    });
  }

  if (giftPlan.cardStatus !== "not_needed") {
    specs.push({
      id: generatedTaskId(giftPlan.id, "buy_card"),
      title: "Buy card",
      dueAt: buyDate ? dueAtForDate(buyDate, "18:00") : undefined,
      priority: "normal",
      status: giftPlan.cardStatus === "to_buy" ? "open" : "done",
      blocksEvent: false,
    });
    specs.push({
      id: generatedTaskId(giftPlan.id, "write_card"),
      title: "Write card",
      dueAt: writeDate ? dueAtForDate(writeDate, "19:00") : undefined,
      priority: "normal",
      status: giftPlan.cardStatus === "bought" ? "open" : ["written", "packed", "given"].includes(giftPlan.cardStatus) ? "done" : "skipped",
      blocksEvent: false,
    });
  }

  if (giftPlan.giftStatus !== "not_needed" && !["idea", "to_buy"].includes(giftPlan.giftStatus)) {
    specs.push({
      id: generatedTaskId(giftPlan.id, "wrap_present"),
      title: "Wrap present",
      dueAt: wrapDate ? dueAtForDate(wrapDate, "19:00") : undefined,
      priority: "normal",
      status: ["wrapped", "packed", "given"].includes(giftPlan.giftStatus) ? "done" : "open",
      blocksEvent: false,
    });
  }

  if (giftPlan.giftStatus !== "not_needed" || giftPlan.cardStatus !== "not_needed") {
    specs.push({
      id: generatedTaskId(giftPlan.id, "take_items"),
      title: "Pack and take present and card",
      dueAt: targetDate ? dueAtForDate(targetDate, "08:00") : undefined,
      priority: "important",
      status: giftPlan.giftStatus === "given" && ["not_needed", "given"].includes(giftPlan.cardStatus) ? "done" : ["packed", "given"].includes(giftPlan.giftStatus) || ["packed", "given"].includes(giftPlan.cardStatus) ? "open" : "skipped",
      blocksEvent: true,
    });
  }

  return specs;
}

async function resolveTargetEvent(giftPlan: GiftPlan, celebration: CelebrationOccasion) {
  const existingEventId = giftPlan.linkedEventId ?? celebration.linkedEventId;
  if (existingEventId) {
    const existingEvent = await getEventById(existingEventId);
    if (existingEvent) return existingEvent;
  }

  const fallbackAdultIds = celebration.ownerAdultIds.length
    ? celebration.ownerAdultIds
    : (await db.familyMembers
      .filter((member) => member.memberType === "adult" && member.active)
      .toArray())
      .map((member) => member.id);
  const participants = [...new Set(
    [celebration.linkedMemberId, giftPlan.recipientMemberId, giftPlan.responsibleAdultId, ...fallbackAdultIds]
      .filter((value): value is string => Boolean(value)),
  )];

  const created = await createEvent({
    title: `Celebration: ${celebration.title}`,
    category: celebrationCategory(celebration),
    status: "planned",
    startAt: dateKeyToIsoStart(celebration.date),
    endAt: allDayEndIso(celebration.date),
    allDay: true,
    participants,
    responsibleAdults: giftPlan.responsibleAdultId ? [giftPlan.responsibleAdultId] : celebration.ownerAdultIds,
    prepTasks: [],
    resourceNeeds: [],
    notes: "Support event created so Gifts & Celebrations prep can flow through the main operational task system.",
  });
  if (!celebration.linkedEventId) await updateCelebration(celebration.id, { linkedEventId: created.id });
  if (!giftPlan.linkedEventId) await updateGiftPlan(giftPlan.id, { linkedEventId: created.id });
  return created;
}

async function writePrepTasks(event: FamilyEvent, tasks: PrepTask[]) {
  if (await db.events.get(event.id)) {
    await updateEvent(event.id, { prepTasks: tasks });
    return;
  }
  if (!event.seriesId || !event.occurrenceDate) throw new Error("The linked event could not be updated.");
  await changeOccurrencePrep(event.seriesId, event.occurrenceDate, tasks);
}

async function removeGeneratedTasksFromEvent(eventId: string | undefined, taskIds: string[]) {
  if (!eventId || !taskIds.length) return;
  const event = await getEventById(eventId);
  if (!event) return;
  const remaining = event.prepTasks.filter((task) => !taskIds.includes(task.id));
  if (remaining.length === event.prepTasks.length) return;
  await writePrepTasks(event, remaining);
}

export async function generateGiftPlanPrepTasks(giftPlanId: string) {
  const giftPlan = await db.giftPlans.get(giftPlanId);
  if (!giftPlan) throw new Error("Gift plan not found.");
  const celebration = await db.celebrationOccasions.get(giftPlan.celebrationId);
  if (!celebration) throw new Error("Celebration not found.");
  const previousEventId = giftPlan.linkedEventId;
  const targetEvent = await resolveTargetEvent(giftPlan, celebration);
  const desired = buildGeneratedTasks(giftPlan, celebration);
  const desiredById = new Map(desired.map((task) => [task.id, task]));
  const preserved = targetEvent.prepTasks.filter((task) => !task.id.startsWith(`prep_${giftPlan.id}_`));
  const generatedTasks: PrepTask[] = desired.map((spec) => {
    const existing = targetEvent.prepTasks.find((task) => task.id === spec.id);
    const timestamp = existing?.createdAt ?? new Date().toISOString();
    return {
      id: spec.id,
      title: spec.title,
      ownerIds: giftPlan.responsibleAdultId ? [giftPlan.responsibleAdultId] : [],
      dueAt: spec.dueAt,
      priority: spec.priority,
      status: withExistingStatus(existing, spec.status),
      blocksEvent: spec.blocksEvent,
      notes: "Generated from Gifts & Celebrations.",
      createdAt: timestamp,
      updatedAt: new Date().toISOString(),
    };
  });
  await writePrepTasks(targetEvent, [...preserved, ...generatedTasks]);
  if (previousEventId && previousEventId !== targetEvent.id) await removeGeneratedTasksFromEvent(previousEventId, giftPlan.linkedPrepTaskIds ?? []);
  const updatedGiftPlan = await updateGiftPlan(giftPlan.id, {
    linkedEventId: targetEvent.id,
    linkedPrepTaskIds: [...desiredById.keys()],
  });
  if (!celebration.linkedEventId) await updateCelebration(celebration.id, { linkedEventId: targetEvent.id });
  return { eventId: targetEvent.id, giftPlan: updatedGiftPlan };
}
