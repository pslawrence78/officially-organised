import Dexie, { type EntityTable } from "dexie";
import {
  APP_DATA_SCHEMA,
  DATABASE_NAME,
  DATABASE_SCHEMA_VERSION,
} from "../domain/constants";
import type {
  AuditLogEntry,
  CelebrationOccasion,
  CountdownTarget,
  FamilyEvent,
  EventSeries,
  FamilyMember,
  GiftPlan,
  Household,
  Place,
  Resource,
  SchoolCalendar,
  SchoolHalfTermConfig,
  SchoolReadinessPrepAction,
  Setting,
  StarterTemplate,
  SyncDevice,
  SyncConflict,
  SyncSettings,
  SyncQueueItem,
  SyncState,
} from "../domain/types";
import type { WeatherForecastSnapshot } from "../types/weather";

export class LawrenceLoopDatabase extends Dexie {
  households!: EntityTable<Household, "id">;
  familyMembers!: EntityTable<FamilyMember, "id">;
  resources!: EntityTable<Resource, "id">;
  places!: EntityTable<Place, "id">;
  events!: EntityTable<FamilyEvent, "id">;
  eventSeries!: EntityTable<EventSeries, "id">;
  templates!: EntityTable<StarterTemplate, "id">;
  settings!: EntityTable<Setting, "id">;
  auditLog!: EntityTable<AuditLogEntry, "id">;
  celebrationOccasions!: EntityTable<CelebrationOccasion, "id">;
  giftPlans!: EntityTable<GiftPlan, "id">;
  schoolCalendars!: EntityTable<SchoolCalendar, "id">;
  schoolHalfTermConfigs!: EntityTable<SchoolHalfTermConfig, "id">;
  countdownTargets!: EntityTable<CountdownTarget, "id">;
  weatherForecasts!: EntityTable<WeatherForecastSnapshot, "id">;
  schoolReadinessPrepActions!: EntityTable<SchoolReadinessPrepAction, "id">;
  syncSettings!: EntityTable<SyncSettings, "id">;
  syncDevices!: EntityTable<SyncDevice, "id">;
  syncState!: EntityTable<SyncState, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;
  syncConflicts!: EntityTable<SyncConflict, "id">;

  constructor() {
    super(DATABASE_NAME);

    this.version(1).stores({
      households: "&id",
      familyMembers: "&id, memberType, active",
      resources: "&id, resourceType, active",
      places: "&id, name",
      events: "&id, startAt, endAt",
      eventSeries: "&id",
      templates: "&id, name, category",
      settings: "&id",
      auditLog: "&id, timestamp, entityType, entityId",
    });

    this.version(2)
      .stores({
        places: "&id, name, placeType",
        events: "&id, startAt, endAt, category, status",
      })
      .upgrade(async (transaction) => {
        const migratedAt = new Date().toISOString();

        await transaction.table("events").toCollection().modify((event) => {
          event.category ??= "family_social";
          event.status ??= "planned";
          event.allDay ??= false;
          event.participants ??= [];
          event.responsibleAdults ??= [];
          event.createdAt ??= migratedAt;
          event.updatedAt ??= migratedAt;
        });

        await transaction.table("places").toCollection().modify((place) => {
          place.placeType ??= "other";
          place.createdAt ??= migratedAt;
          place.updatedAt ??= migratedAt;
        });

        await transaction.table("settings").put({
          id: "app_data_schema",
          value: "lawrence-loop-data-v2",
          description: "Current application data schema identifier",
        });
      });

    this.version(3)
      .stores({
        events: "&id, startAt, endAt, category, status",
      })
      .upgrade(async (transaction) => {
        await transaction.table("events").toCollection().modify((event) => {
          event.prepTasks ??= [];
        });

        await transaction.table("settings").put({
          id: "app_data_schema",
          value: "lawrence-loop-data-v3",
          description: "Current application data schema identifier",
        });
      });

    this.version(DATABASE_SCHEMA_VERSION)
      .stores({
        events: "&id, startAt, endAt, category, status",
        celebrationOccasions: "&id, date, status, linkedEventId, linkedMemberId, updatedAt",
        giftPlans: "&id, celebrationId, linkedEventId, recipientMemberId, responsibleAdultId, archived, updatedAt",
        schoolCalendars: "&id, childMemberId, academicYearLabel",
        schoolHalfTermConfigs: "&id, schoolCalendarId, startDate, endDate, updatedAt",
        countdownTargets: "&id, targetDate, visibility, active, sourceType, sourceId",
        weatherForecasts: "&id, fetchedAt, provider",
        schoolReadinessPrepActions: "&id, schoolDate, status, sourceType, sourceKey, memberId, dueAt, [schoolDate+status], [sourceType+sourceKey]",
        syncSettings: "&id",
        syncDevices: "&id, label, createdAt, lastSeenAt",
        syncState: "&id, entityType, entityId, dirty, deleted, [entityType+entityId]",
        syncQueue: "&id, entityType, entityId, operation, queuedAt, [entityType+entityId]",
        syncConflicts: "&id, entityType, entityId, status, detectedAt, [entityType+entityId]",
      })
      .upgrade(async (transaction) => {
        await transaction.table("events").toCollection().modify((event) => {
          event.resourceNeeds ??= [];
        });

        await transaction.table("celebrationOccasions").toCollection().modify((celebration) => {
          celebration.ownerAdultIds ??= [];
          celebration.recurrence ??= "none";
          celebration.status ??= "planned";
          celebration.createdAt ??= new Date().toISOString();
          celebration.updatedAt ??= celebration.createdAt;
        });

        await transaction.table("giftPlans").toCollection().modify((giftPlan) => {
          giftPlan.giftStatus ??= "idea";
          giftPlan.cardStatus ??= "not_needed";
          giftPlan.rsvpStatus ??= "not_needed";
          giftPlan.archived ??= false;
          giftPlan.linkedPrepTaskIds ??= [];
          giftPlan.createdAt ??= new Date().toISOString();
          giftPlan.updatedAt ??= giftPlan.createdAt;
        });

        await transaction.table("settings").put({
          id: "app_data_schema",
          value: APP_DATA_SCHEMA,
          description: "Current application data schema identifier",
        });
      });
  }
}

export const db = new LawrenceLoopDatabase();

export const databaseMetadata = {
  name: DATABASE_NAME,
  schemaVersion: DATABASE_SCHEMA_VERSION,
  appDataSchema: APP_DATA_SCHEMA,
} as const;
