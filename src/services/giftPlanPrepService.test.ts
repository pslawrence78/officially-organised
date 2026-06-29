import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { createCelebration } from "../data/repositories/celebrationRepository";
import { createGiftPlan, getGiftPlanById, updateGiftPlan } from "../data/repositories/giftPlanRepository";
import { createEvent, getEventById, seedInitialDataIfNeeded } from "../data/repositories";
import { generateGiftPlanPrepTasks } from "./giftPlanPrepService";
import { localDateTimeToIso } from "../utils/dates";

describe("gift plan prep service", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("generates expected prep tasks and keeps reruns idempotent", async () => {
    const event = await createEvent({
      title: "Birthday party",
      category: "birthday_party",
      status: "confirmed",
      startAt: localDateTimeToIso("2026-07-10T14:00"),
      endAt: localDateTimeToIso("2026-07-10T16:00"),
      allDay: false,
      participants: ["member_seb"],
      responsibleAdults: ["member_beck"],
      prepTasks: [],
      resourceNeeds: [],
    });
    const celebration = await createCelebration({ householdId: "household_lawrence", title: "Alex birthday party", occasionType: "birthday_party", date: "2026-07-10", recurrence: "none", linkedEventId: event.id, ownerAdultIds: ["member_beck"], status: "planned" });
    const giftPlan = await createGiftPlan({
      celebrationId: celebration.id,
      linkedEventId: event.id,
      recipientName: "Alex",
      responsibleAdultId: "member_beck",
      giftStatus: "to_buy",
      cardStatus: "to_buy",
      rsvpStatus: "to_reply",
      buyBy: "2026-07-08",
      takeBy: "2026-07-10",
      archived: false,
      linkedPrepTaskIds: [],
    });

    await generateGiftPlanPrepTasks(giftPlan.id);
    await generateGiftPlanPrepTasks(giftPlan.id);

    const updatedEvent = await getEventById(event.id);
    const updatedGiftPlan = await getGiftPlanById(giftPlan.id);
    expect(updatedEvent?.prepTasks.map((task) => task.title)).toEqual(expect.arrayContaining(["RSVP to party", "Buy present", "Buy card", "Pack and take present and card"]));
    expect(new Set(updatedEvent?.prepTasks.map((task) => task.id)).size).toBe(updatedEvent?.prepTasks.length);
    expect(updatedEvent?.prepTasks.every((task) => task.ownerIds.includes("member_beck"))).toBe(true);
    expect(updatedGiftPlan?.linkedPrepTaskIds?.length).toBeGreaterThan(0);
  });

  it("creates a support event when the linked event is missing", async () => {
    const celebration = await createCelebration({ householdId: "household_lawrence", title: "Thank you gift", occasionType: "thank_you", date: "2026-07-12", recurrence: "none", ownerAdultIds: ["member_phil"], status: "planned" });
    const giftPlan = await createGiftPlan({
      celebrationId: celebration.id,
      recipientName: "Nursery staff",
      responsibleAdultId: "member_phil",
      giftStatus: "to_buy",
      cardStatus: "written",
      rsvpStatus: "not_needed",
      targetDate: "2026-07-12",
      archived: false,
      linkedPrepTaskIds: [],
    });

    const result = await generateGiftPlanPrepTasks(giftPlan.id);
    const supportEvent = await getEventById(result.eventId);

    expect(supportEvent).toMatchObject({ category: "reminder_only", title: "Celebration: Thank you gift" });
    expect((await getGiftPlanById(giftPlan.id))?.linkedEventId).toBe(result.eventId);
  });

  it("creates a valid support event even when no family recipient or responsible adult is set", async () => {
    const celebration = await createCelebration({ householdId: "household_lawrence", title: "School party", occasionType: "school", date: "2026-07-15", recurrence: "none", ownerAdultIds: [], status: "planned" });
    const giftPlan = await createGiftPlan({
      celebrationId: celebration.id,
      recipientName: "Classmate",
      giftStatus: "to_buy",
      cardStatus: "to_buy",
      rsvpStatus: "not_needed",
      targetDate: "2026-07-15",
      archived: false,
      linkedPrepTaskIds: [],
    });

    const result = await generateGiftPlanPrepTasks(giftPlan.id);
    const supportEvent = await getEventById(result.eventId);

    expect(supportEvent?.participants.length).toBeGreaterThan(0);
    expect(supportEvent?.participants).toEqual(expect.arrayContaining(["member_phil", "member_beck"]));
  });

  it("preserves existing generated task completion when the service reruns", async () => {
    const celebration = await createCelebration({ householdId: "household_lawrence", title: "School party", occasionType: "school", date: "2026-07-15", recurrence: "none", ownerAdultIds: ["member_phil"], status: "planned" });
    const giftPlan = await createGiftPlan({
      celebrationId: celebration.id,
      recipientName: "Classmate",
      responsibleAdultId: "member_phil",
      giftStatus: "to_buy",
      cardStatus: "to_buy",
      rsvpStatus: "to_reply",
      targetDate: "2026-07-15",
      archived: false,
      linkedPrepTaskIds: [],
    });

    const initial = await generateGiftPlanPrepTasks(giftPlan.id);
    const event = await getEventById(initial.eventId);
    const buyPresent = event?.prepTasks.find((task) => task.title === "Buy present");
    await updateGiftPlan(giftPlan.id, { giftStatus: "to_buy" });
    await db.events.put({
      ...event!,
      prepTasks: event!.prepTasks.map((task) => task.id === buyPresent?.id ? { ...task, status: "done" } : task),
    });

    await generateGiftPlanPrepTasks(giftPlan.id);
    const rerunEvent = await getEventById(initial.eventId);
    expect(rerunEvent?.prepTasks.find((task) => task.id === buyPresent?.id)?.status).toBe("done");
  });
});
