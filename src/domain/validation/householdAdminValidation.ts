import {
  HOUSEHOLD_ADMIN_CATEGORIES,
  HOUSEHOLD_ADMIN_CYCLES,
  HOUSEHOLD_ADMIN_STATUSES,
  HOUSEHOLD_ADMIN_TYPES,
} from "../constants";
import type {
  FamilyMember,
  HouseholdAdminItemInput,
  Place,
  Resource,
} from "../types";
import { validDateKey } from "../../utils/celebrations";

export function validateHouseholdAdminItemInput(
  input: HouseholdAdminItemInput,
  references: {
    members: FamilyMember[];
    resources: Resource[];
    places: Place[];
  },
) {
  const adultIds = new Set(references.members.filter((member) => member.memberType === "adult").map((member) => member.id));
  const resourceIds = new Set(references.resources.map((resource) => resource.id));
  const placeIds = new Set(references.places.map((place) => place.id));

  if (!input.title.trim()) throw new Error("Give this admin item a title.");
  if (!HOUSEHOLD_ADMIN_CATEGORIES.includes(input.category)) throw new Error("Choose a valid category.");
  if (!HOUSEHOLD_ADMIN_TYPES.includes(input.adminType)) throw new Error("Choose a valid admin type.");
  if (!HOUSEHOLD_ADMIN_STATUSES.includes(input.status)) throw new Error("Choose a valid status.");
  if (!HOUSEHOLD_ADMIN_CYCLES.includes(input.renewalCycle)) throw new Error("Choose a valid renewal cycle.");

  for (const [label, value] of [["due date", input.dueDate], ["start date", input.startDate], ["last completed date", input.lastCompletedDate]] as const) {
    if (value && !validDateKey(value)) throw new Error(`Choose a valid ${label}.`);
  }

  if (input.customCycleMonths !== undefined && (!Number.isInteger(input.customCycleMonths) || input.customCycleMonths < 1 || input.customCycleMonths > 60)) {
    throw new Error("Custom cycle months must be a whole number between 1 and 60.");
  }
  if (input.renewalCycle === "custom" && !input.customCycleMonths) throw new Error("Add custom cycle months.");
  if (input.ownerMemberId && !adultIds.has(input.ownerMemberId)) throw new Error("Ownership can only be assigned to Phil or Beck.");
  if (input.relatedResourceId && !resourceIds.has(input.relatedResourceId)) throw new Error("The related resource no longer exists.");
  if (input.relatedPlaceId && !placeIds.has(input.relatedPlaceId)) throw new Error("The related place no longer exists.");
  if (input.costAmount !== undefined && (!Number.isFinite(input.costAmount) || input.costAmount < 0)) throw new Error("Cost must be zero or more.");
  if (input.costCurrency !== undefined && input.costCurrency !== "GBP") throw new Error("Only GBP is supported for costs.");
  if (input.reminderDaysBefore !== undefined) {
    if (!Array.isArray(input.reminderDaysBefore) || input.reminderDaysBefore.some((value) => !Number.isInteger(value) || value < 0 || value > 365)) {
      throw new Error("Reminder days must be whole numbers between 0 and 365.");
    }
  }
}
