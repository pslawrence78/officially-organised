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

export type CarNeed = "required" | "maybe" | "not_required";

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

export interface EventSeriesRecord {
  id: string;
  name: string;
}
