import { describe, expect, it } from "vitest";
import { seedFamilyMembers, seedResources } from "../../data/seedData/initialData";
import type { ResourceNeedInput } from "../types";
import { validateResourceNeed } from "./resourceNeedValidation";

const validNeed: ResourceNeedInput = {
  id: "resource_need_car",
  resourceId: "resource_family_car",
  needStatus: "required",
  neededFrom: "2026-06-22T15:30:00.000Z",
  neededUntil: "2026-06-22T17:30:00.000Z",
  allocatedTo: "member_phil",
};

describe("resource need validation", () => {
  it("accepts required, maybe and not-required states", () => {
    expect(validateResourceNeed(validNeed, seedFamilyMembers, seedResources)).toEqual({});
    expect(validateResourceNeed({ ...validNeed, needStatus: "maybe", allocatedTo: "member_beck" }, seedFamilyMembers, seedResources)).toEqual({});
    expect(validateResourceNeed({ id: "not_needed", resourceId: "resource_family_car", needStatus: "not_required" }, seedFamilyMembers, seedResources)).toEqual({});
  });

  it.each([
    ["missing start", { neededFrom: undefined }, "neededFrom"],
    ["missing end", { neededUntil: undefined }, "neededUntil"],
    ["end before start", { neededUntil: "2026-06-22T14:00:00.000Z" }, "neededUntil"],
    ["unknown resource", { resourceId: "resource_unknown" }, "resourceId"],
    ["child allocation", { allocatedTo: "member_seb" }, "allocatedTo"],
    ["unknown allocation", { allocatedTo: "member_unknown" }, "allocatedTo"],
  ])("rejects %s", (_label, updates, field) => {
    expect(validateResourceNeed({ ...validNeed, ...updates }, seedFamilyMembers, seedResources)).toHaveProperty(field);
  });
});
