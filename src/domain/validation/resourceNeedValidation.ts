import { RESOURCE_NEED_STATUSES } from "../constants";
import type { FamilyMember, Resource, ResourceNeed, ResourceNeedInput } from "../types";

export type ResourceNeedValidationErrors = Record<string, string>;

export function validateResourceNeed(
  need: ResourceNeedInput,
  familyMembers: FamilyMember[],
  resources: Resource[],
): ResourceNeedValidationErrors {
  const errors: ResourceNeedValidationErrors = {};
  const adultIds = new Set(familyMembers.filter((member) => member.memberType === "adult").map((member) => member.id));

  if (!resources.some((resource) => resource.id === need.resourceId)) errors.resourceId = "The selected resource is unavailable.";
  if (!RESOURCE_NEED_STATUSES.includes(need.needStatus)) errors.needStatus = "Choose a valid car need status.";
  if (need.allocatedTo && !adultIds.has(need.allocatedTo)) errors.allocatedTo = "The car can only be allocated to Phil or Beck.";

  const activeNeed = need.needStatus === "required" || need.needStatus === "maybe";
  if (activeNeed && !need.neededFrom) errors.neededFrom = "Choose when the car is needed from.";
  if (activeNeed && !need.neededUntil) errors.neededUntil = "Choose when the car is needed until.";
  if (need.neededFrom && Number.isNaN(Date.parse(need.neededFrom))) errors.neededFrom = "Choose a valid start for the car window.";
  if (need.neededUntil && Number.isNaN(Date.parse(need.neededUntil))) errors.neededUntil = "Choose a valid end for the car window.";
  if (!errors.neededFrom && !errors.neededUntil && need.neededFrom && need.neededUntil && Date.parse(need.neededUntil) <= Date.parse(need.neededFrom)) {
    errors.neededUntil = "The car window must end after it starts.";
  }

  return errors;
}

export function validateResourceNeeds(needs: ResourceNeed[], familyMembers: FamilyMember[], resources: Resource[]) {
  const ids = new Set<string>();
  const resourceIds = new Set<string>();
  for (const need of needs) {
    if (ids.has(need.id)) return "Resource need IDs must be unique.";
    if (resourceIds.has(need.resourceId)) return "An event can only contain one need for each resource.";
    ids.add(need.id);
    resourceIds.add(need.resourceId);
    if (Object.keys(validateResourceNeed(need, familyMembers, resources)).length) return "The car need needs attention.";
  }
  return undefined;
}

export function cleanResourceNeed<T extends ResourceNeedInput>(need: T): T {
  return { ...need, notes: need.notes?.trim() || undefined };
}
