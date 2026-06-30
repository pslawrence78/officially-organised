import { createEvent, createHouseholdAdminItem } from "../data/repositories";
import type { EventSeriesInput, FamilyEventInput, FamilyMember, HouseholdAdminItemInput } from "../domain/types";
import { allDayEndIso, currentDateKey, dateKeyToIsoStart } from "../utils/dates";

export type QuickCaptureKind = "event" | "routine" | "admin";

export interface QuickCaptureDraft {
  title: string;
  kind: QuickCaptureKind;
  date: string;
  participantId?: string;
  ownerId?: string;
}

export type EventFormPrefill = Partial<FamilyEventInput>;
export type RoutineCapturePrefill = Omit<Partial<EventSeriesInput>, "recurrence"> & {
  recurrence?: Partial<EventSeriesInput["recurrence"]>;
};
export type HouseholdAdminPrefill = Partial<HouseholdAdminItemInput>;

export function defaultQuickCaptureDraft(): QuickCaptureDraft {
  return {
    title: "",
    kind: "event",
    date: currentDateKey(),
  };
}

export function getQuickCaptureTypeCopy(kind: QuickCaptureKind) {
  switch (kind) {
    case "event":
      return {
        title: "Event",
        description: "A one-off plan, appointment, trip or school item.",
      };
    case "routine":
      return {
        title: "Routine",
        description: "Something that repeats, like clubs, lessons or regular care.",
      };
    case "admin":
      return {
        title: "Admin/Renewal",
        description: "Something to renew, service, insure, check or follow up.",
      };
  }
}

export function buildQuickCaptureEventPrefill(draft: QuickCaptureDraft): EventFormPrefill {
  return {
    title: draft.title.trim(),
    category: "family_social",
    status: "confirmed",
    allDay: true,
    startAt: dateKeyToIsoStart(draft.date),
    endAt: allDayEndIso(draft.date),
    participants: draft.participantId ? [draft.participantId] : [],
    responsibleAdults: draft.ownerId ? [draft.ownerId] : [],
    prepTasks: [],
    resourceNeeds: [],
  };
}

export function buildQuickCaptureRoutinePrefill(draft: QuickCaptureDraft): RoutineCapturePrefill {
  const weekday = weekdayFromDateKey(draft.date);
  return {
    title: draft.title.trim(),
    category: "club",
    defaultParticipants: draft.participantId ? [draft.participantId] : [],
    defaultResponsibleAdults: draft.ownerId ? [draft.ownerId] : [],
    defaultPrepTasks: [],
    defaultResourceNeeds: [],
    recurrence: {
      startDate: draft.date,
      dayOfWeek: weekday,
    },
  };
}

export function buildQuickCaptureAdminPrefill(draft: QuickCaptureDraft): HouseholdAdminPrefill {
  return {
    title: draft.title.trim(),
    category: "other",
    adminType: "other",
    status: "active",
    dueDate: draft.date,
    renewalCycle: "none",
    ownerMemberId: draft.ownerId,
  };
}

export async function saveQuickCaptureEvent(draft: QuickCaptureDraft) {
  return createEvent(buildQuickCaptureEventPrefill(draft) as FamilyEventInput);
}

export async function saveQuickCaptureAdmin(draft: QuickCaptureDraft) {
  return createHouseholdAdminItem(buildQuickCaptureAdminPrefill(draft) as HouseholdAdminItemInput);
}

export function quickCaptureOwners(members: FamilyMember[]) {
  return members.filter((member) => member.active && member.memberType === "adult");
}

export function quickCaptureParticipants(members: FamilyMember[]) {
  return members.filter((member) => member.active);
}

function weekdayFromDateKey(dateKey: string): EventSeriesInput["recurrence"]["dayOfWeek"] {
  const weekdays: NonNullable<EventSeriesInput["recurrence"]["dayOfWeek"]>[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return weekdays[new Date(`${dateKey}T12:00:00Z`).getUTCDay()];
}
