import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FamilyEventInput } from "../../domain/types";
import { localDateTimeToIso } from "../../utils/dates";
import { db } from "../db";
import { seedInitialDataIfNeeded } from "./appRepository";
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  getEventsForDate,
  getEventsForDateRange,
  updateEvent,
} from "./eventRepository";

function eventInput(title: string, start: string, end: string): FamilyEventInput {
  return {
    title,
    category: "lesson",
    status: "confirmed",
    startAt: localDateTimeToIso(start),
    endAt: localDateTimeToIso(end),
    allDay: false,
    participants: ["member_seb"],
    responsibleAdults: ["member_phil"],
    prepTasks: [],
    resourceNeeds: [],
  };
}

describe("event repository", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("creates and reads an event with an audit entry", async () => {
    const created = await createEvent(eventInput("Swimming", "2026-06-22T17:30", "2026-06-22T18:00"));

    await expect(getEventById(created.id)).resolves.toEqual(created);
    expect(await db.auditLog.where("entityId").equals(created.id).first()).toMatchObject({ action: "created" });
  });

  it("updates an event and advances updatedAt", async () => {
    const created = await createEvent(eventInput("Swimming", "2026-06-22T17:30", "2026-06-22T18:00"));
    const updated = await updateEvent(created.id, { title: "Seb swimming", notes: "Bring goggles" });

    expect(updated.title).toBe("Seb swimming");
    expect(updated.notes).toBe("Bring goggles");
    expect(Date.parse(updated.updatedAt)).toBeGreaterThan(Date.parse(created.updatedAt));
  });

  it("deletes an event without deleting its audit history", async () => {
    const created = await createEvent(eventInput("Swimming", "2026-06-22T17:30", "2026-06-22T18:00"));
    await deleteEvent(created.id);

    await expect(getEventById(created.id)).resolves.toBeUndefined();
    expect(await db.auditLog.where("entityId").equals(created.id).toArray()).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "deleted" })]),
    );
  });

  it("queries dates and ranges chronologically", async () => {
    await createEvent(eventInput("Later", "2026-06-22T18:00", "2026-06-22T19:00"));
    await createEvent(eventInput("Earlier", "2026-06-22T09:00", "2026-06-22T10:00"));
    await createEvent(eventInput("Tomorrow", "2026-06-23T09:00", "2026-06-23T10:00"));

    expect((await getEvents()).map((event) => event.title)).toEqual(["Earlier", "Later", "Tomorrow"]);
    expect((await getEventsForDate("2026-06-22")).map((event) => event.title)).toEqual(["Earlier", "Later"]);
    expect((await getEventsForDateRange(new Date(localDateTimeToIso("2026-06-22T12:00")), new Date(localDateTimeToIso("2026-06-24T00:00")))).map((event) => event.title)).toEqual(["Later", "Tomorrow"]);
  });
});
