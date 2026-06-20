import { describe, expect, it } from "vitest";
import type { FamilyEvent, ResourceNeed } from "../domain/types";
import { calculateConflicts } from "./conflictService";

const timestamp = "2026-06-20T08:00:00.000Z";

function event(id: string, overrides: Partial<FamilyEvent> = {}): FamilyEvent {
  return {
    id,
    title: id,
    category: "family_social",
    status: "confirmed",
    startAt: "2026-06-20T09:00:00.000Z",
    endAt: "2026-06-20T10:00:00.000Z",
    allDay: false,
    participants: ["member_phil"],
    responsibleAdults: ["member_phil"],
    prepTasks: [],
    resourceNeeds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function carNeed(id: string, status: ResourceNeed["needStatus"], from: string, until: string): ResourceNeed {
  return { id, resourceId: "resource_family_car", needStatus: status, neededFrom: from, neededUntil: until, createdAt: timestamp, updatedAt: timestamp };
}

describe("calculateConflicts", () => {
  it("adds and removes a required car clash when the resource window changes", () => {
    const first = event("first", { resourceNeeds: [carNeed("car-1", "required", "2026-06-20T09:00:00.000Z", "2026-06-20T11:00:00.000Z")] });
    const second = event("second", { resourceNeeds: [carNeed("car-2", "required", "2026-06-20T10:00:00.000Z", "2026-06-20T12:00:00.000Z")] });
    expect(calculateConflicts([first, second], new Date(timestamp)).map((item) => item.type)).toContain("car_clash");

    const moved = { ...second, resourceNeeds: [{ ...second.resourceNeeds[0], neededFrom: "2026-06-20T11:00:00.000Z", neededUntil: "2026-06-20T12:00:00.000Z" }] };
    expect(calculateConflicts([first, moved], new Date(timestamp))).toHaveLength(0);
  });

  it("detects required/maybe overlap but not maybe/maybe overlap", () => {
    const required = event("required", { resourceNeeds: [carNeed("car-r", "required", "2026-06-20T09:00:00.000Z", "2026-06-20T11:00:00.000Z")] });
    const maybe = event("maybe", { resourceNeeds: [carNeed("car-m", "maybe", "2026-06-20T10:00:00.000Z", "2026-06-20T12:00:00.000Z")] });
    expect(calculateConflicts([required, maybe], new Date(timestamp)).map((item) => item.type)).toEqual(["maybe_car_clash"]);
    expect(calculateConflicts([{ ...required, resourceNeeds: [{ ...required.resourceNeeds[0], needStatus: "maybe" }] }, maybe], new Date(timestamp))).toHaveLength(0);
  });

  it("removes a responsibility gap when an adult is assigned", () => {
    const unassigned = event("seb-club", { participants: ["member_seb"], responsibleAdults: [] });
    expect(calculateConflicts([unassigned], new Date(timestamp)).map((item) => item.type)).toEqual(["unassigned_responsibility"]);
    expect(calculateConflicts([{ ...unassigned, responsibleAdults: ["member_beck"] }], new Date(timestamp))).toHaveLength(0);
  });

  it("classifies blocking overdue prep as critical and removes it when completed", () => {
    const overdue = event("party", { prepTasks: [{ id: "present", title: "Buy present", ownerIds: [], dueAt: "2026-06-19T12:00:00.000Z", priority: "critical", status: "open", blocksEvent: true, createdAt: timestamp, updatedAt: timestamp }] });
    const conflict = calculateConflicts([overdue], new Date(timestamp));
    expect(conflict).toMatchObject([{ type: "critical_prep_overdue", severity: "critical" }]);
    const completed = { ...overdue, prepTasks: [{ ...overdue.prepTasks[0], status: "done" as const }] };
    expect(calculateConflicts([completed], new Date(timestamp))).toHaveLength(0);
  });

  it("detects non-blocking overdue prep and ignores cancelled events", () => {
    const overdue = event("packing", { prepTasks: [{ id: "kit", title: "Pack kit", ownerIds: [], dueAt: "2026-06-19T12:00:00.000Z", priority: "important", status: "open", blocksEvent: false, createdAt: timestamp, updatedAt: timestamp }] });
    expect(calculateConflicts([overdue], new Date(timestamp)).map((item) => item.type)).toEqual(["prep_overdue"]);
    expect(calculateConflicts([{ ...overdue, status: "cancelled" }], new Date(timestamp))).toHaveLength(0);
  });
});
