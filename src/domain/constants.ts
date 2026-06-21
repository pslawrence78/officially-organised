import type { EventCategory, EventStatus, PlaceType, PrepTaskPriority, PrepTaskStatus, ResourceNeedStatus } from "./types";

export const DATABASE_NAME = "lawrence_loop_db";
export const DATABASE_SCHEMA_VERSION = 7;
export const APP_DATA_SCHEMA = "lawrence-loop-data-v7";
export const EXPORT_DATA_SCHEMA = "officially-organised-data-v2";
export const EXPORT_SCHEMA_VERSION = 2;
export const HOUSEHOLD_TIME_ZONE = "Europe/London";
export const FAMILY_CAR_RESOURCE_ID = "resource_family_car";
export const SCHOOL_LUNCH_TYPES = ["packed_lunch", "school_dinner", "home_lunch", "not_required", "unknown"] as const;
export const SCHOOL_ATTIRE_TYPES = ["school_uniform", "pe_kit", "non_uniform", "not_required", "unknown"] as const;

export const EVENT_CATEGORIES: EventCategory[] = [
  "school",
  "club",
  "lesson",
  "birthday_party",
  "playdate",
  "family_social",
  "medical",
  "dentist",
  "vet",
  "work",
  "travel",
  "baby_group",
  "photography",
  "dog_care",
  "household_admin",
  "reminder_only",
];

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  school: "School",
  club: "Club",
  lesson: "Lesson",
  birthday_party: "Birthday party",
  playdate: "Playdate",
  family_social: "Family social",
  medical: "Medical",
  dentist: "Dentist",
  vet: "Vet",
  work: "Work",
  travel: "Travel",
  baby_group: "Baby Group",
  photography: "Photography",
  dog_care: "Dog care",
  household_admin: "Household admin",
  reminder_only: "Reminder only",
};

export const EVENT_STATUSES: EventStatus[] = [
  "planned",
  "confirmed",
  "tentative",
  "cancelled",
  "completed",
];

export const STATUS_LABELS: Record<EventStatus, string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  tentative: "Tentative",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const PLACE_TYPES: PlaceType[] = [
  "home",
  "school",
  "club",
  "medical",
  "vet",
  "office",
  "social",
  "travel",
  "other",
];

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  home: "Home",
  school: "School",
  club: "Club",
  medical: "Medical",
  vet: "Vet",
  office: "Office",
  social: "Social",
  travel: "Travel",
  other: "Other",
};

export const PREP_TASK_STATUSES: PrepTaskStatus[] = ["open", "done", "skipped"];
export const PREP_TASK_STATUS_LABELS: Record<PrepTaskStatus, string> = {
  open: "Open",
  done: "Done",
  skipped: "Skipped",
};

export const PREP_TASK_PRIORITIES: PrepTaskPriority[] = ["normal", "important", "critical"];
export const PREP_TASK_PRIORITY_LABELS: Record<PrepTaskPriority, string> = {
  normal: "Normal",
  important: "Important",
  critical: "Critical",
};

export const RESOURCE_NEED_STATUSES: ResourceNeedStatus[] = ["required", "maybe", "not_required"];
export const RESOURCE_NEED_STATUS_LABELS: Record<ResourceNeedStatus, string> = {
  required: "Required",
  maybe: "Maybe needed",
  not_required: "Not required",
};
