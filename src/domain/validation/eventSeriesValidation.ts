import type { EventSeriesInput, FamilyMember, Place, Resource } from "../types";

export type EventSeriesValidationErrors = Partial<Record<"title" | "frequency" | "startDate" | "endDate" | "day" | "duration" | "participants" | "responsibleAdults" | "placeId" | "resources", string>>;

export function validateEventSeries(input: EventSeriesInput, members: FamilyMember[], places: Place[], resources: Resource[]): EventSeriesValidationErrors {
  const errors: EventSeriesValidationErrors = {};
  if (!input.title.trim()) errors.title = "Enter a routine title.";
  if (!input.recurrence.frequency) errors.frequency = "Choose how often this routine repeats.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.recurrence.startDate)) errors.startDate = "Choose a start date.";
  if (input.recurrence.endDate && input.recurrence.endDate < input.recurrence.startDate) errors.endDate = "End date must be on or after the start date.";
  if (input.recurrence.frequency !== "monthly" && !input.recurrence.dayOfWeek) errors.day = "Choose a weekday.";
  if (input.recurrence.frequency === "monthly" && (!input.recurrence.dayOfMonth || input.recurrence.dayOfMonth < 1 || input.recurrence.dayOfMonth > 31)) errors.day = "Choose a day from 1 to 31.";
  if (!Number.isFinite(input.recurrence.durationMinutes) || input.recurrence.durationMinutes <= 0) errors.duration = "Duration must be more than zero.";
  const memberIds = new Set(members.map((item) => item.id));
  if (input.defaultParticipants.some((id) => !memberIds.has(id))) errors.participants = "A selected participant is no longer available.";
  const adultIds = new Set(members.filter((item) => item.memberType === "adult").map((item) => item.id));
  if (input.defaultResponsibleAdults.some((id) => !adultIds.has(id))) errors.responsibleAdults = "Responsible people must be adults in this household.";
  if (input.defaultPlaceId && !places.some((item) => item.id === input.defaultPlaceId)) errors.placeId = "The selected place is no longer available.";
  const resourceIds = new Set(resources.map((item) => item.id));
  if (input.defaultResourceNeeds.some((item) => !resourceIds.has(item.resourceId))) errors.resources = "A selected resource is no longer available.";
  return errors;
}

export class EventSeriesValidationError extends Error {
  constructor(public errors: EventSeriesValidationErrors) { super("Routine details need attention"); }
}
