import Dexie, { type EntityTable } from "dexie";
import {
  APP_DATA_SCHEMA,
  DATABASE_NAME,
  DATABASE_SCHEMA_VERSION,
} from "../domain/constants";
import type {
  AuditLogEntry,
  CountdownTarget,
  FamilyEvent,
  EventSeriesRecord,
  FamilyMember,
  Household,
  Place,
  Resource,
  SchoolCalendar,
  Setting,
  StarterTemplate,
} from "../domain/types";

export class LawrenceLoopDatabase extends Dexie {
  households!: EntityTable<Household, "id">;
  familyMembers!: EntityTable<FamilyMember, "id">;
  resources!: EntityTable<Resource, "id">;
  places!: EntityTable<Place, "id">;
  events!: EntityTable<FamilyEvent, "id">;
  eventSeries!: EntityTable<EventSeriesRecord, "id">;
  templates!: EntityTable<StarterTemplate, "id">;
  settings!: EntityTable<Setting, "id">;
  auditLog!: EntityTable<AuditLogEntry, "id">;
  schoolCalendars!: EntityTable<SchoolCalendar, "id">;
  countdownTargets!: EntityTable<CountdownTarget, "id">;

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
        schoolCalendars: "&id, childMemberId, academicYearLabel",
        countdownTargets: "&id, targetDate, visibility, active, sourceType, sourceId",
      })
      .upgrade(async (transaction) => {
        await transaction.table("events").toCollection().modify((event) => {
          event.resourceNeeds ??= [];
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
