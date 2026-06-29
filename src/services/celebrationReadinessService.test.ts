import { describe, expect, it } from "vitest";
import type { CelebrationOccasion, FamilyEvent, GiftPlan, PrepTask } from "../domain/types";
import { localDateTimeToIso } from "../utils/dates";
import {
  deriveCelebrationReadiness,
  deriveCelebrationReadinessForRange,
  deriveGiftPlanReadiness,
  sortCelebrationReadinessByPriority,
} from "./celebrationReadinessService";

const NOW = new Date("2026-06-20T09:00:00.000Z");
const TIMESTAMP = "2026-01-01T00:00:00.000Z";

function celebration(overrides: Partial<CelebrationOccasion> = {}): CelebrationOccasion {
  return {
    id: "celebration_1",
    householdId: "household_lawrence",
    title: "Alex birthday",
    occasionType: "birthday_party",
    date: "2026-06-30",
    recurrence: "none",
    ownerAdultIds: ["member_phil"],
    status: "planned",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function giftPlan(overrides: Partial<GiftPlan> = {}): GiftPlan {
  return {
    id: "gift_1",
    celebrationId: "celebration_1",
    recipientName: "Alex",
    responsibleAdultId: "member_phil",
    giftSummary: "Lego set",
    giftStatus: "to_buy",
    cardStatus: "to_buy",
    rsvpStatus: "to_reply",
    targetDate: "2026-06-30",
    buyBy: "2026-06-28",
    wrapBy: "2026-06-29",
    takeBy: "2026-06-30",
    linkedPrepTaskIds: [],
    archived: false,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function prepTask(id: string, title: string, dueAt: string, overrides: Partial<PrepTask> = {}): PrepTask {
  return {
    id,
    title,
    ownerIds: ["member_phil"],
    dueAt,
    priority: "important",
    status: "open",
    blocksEvent: false,
    notes: "Generated from Gifts & Celebrations.",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function event(prepTasks: PrepTask[], overrides: Partial<FamilyEvent> = {}): FamilyEvent {
  return {
    id: "event_1",
    title: "Alex party",
    category: "birthday_party",
    status: "confirmed",
    startAt: localDateTimeToIso("2026-06-30T14:00"),
    endAt: localDateTimeToIso("2026-06-30T16:00"),
    allDay: false,
    participants: ["member_seb"],
    responsibleAdults: ["member_phil"],
    prepTasks,
    resourceNeeds: [],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

describe("celebration readiness service", () => {
  it("returns ready when the gift plan and prep tasks are complete", () => {
    const occasion = celebration({ linkedEventId: "event_1" });
    const plan = giftPlan({
      linkedEventId: "event_1",
      linkedPrepTaskIds: ["prep_gift_1_take_items"],
      giftStatus: "given",
      cardStatus: "given",
      rsvpStatus: "accepted",
    });
    const summary = deriveCelebrationReadiness({
      occasion,
      giftPlans: [plan],
      events: [event([
        prepTask("prep_gift_1_take_items", "Pack and take present and card", localDateTimeToIso("2026-06-30T08:00"), { status: "done", blocksEvent: true }),
      ])],
      now: NOW,
    });

    expect(summary.level).toBe("ready");
    expect(summary.score).toBe(100);
    expect(summary.issues).toEqual([]);
  });

  it("returns on_track for a celebration 30 days away with open future tasks", () => {
    const occasion = celebration({ date: "2026-07-20", linkedEventId: "event_1" });
    const plan = giftPlan({
      linkedEventId: "event_1",
      targetDate: "2026-07-20",
      buyBy: "2026-07-10",
      wrapBy: "2026-07-18",
      takeBy: "2026-07-20",
    });
    const summary = deriveGiftPlanReadiness({
      occasion,
      giftPlans: [plan],
      events: [event([
        prepTask("prep_gift_1_buy_present", "Buy present", localDateTimeToIso("2026-07-10T18:00")),
      ], { startAt: localDateTimeToIso("2026-07-20T14:00"), endAt: localDateTimeToIso("2026-07-20T16:00") })],
      now: NOW,
    });

    expect(summary.level).toBe("on_track");
    expect(summary.score).toBe(85);
  });

  it("returns needs_attention 10 days out when no gift has been chosen", () => {
    const occasion = celebration({ date: "2026-06-30" });
    const plan = giftPlan({ giftSummary: undefined, giftStatus: "idea" });
    const summary = deriveGiftPlanReadiness({ occasion, giftPlans: [plan], events: [], now: NOW });

    expect(summary.level).toBe("needs_attention");
    expect(summary.issues.some((issue) => issue.code === "gift_not_chosen")).toBe(true);
  });

  it("returns at_risk 5 days out when the gift is not purchased", () => {
    const occasion = celebration({ date: "2026-06-25" });
    const plan = giftPlan({
      targetDate: "2026-06-25",
      buyBy: "2026-06-24",
      wrapBy: "2026-06-25",
      takeBy: "2026-06-25",
      giftStatus: "to_buy",
    });
    const summary = deriveGiftPlanReadiness({ occasion, giftPlans: [plan], events: [], now: NOW });

    expect(summary.level).toBe("at_risk");
    expect(summary.issues.some((issue) => issue.code === "gift_not_purchased" || issue.code === "deadline_tomorrow")).toBe(true);
  });

  it("returns a critical issue when a card task is still open for tomorrow", () => {
    const occasion = celebration({ date: "2026-06-21", linkedEventId: "event_1" });
    const plan = giftPlan({
      linkedEventId: "event_1",
      giftStatus: "bought",
      cardStatus: "bought",
      buyBy: "2026-06-20",
      wrapBy: "2026-06-21",
      takeBy: "2026-06-21",
      linkedPrepTaskIds: ["prep_gift_1_write_card"],
    });
    const summary = deriveGiftPlanReadiness({
      occasion,
      giftPlans: [plan],
      events: [event([
        prepTask("prep_gift_1_write_card", "Write card", localDateTimeToIso("2026-06-21T19:00")),
      ], { startAt: localDateTimeToIso("2026-06-21T14:00"), endAt: localDateTimeToIso("2026-06-21T16:00") })],
      now: NOW,
    });

    expect(summary.issues.some((issue) => issue.code === "card_not_written" && issue.severity === "critical")).toBe(true);
  });

  it("returns overdue when a generated celebration prep task is overdue", () => {
    const occasion = celebration({ linkedEventId: "event_1" });
    const plan = giftPlan({
      linkedEventId: "event_1",
      linkedPrepTaskIds: ["prep_gift_1_buy_present"],
    });
    const summary = deriveCelebrationReadiness({
      occasion,
      giftPlans: [plan],
      events: [event([
        prepTask("prep_gift_1_buy_present", "Buy present", localDateTimeToIso("2026-06-19T18:00"), { blocksEvent: true }),
      ])],
      now: NOW,
    });

    expect(summary.level).toBe("overdue");
    expect(summary.issues.some((issue) => issue.code === "prep_task_overdue")).toBe(true);
  });

  it("suppresses a warning when the generated prep task is complete", () => {
    const occasion = celebration({ date: "2026-06-21", linkedEventId: "event_1" });
    const plan = giftPlan({
      linkedEventId: "event_1",
      giftStatus: "bought",
      cardStatus: "written",
      linkedPrepTaskIds: ["prep_gift_1_wrap_present"],
    });
    const summary = deriveGiftPlanReadiness({
      occasion,
      giftPlans: [plan],
      events: [event([
        prepTask("prep_gift_1_wrap_present", "Wrap present", localDateTimeToIso("2026-06-21T19:00"), { status: "done" }),
      ], { startAt: localDateTimeToIso("2026-06-21T14:00"), endAt: localDateTimeToIso("2026-06-21T16:00") })],
      now: NOW,
    });

    expect(summary.issues.some((issue) => issue.code === "gift_not_wrapped")).toBe(false);
  });

  it("suppresses a warning when a non-critical generated prep task is skipped", () => {
    const occasion = celebration({ date: "2026-06-21", linkedEventId: "event_1" });
    const plan = giftPlan({
      linkedEventId: "event_1",
      cardStatus: "bought",
      linkedPrepTaskIds: ["prep_gift_1_write_card"],
    });
    const summary = deriveGiftPlanReadiness({
      occasion,
      giftPlans: [plan],
      events: [event([
        prepTask("prep_gift_1_write_card", "Write card", localDateTimeToIso("2026-06-21T19:00"), { status: "skipped" }),
      ], { startAt: localDateTimeToIso("2026-06-21T14:00"), endAt: localDateTimeToIso("2026-06-21T16:00") })],
      now: NOW,
    });

    expect(summary.issues.some((issue) => issue.code === "card_not_written")).toBe(false);
  });

  it("returns not_applicable for archived or completed occasions", () => {
    const summary = deriveCelebrationReadiness({
      occasion: celebration({ status: "complete" }),
      giftPlans: [giftPlan()],
      events: [],
      now: NOW,
    });

    expect(summary.level).toBe("not_applicable");
    expect(summary.issues).toEqual([]);
  });

  it("handles a missing date safely and returns a warning", () => {
    const summary = deriveCelebrationReadiness({
      occasion: celebration({ date: "" }),
      giftPlans: [],
      events: [],
      now: NOW,
    });

    expect(summary.level).toBe("needs_attention");
    expect(summary.issues.some((issue) => issue.code === "occasion_date_missing")).toBe(true);
  });

  it("returns deterministic output for a fixed now", () => {
    const input = {
      occasion: celebration({ linkedEventId: "event_1" }),
      giftPlans: [giftPlan({ linkedEventId: "event_1" })],
      events: [event([
        prepTask("prep_gift_1_buy_present", "Buy present", localDateTimeToIso("2026-06-28T18:00")),
      ])],
      now: NOW,
    };

    expect(deriveCelebrationReadiness(input)).toEqual(deriveCelebrationReadiness(input));
  });

  it("sorts overdue and critical celebrations ahead of future informational ones", () => {
    const overdue = deriveCelebrationReadiness({
      occasion: celebration({ id: "celebration_overdue", linkedEventId: "event_overdue" }),
      giftPlans: [giftPlan({ celebrationId: "celebration_overdue", linkedEventId: "event_overdue" })],
      events: [event([
        prepTask("prep_gift_1_buy_present", "Buy present", localDateTimeToIso("2026-06-19T18:00")),
      ], { id: "event_overdue" })],
      now: NOW,
    });
    const informational = deriveCelebrationReadiness({
      occasion: celebration({ id: "celebration_future", date: "2026-07-20" }),
      giftPlans: [giftPlan({ celebrationId: "celebration_future", targetDate: "2026-07-20", buyBy: "2026-07-10", wrapBy: "2026-07-18", takeBy: "2026-07-20" })],
      events: [],
      now: NOW,
    });

    const sorted = sortCelebrationReadinessByPriority([informational, overdue]);
    expect(sorted.map((item) => item.occasionId)).toEqual(["celebration_overdue", "celebration_future"]);
  });

  it("keeps overdue items outside the range when requested", () => {
    const summaries = deriveCelebrationReadinessForRange({
      occasions: [
        celebration({ id: "celebration_in_range", date: "2026-06-25" }),
        celebration({ id: "celebration_overdue", linkedEventId: "event_overdue", date: "2026-08-01" }),
      ],
      giftPlans: [
        giftPlan({ celebrationId: "celebration_in_range", targetDate: "2026-06-25", buyBy: "2026-06-24", wrapBy: "2026-06-25", takeBy: "2026-06-25" }),
        giftPlan({ celebrationId: "celebration_overdue", linkedEventId: "event_overdue", targetDate: "2026-08-01", buyBy: "2026-06-19" }),
      ],
      events: [event([
        prepTask("prep_gift_1_buy_present", "Buy present", localDateTimeToIso("2026-06-19T18:00")),
      ], { id: "event_overdue", startAt: localDateTimeToIso("2026-08-01T14:00"), endAt: localDateTimeToIso("2026-08-01T16:00") })],
      now: NOW,
      startDate: "2026-06-20",
      endDate: "2026-06-30",
      includeOutsideRangeWithOverdue: true,
    });

    expect(summaries.map((item) => item.occasionId)).toContain("celebration_overdue");
    expect(summaries.map((item) => item.occasionId)).toContain("celebration_in_range");
  });
});
