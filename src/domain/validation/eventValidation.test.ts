import { describe, expect, it } from "vitest";
import type { FamilyEventInput, Place } from "../types";
import { seedFamilyMembers } from "../../data/seedData/initialData";
import { validateEventInput } from "./eventValidation";

const place: Place = {
  id: "place_pool",
  name: "Pool",
  placeType: "club",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const validInput: FamilyEventInput = {
  title: "Swimming",
  category: "lesson",
  status: "confirmed",
  startAt: "2026-06-22T16:30:00.000Z",
  endAt: "2026-06-22T17:00:00.000Z",
  allDay: false,
  placeId: place.id,
  participants: ["member_seb"],
  responsibleAdults: ["member_phil"],
  prepTasks: [],
  resourceNeeds: [],
};

describe("event validation", () => {
  it("accepts a valid event", () => {
    expect(validateEventInput(validInput, seedFamilyMembers, [place])).toEqual({});
  });

  it.each([
    ["missing title", { title: "" }, "title"],
    ["missing participant", { participants: [] }, "participants"],
    ["end before start", { endAt: "2026-06-22T15:00:00.000Z" }, "endAt"],
    ["invalid participant", { participants: ["member_unknown"] }, "participants"],
    ["non-adult responsible person", { responsibleAdults: ["member_seb"] }, "responsibleAdults"],
  ])("rejects %s", (_label, updates, expectedField) => {
    expect(validateEventInput({ ...validInput, ...updates }, seedFamilyMembers, [place])).toHaveProperty(expectedField);
  });
});
