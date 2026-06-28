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

export type SyncStatus = "never" | "success" | "warning" | "error";

export interface SyncSettings {
  id: "sync_settings";
  enabled: boolean;
  supabaseConfigured: boolean;
  householdId?: string;
  userId?: string;
  deviceId?: string;
  deviceLabel?: string;
  lastAuthCheckAt?: string;
  lastSyncAt?: string;
  lastSyncStatus: SyncStatus;
  lastSyncMessage?: string;
  queueCount?: number;
  conflictCount?: number;
  restoredSinceLastSync?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncDevice {
  id: string;
  label: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface SyncState {
  id: string;
  entityType: string;
  entityId: string;
  localUpdatedAt?: string;
  remoteUpdatedAt?: string;
  lastSyncedAt?: string;
  localPayloadHash?: string;
  remotePayloadHash?: string;
  dirty: boolean;
  deleted?: boolean;
}

export type SyncQueueOperation = "upsert" | "delete";

export interface SyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  operation: SyncQueueOperation;
  queuedAt: string;
}

export type SyncConflictStatus =
  | "open"
  | "resolved_keep_local"
  | "resolved_keep_remote"
  | "dismissed";

export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  localPayload: unknown;
  remotePayload: unknown;
  localUpdatedAt?: string;
  remoteUpdatedAt?: string;
  detectedAt: string;
  status: SyncConflictStatus;
  reason: string;
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
  occurrenceDate?: string;
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

export type RecurrenceFrequency = "weekly" | "fortnightly" | "monthly";
export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type EventSeriesStatus = "active" | "paused" | "archived";

export interface ResourceNeedTemplate {
  id: string;
  resourceId: string;
  needStatus: ResourceNeedStatus;
  beforeStartMinutes: number;
  afterEndMinutes: number;
  allocatedTo?: string;
  notes?: string;
}

export interface PrepTaskTemplate {
  id: string;
  title: string;
  ownerIds: string[];
  dueOffsetMinutes: number;
  priority: PrepTaskPriority;
  blocksEvent: boolean;
  notes?: string;
}

export interface EventSeriesException {
  id: string;
  occurrenceDate: string;
  type: "cancelled" | "moved" | "changed";
  movedToDate?: string;
  movedToStartTime?: string;
  movedToDurationMinutes?: number;
  responsibleAdults?: string[];
  placeId?: string;
  resourceNeeds?: ResourceNeed[];
  prepTasks?: PrepTask[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventSeries {
  id: string;
  title: string;
  category: EventCategory;
  status: EventSeriesStatus;
  recurrence: {
    frequency: RecurrenceFrequency;
    dayOfWeek?: Weekday;
    dayOfMonth?: number;
    startDate: string;
    endDate?: string;
    startTime: string;
    durationMinutes: number;
    termTimeOnly?: boolean;
  };
  defaultPlaceId?: string;
  defaultParticipants: string[];
  defaultResponsibleAdults: string[];
  defaultResourceNeeds: ResourceNeedTemplate[];
  defaultPrepTasks: PrepTaskTemplate[];
  notes?: string;
  exceptions: EventSeriesException[];
  createdAt: string;
  updatedAt: string;
}

export type EventSeriesInput = Omit<EventSeries, "id" | "createdAt" | "updatedAt">;
export type EventSeriesPatch = Partial<EventSeriesInput>;
export type EventSeriesRecord = EventSeries;

export interface EventOccurrence extends FamilyEvent {
  source: "event" | "series";
  seriesId?: string;
  occurrenceDate?: string;
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

export type SchoolLunchType = "packed_lunch" | "school_dinner" | "home_lunch" | "not_required" | "unknown";
export type SchoolAttireType = "school_uniform" | "pe_kit" | "non_uniform" | "not_required" | "unknown";

export interface ForestSchoolRequirement {
  required: boolean;
  wellingtonBoots: boolean;
  longTrousers: boolean;
  waterproofs?: boolean;
  notes?: string;
}

export interface SchoolDayRequirementEntry {
  id: string;
  schoolCalendarId: string;
  halfTermConfigId: string;
  date: string;
  schoolStatusAtCreation?: "open" | "closed" | "unknown";
  lunchType: SchoolLunchType;
  lunchChoice?: string;
  lunchNotes?: string;
  attireType: SchoolAttireType;
  attireNotes?: string;
  forestSchool: ForestSchoolRequirement;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolHalfTermConfig {
  id: string;
  schoolCalendarId: string;
  label: string;
  startDate: string;
  endDate: string;
  sourceNote?: string;
  entries: SchoolDayRequirementEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SchoolReadinessForDate {
  date: string;
  schoolStatus: "open" | "closed" | "unknown";
  schoolStatusLabel: string;
  hasConfiguration: boolean;
  configLabel?: string;
  lunch: { type: SchoolLunchType; label: string; choice?: string; notes?: string; isKnown: boolean };
  attire: { type: SchoolAttireType; label: string; notes?: string; isKnown: boolean };
  forestSchool: ForestSchoolRequirement;
  readinessItems: Array<{ id: string; label: string; severity: "info" | "warning" | "critical"; category: "lunch" | "attire" | "forest_school" | "unknown" }>;
}

export type SchoolPrepSourceType = "operational_school_readiness" | "weather_school_suggestion";
export type SchoolPrepCategory = "lunch" | "attire" | "pe" | "forest_school" | "weather" | "check_required" | "general_school";
export type SchoolPrepOwner = "member_phil" | "member_beck" | "either" | "both";
export type SchoolPrepStatus = "open" | "done" | "skipped" | "stale";

export interface SchoolReadinessPrepAction {
  id: string;
  householdId: string;
  memberId: string;
  schoolDate: string;
  sourceType: SchoolPrepSourceType;
  sourceKey: string;
  sourceVersion: string;
  title: string;
  detail?: string;
  category: SchoolPrepCategory;
  owner: SchoolPrepOwner;
  priority: PrepTaskPriority;
  status: SchoolPrepStatus;
  blocksSchoolReadiness: boolean;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  skippedAt?: string;
  staleAt?: string;
  staleReason?: string;
  originLabel: string;
}

export type SchoolReadinessPrepCandidate = Omit<SchoolReadinessPrepAction, "createdAt" | "updatedAt" | "status" | "completedAt" | "skippedAt" | "staleAt" | "staleReason">;

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
