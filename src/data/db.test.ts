import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { DATABASE_NAME } from "../domain/constants";
import { LawrenceLoopDatabase } from "./db";

const legacySchema = {
  households: "&id",
  familyMembers: "&id, memberType, active",
  resources: "&id, resourceType, active",
  places: "&id, name, placeType",
  events: "&id, startAt, endAt, category, status",
  eventSeries: "&id",
  templates: "&id, name, category",
  settings: "&id",
  auditLog: "&id, timestamp, entityType, entityId",
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
};

afterEach(async () => {
  await Dexie.delete(DATABASE_NAME);
});

describe("database migration", () => {
  it("adds celebration stores and preserves existing event data", async () => {
    const legacy = new Dexie(DATABASE_NAME);
    legacy.version(11).stores(legacySchema);
    await legacy.open();
    await legacy.table("events").add({
      id: "event_legacy",
      title: "Legacy event",
      category: "family_social",
      status: "confirmed",
      startAt: "2026-06-29T09:00:00.000Z",
      endAt: "2026-06-29T10:00:00.000Z",
      allDay: false,
      participants: ["member_phil"],
      responsibleAdults: [],
      prepTasks: [],
      resourceNeeds: [],
      createdAt: "2026-06-29T08:00:00.000Z",
      updatedAt: "2026-06-29T08:00:00.000Z",
    });
    await legacy.table("settings").put({ id: "app_data_schema", value: "lawrence-loop-data-v11" });
    await legacy.close();

    const migrated = new LawrenceLoopDatabase();
    await migrated.open();

    expect(await migrated.events.get("event_legacy")).toMatchObject({ title: "Legacy event" });
    expect(migrated.tables.some((table) => table.name === "celebrationOccasions")).toBe(true);
    expect(migrated.tables.some((table) => table.name === "giftPlans")).toBe(true);
    expect((await migrated.settings.get("app_data_schema"))?.value).toBe("lawrence-loop-data-v12");

    await migrated.close();
  });
});
