export type MemberType = "adult" | "child" | "pet";

export type ResourceType = "car" | "equipment" | "room" | "other";

export type EventCategory =
  | "school"
  | "club"
  | "lesson"
  | "birthday_party"
  | "playdate"
  | "family_social"
  | "medical"
  | "dentist"
  | "vet"
  | "work"
  | "travel"
  | "baby_group"
  | "photography"
  | "dog_care"
  | "household_admin"
  | "reminder_only";

export type ResourceNeedStatus = "required" | "maybe" | "not_required";
export type CarNeed = ResourceNeedStatus;

export type EventStatus =
  | "planned"
  | "confirmed"
  | "tentative"
  | "cancelled"
  | "completed";

export type PlaceType =
  | "home"
  | "school"
  | "club"
  | "medical"
  | "vet"
  | "office"
  | "social"
  | "travel"
  | "other";

export type PrepTaskStatus = "open" | "done" | "skipped";
export type PrepTaskPriority = "normal" | "important" | "critical";

export interface ResourceNeed {
  id: string;
  resourceId: string;
  needStatus: ResourceNeedStatus;
  neededFrom?: string;
  neededUntil?: string;
  allocatedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ResourceNeedInput = Omit<ResourceNeed, "createdAt" | "updatedAt">;

export interface PrepTask {
  id: string;
  title: string;
  ownerIds: string[];
  dueAt?: string;
  priority: PrepTaskPriority;
  status: PrepTaskStatus;
  blocksEvent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PrepTaskInput = Omit<PrepTask, "createdAt" | "updatedAt">;
export type NewPrepTaskInput = Omit<PrepTask, "id" | "createdAt" | "updatedAt">;
export type PrepTaskUpdates = Partial<NewPrepTaskInput>;

export interface Household {
  id: string;
  name: string;
  timezone: string;
  defaultStartOfWeek: "monday" | "sunday";
}

export interface FamilyMember {
  id: string;
  displayName: string;
  memberType: MemberType;
  defaultResponsibleAdults?: string[];
  active: boolean;
}

export interface Resource {
  id: string;
  name: string;
  resourceType: ResourceType;
  shared: boolean;
  active: boolean;
}

export interface StarterTemplate {
  id: string;
  name: string;
  category: EventCategory;
  defaultDurationMinutes: number;
  defaultPrepTasks: string[];
  defaultCarNeed: CarNeed;
}

export interface Setting<T = unknown> {
  id: string;
  value: T;
  description?: string;
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  timestamp: string;
  summary: string;
}

export interface Place {
  id: string;
  name: string;
  placeType: PlaceType;
  address?: string;
  postcode?: string;
  defaultTravelMinutes?: number;
  travelNotes?: string;
  parkingNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyEvent {
  id: string;
  title: string;
  category: EventCategory;
  status: EventStatus;
  startAt: string;
  endAt: string;
  allDay: boolean;
  placeId?: string;
  participants: string[];
  responsibleAdults: string[];
  prepTasks: PrepTask[];
  resourceNeeds: ResourceNeed[];
  notes?: string;
  seriesId?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export type FamilyEventInput = Omit<FamilyEvent, "id" | "createdAt" | "updatedAt">;
export type FamilyEventUpdates = Partial<FamilyEventInput>;
export type PlaceInput = Omit<Place, "id" | "createdAt" | "updatedAt">;
export type PlaceUpdates = Partial<PlaceInput>;

export interface PrepTaskWithEvent {
  task: PrepTask;
  event: FamilyEvent;
}

export interface ResourceNeedWithEvent {
  need: ResourceNeed;
  event: FamilyEvent;
  resource: Resource;
}

export type ConflictType =
  | "car_clash"
  | "maybe_car_clash"
  | "unassigned_responsibility"
  | "prep_overdue"
  | "critical_prep_overdue";

export type ConflictSeverity = "warning" | "critical";

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  title: string;
  description: string;
  eventIds: string[];
  prepTaskId?: string;
  resourceId?: string;
}

export interface EventSeriesRecord {
  id: string;
  name: string;
}

export type SchoolPeriodType = "term" | "holiday";

export interface SchoolCalendarPeriod {
  id: string;
  label: string;
  type: SchoolPeriodType;
  startDate: string;
  endDate: string;
}

export type SchoolClosureType = "inset" | "bank_holiday" | "other_closed";

export interface SchoolClosureDay {
  id: string;
  date: string;
  type: SchoolClosureType;
  label: string;
}

export interface SchoolCalendar {
  id: string;
  childMemberId: "member_seb";
  schoolName: string;
  academicYearLabel: string;
  timezone: "Europe/London";
  periods: SchoolCalendarPeriod[];
  closureDays: SchoolClosureDay[];
  createdAt: string;
  updatedAt: string;
}

export type SchoolDayStatusReason = "term_weekday" | "weekend" | "holiday" | "inset" | "bank_holiday" | "other_closed" | "outside_known_calendar" | "no_calendar";

export interface SchoolDayStatus {
  date: string;
  isSchoolOpen: boolean;
  status: "open" | "closed" | "unknown";
  reason: SchoolDayStatusReason;
  label: string;
}

export type CountdownSourceType = "manual" | "event" | "school_period_start" | "school_period_end" | "school_closure" | "birthday" | "seasonal";
export type CountdownVisibility = "dashboard_primary" | "dashboard_secondary" | "hidden";

export interface CountdownTarget {
  id: string;
  title: string;
  targetDate: string;
  sourceType: CountdownSourceType;
  sourceId?: string;
  visibility: CountdownVisibility;
  showSleeps: boolean;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CountdownDisplay {
  id: string;
  title: string;
  targetDate: string;
  daysUntil: number;
  sleepsUntil: number;
  isToday: boolean;
  hasPassed: boolean;
  label: string;
  sourceType: CountdownSourceType;
  visibility: CountdownVisibility;
  showSleeps: boolean;
}

export type CountdownSuggestion = Omit<CountdownTarget, "createdAt" | "updatedAt" | "active" | "visibility" | "showSleeps">;
