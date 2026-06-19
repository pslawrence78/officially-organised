import { EVENT_CATEGORIES, EVENT_STATUSES } from "../constants";
import type { FamilyEventInput, FamilyMember, Place } from "../types";

export type ValidationErrors = Record<string, string>;

export function validateEventInput(
  input: FamilyEventInput,
  familyMembers: FamilyMember[],
  places: Place[],
): ValidationErrors {
  const errors: ValidationErrors = {};
  const memberIds = new Set(familyMembers.map((member) => member.id));
  const adultIds = new Set(familyMembers.filter((member) => member.memberType === "adult").map((member) => member.id));

  if (!input.title.trim()) errors.title = "Give the event a title.";
  if (!EVENT_CATEGORIES.includes(input.category)) errors.category = "Choose a valid category.";
  if (!EVENT_STATUSES.includes(input.status)) errors.status = "Choose a valid status.";
  if (!input.startAt || Number.isNaN(Date.parse(input.startAt))) errors.startAt = "Choose a valid start.";
  if (!input.endAt || Number.isNaN(Date.parse(input.endAt))) errors.endAt = "Choose a valid end.";
  if (!errors.startAt && !errors.endAt && Date.parse(input.endAt) <= Date.parse(input.startAt)) {
    errors.endAt = "The event must end after it starts.";
  }
  if (input.participants.length === 0) errors.participants = "Choose at least one participant.";
  if (input.participants.some((id) => !memberIds.has(id))) errors.participants = "One of the selected participants is unavailable.";
  if (input.responsibleAdults.some((id) => !adultIds.has(id))) errors.responsibleAdults = "Responsibility can only be assigned to an adult.";
  if (input.placeId && !places.some((place) => place.id === input.placeId)) errors.placeId = "The selected place is unavailable.";

  return errors;
}

export class EventValidationError extends Error {
  constructor(public readonly errors: ValidationErrors) {
    super("The event could not be saved.");
    this.name = "EventValidationError";
  }
}
