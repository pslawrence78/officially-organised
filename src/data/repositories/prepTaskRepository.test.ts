import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FamilyEventInput, NewPrepTaskInput } from "../../domain/types";
import { localDateTimeToIso } from "../../utils/dates";
import { db } from "../db";
import { seedInitialDataIfNeeded } from "./appRepository";
import { createEvent, getEventById, updateEvent } from "./eventRepository";
import { addPrepTask, deletePrepTask, getPrepTasks, setPrepTaskStatus, updatePrepTask } from "./prepTaskRepository";

const baseTask: NewPrepTaskInput = {
  title: "Pack swimming kit",
  ownerIds: ["member_phil"],
  dueAt: localDateTimeToIso("2026-06-22T16:00"),
  priority: "important",
  status: "open",
  blocksEvent: true,
};

function eventInput(prepTasks: FamilyEventInput["prepTasks"] = []): FamilyEventInput {
  return {
    title: "Seb swimming",
    category: "lesson",
    status: "confirmed",
    startAt: localDateTimeToIso("2026-06-22T17:30"),
    endAt: localDateTimeToIso("2026-06-22T18:00"),
    allDay: false,
    participants: ["member_seb"],
    responsibleAdults: ["member_phil"],
    prepTasks,
  };
}

describe("preparation task repository", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("adds, edits, ticks, skips and deletes an embedded task", async () => {
    const event = await createEvent(eventInput());
    const task = await addPrepTask(event.id, baseTask);
    expect((await getEventById(event.id))?.prepTasks).toEqual([task]);

    const edited = await updatePrepTask(event.id, task.id, { title: "Pack kit and goggles", ownerIds: ["member_phil", "member_beck"] });
    expect(edited).toMatchObject({ title: "Pack kit and goggles", ownerIds: ["member_phil", "member_beck"] });
    await expect(setPrepTaskStatus(event.id, task.id, "done")).resolves.toMatchObject({ status: "done" });
    await expect(setPrepTaskStatus(event.id, task.id, "skipped")).resolves.toMatchObject({ status: "skipped" });

    await deletePrepTask(event.id, task.id);
    expect((await getEventById(event.id))?.prepTasks).toEqual([]);
    expect((await db.auditLog.where("entityId").equals(task.id).toArray()).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map((entry) => entry.action)).toEqual(["created", "updated", "updated", "updated", "deleted"]);
  });

  it("aggregates tasks with their events and sorts open due work first", async () => {
    const firstEvent = await createEvent(eventInput());
    const secondEvent = await createEvent({ ...eventInput(), title: "Birthday party" });
    await addPrepTask(secondEvent.id, { ...baseTask, title: "Buy present", dueAt: localDateTimeToIso("2026-06-21T18:00"), priority: "critical" });
    await addPrepTask(firstEvent.id, baseTask);

    expect((await getPrepTasks()).map(({ task, event }) => `${task.title}:${event.title}`)).toEqual([
      "Buy present:Birthday party",
      "Pack swimming kit:Seb swimming",
    ]);
  });

  it("writes task-level audit diffs when tasks change inside event editing", async () => {
    const timestamp = new Date().toISOString();
    const task = { ...baseTask, id: "prep_pack_kit", createdAt: timestamp, updatedAt: timestamp };
    const event = await createEvent(eventInput([task]));
    await updateEvent(event.id, { prepTasks: [{ ...task, title: "Pack full swimming kit", updatedAt: new Date(Date.parse(timestamp) + 1).toISOString() }] });
    await updateEvent(event.id, { prepTasks: [] });

    expect((await db.auditLog.where("entityId").equals(task.id).toArray()).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map((entry) => entry.action)).toEqual(["created", "updated", "deleted"]);
  });
});
