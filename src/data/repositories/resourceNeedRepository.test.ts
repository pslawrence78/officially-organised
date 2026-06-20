import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FamilyEventInput, ResourceNeed } from "../../domain/types";
import { localDateTimeToIso } from "../../utils/dates";
import { db } from "../db";
import { seedInitialDataIfNeeded } from "./appRepository";
import { createEvent, updateEvent } from "./eventRepository";
import { getResourceNeeds } from "./resourceNeedRepository";

function need(overrides: Partial<ResourceNeed> = {}): ResourceNeed {
  const timestamp = new Date().toISOString();
  return { id: `resource_need_${crypto.randomUUID()}`, resourceId: "resource_family_car", needStatus: "required", neededFrom: localDateTimeToIso("2026-06-22T16:30"), neededUntil: localDateTimeToIso("2026-06-22T18:30"), allocatedTo: "member_phil", createdAt: timestamp, updatedAt: timestamp, ...overrides };
}

function eventInput(resourceNeeds: ResourceNeed[]): FamilyEventInput {
  return { title: "Seb swimming", category: "lesson", status: "confirmed", startAt: localDateTimeToIso("2026-06-22T17:30"), endAt: localDateTimeToIso("2026-06-22T18:00"), allDay: false, participants: ["member_seb"], responsibleAdults: ["member_phil"], prepTasks: [], resourceNeeds };
}

describe("resource need repository", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });
  afterEach(async () => { await db.delete(); });

  it("aggregates car needs with their events in resource-window order", async () => {
    await createEvent(eventInput([need({ neededFrom: localDateTimeToIso("2026-06-22T18:00"), neededUntil: localDateTimeToIso("2026-06-22T19:00") })]));
    await createEvent({ ...eventInput([need({ neededFrom: localDateTimeToIso("2026-06-22T08:30"), neededUntil: localDateTimeToIso("2026-06-22T13:30"), needStatus: "maybe" })]), title: "Oracle office" });
    expect((await getResourceNeeds("resource_family_car")).map(({ event }) => event.title)).toEqual(["Oracle office", "Seb swimming"]);
  });

  it("writes created, updated and deleted resource-need audit entries", async () => {
    const carNeed = need();
    const event = await createEvent(eventInput([carNeed]));
    await updateEvent(event.id, { resourceNeeds: [{ ...carNeed, needStatus: "maybe", updatedAt: new Date(Date.parse(carNeed.updatedAt) + 1).toISOString() }] });
    await updateEvent(event.id, { resourceNeeds: [] });
    expect((await db.auditLog.where("entityId").equals(carNeed.id).toArray()).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map((entry) => entry.action)).toEqual(["created", "updated", "deleted"]);
  });
});
