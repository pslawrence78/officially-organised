import { describe, expect, it } from "vitest";
import { seedFamilyMembers } from "../../data/seedData/initialData";
import type { NewPrepTaskInput } from "../types";
import { validatePrepTask } from "./prepTaskValidation";

const validTask: NewPrepTaskInput = {
  title: "Pack swimming kit",
  ownerIds: ["member_phil", "member_beck"],
  dueAt: "2026-06-22T15:00:00.000Z",
  priority: "important",
  status: "open",
  blocksEvent: true,
};

describe("preparation task validation", () => {
  it("accepts both adults or a genuinely unassigned owner", () => {
    expect(validatePrepTask(validTask, seedFamilyMembers)).toEqual({});
    expect(validatePrepTask({ ...validTask, ownerIds: [] }, seedFamilyMembers)).toEqual({});
  });

  it.each([
    ["missing title", { title: "" }, "title"],
    ["child owner", { ownerIds: ["member_seb"] }, "ownerIds"],
    ["unknown owner", { ownerIds: ["member_unknown"] }, "ownerIds"],
    ["invalid due date", { dueAt: "not-a-date" }, "dueAt"],
    ["invalid priority", { priority: "urgent" }, "priority"],
    ["invalid status", { status: "waiting" }, "status"],
  ])("rejects %s", (_label, updates, field) => {
    expect(validatePrepTask({ ...validTask, ...updates } as NewPrepTaskInput, seedFamilyMembers)).toHaveProperty(field);
  });
});
