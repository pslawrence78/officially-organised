import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { EventSeriesInput } from "../../domain/types";
import { calculateConflicts } from "../../services/conflictService";
import { localDateTimeToIso } from "../../utils/dates";
import { db } from "../db";
import { seedInitialDataIfNeeded } from "./appRepository";
import { createEvent, getEventsForDate } from "./eventRepository";
import { setPrepTaskStatus } from "./prepTaskRepository";
import { cancelOccurrence, createSeries, moveOccurrence } from "./eventSeriesRepository";

const input: EventSeriesInput = { title: "Monday club", category: "club", status: "active", recurrence: { frequency: "weekly", dayOfWeek: "monday", startDate: "2026-06-01", startTime: "17:00", durationMinutes: 60 }, defaultParticipants: ["member_seb"], defaultResponsibleAdults: [], defaultResourceNeeds: [{ id: "car", resourceId: "resource_family_car", needStatus: "required", beforeStartMinutes: 0, afterEndMinutes: 0 }], defaultPrepTasks: [{ id: "kit", title: "Pack kit", ownerIds: ["member_phil"], dueOffsetMinutes: -60, priority: "normal", blocksEvent: false }], exceptions: [] };
describe("event series repository integration", () => {
  beforeEach(async () => { await db.delete(); await db.open(); await seedInitialDataIfNeeded(); }); afterEach(async () => { await db.delete(); });
  it("creates a routine and merges its occurrence into event queries", async () => { const series = await createSeries(input); const events = await getEventsForDate("2026-06-22"); expect(events[0]).toMatchObject({ title: "Monday club", seriesId: series.id, occurrenceDate: "2026-06-22" }); });
  it("persists prep completion as an exception without changing defaults", async () => { const series = await createSeries(input); const event = (await getEventsForDate("2026-06-22"))[0]; await setPrepTaskStatus(event.id, event.prepTasks[0].id, "done"); expect((await getEventsForDate("2026-06-22"))[0].prepTasks[0].status).toBe("done"); expect((await getEventsForDate("2026-06-29"))[0].prepTasks[0].status).toBe("open"); expect((await db.eventSeries.get(series.id))?.defaultPrepTasks[0]).not.toHaveProperty("status"); });
  it("cancels and moves one occurrence without affecting the next", async () => { const series = await createSeries(input); await cancelOccurrence(series.id, "2026-06-22"); expect(await getEventsForDate("2026-06-22")).toEqual([]); expect(await getEventsForDate("2026-06-29")).toHaveLength(1); await moveOccurrence(series.id, "2026-06-29", "2026-06-30", "18:00"); expect(await getEventsForDate("2026-06-29")).toEqual([]); expect((await getEventsForDate("2026-06-30"))[0].occurrenceDate).toBe("2026-06-29"); });
  it("includes generated car needs in conflict detection", async () => { await createSeries(input); await createEvent({ title: "Other journey", category: "travel", status: "confirmed", startAt: localDateTimeToIso("2026-06-22T17:30"), endAt: localDateTimeToIso("2026-06-22T18:30"), allDay: false, participants: ["member_phil"], responsibleAdults: ["member_phil"], prepTasks: [], resourceNeeds: [{ id: "other_car", resourceId: "resource_family_car", needStatus: "required", neededFrom: localDateTimeToIso("2026-06-22T17:30"), neededUntil: localDateTimeToIso("2026-06-22T18:30") }] }); expect(calculateConflicts(await getEventsForDate("2026-06-22")).some((item) => item.type === "car_clash")).toBe(true); });
});
